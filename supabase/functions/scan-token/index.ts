
import { createClient } from '@supabase/supabase-js';
import { TokenMetrics } from './types.ts';  // Local import using relative path
import { formatCurrency } from './utils.ts'; // Local import using relative path

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Cache duration in seconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60;

// Progress update callback type
type ProgressCallback = (progress: number) => void;

// First, let's define our required types locally for the edge function
interface TokenDetails {
  id: string;
  symbol: string;
  name: string;
  market_cap_rank?: number;
  asset_platform_id?: string;
  platforms?: Record<string, string>;
  description?: {
    en?: string;
  };
  market_data?: {
    current_price?: Record<string, number>;
    market_cap?: Record<string, number>;
    total_volume?: Record<string, number>;
    max_supply?: number;
    circulating_supply?: number;
    total_supply?: number;
  };
  community_data?: {
    twitter_followers?: number;
    reddit_subscribers?: number;
    telegram_channel_user_count?: number;
  };
  developer_data?: {
    forks?: number;
    stars?: number;
    subscribers?: number;
    total_issues?: number;
    closed_issues?: number;
    pull_request_contributors?: number;
    commit_count_4_weeks?: number;
  };
  links?: {
    homepage?: string[];
    blockchain_site?: string[];
    repos_url?: {
      github?: string[];
      bitbucket?: string[];
    };
    twitter_screen_name?: string;
    telegram_channel_identifier?: string;
  };
  tickers?: any[];
}

interface GoPlusSecurityData {
  ownershipRenounced?: boolean;
  canMint?: boolean;
  hasBlacklist?: boolean;
  slippageModifiable?: boolean;
  isHoneypot?: boolean;
  ownerCanChangeBalance?: boolean;
  isProxy?: boolean;
  hasExternalCalls?: boolean;
  transferPausable?: boolean;
  isSelfdestructable?: boolean;
  isOpenSource?: boolean;
  buyTax?: string;
  sellTax?: string;
  riskLevel?: string;
}

// The handler function for the edge function
const handler = async (req: Request) => {
  try {
    const { tokenId } = await req.json();
    
    if (!tokenId) {
      return new Response(JSON.stringify({ error: 'Token ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check for cached data
    const { data: cachedData } = await supabaseClient
      .from('token_data_cache')
      .select('data')
      .eq('token_id', tokenId)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
      
    if (cachedData?.data) {
      console.log("Returning cached data for token:", tokenId);
      return new Response(JSON.stringify(cachedData.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Fetch token details from CoinGecko
    const tokenDetails = await fetchTokenDetails(tokenId);
    if (!tokenDetails) {
      return new Response(JSON.stringify({ error: 'Token not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Calculate metrics
    const metrics = calculateHealthMetrics(tokenDetails);
    
    // Cache the results
    await cacheTokenData(tokenId, metrics);
    
    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in scan-token function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Fetch token details from CoinGecko
async function fetchTokenDetails(tokenId: string): Promise<TokenDetails | null> {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true`);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API returned ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching token details:", error);
    return null;
  }
}

// Fetch security data from GoPlus
async function fetchSecurityData(tokenAddress: string): Promise<GoPlusSecurityData | null> {
  try {
    const response = await fetch(`https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=${tokenAddress}`);
    
    if (!response.ok) {
      throw new Error(`GoPlus API returned ${response.status}`);
    }
    
    const data = await response.json();
    return data.result && data.result[tokenAddress.toLowerCase()] 
      ? data.result[tokenAddress.toLowerCase()] 
      : null;
  } catch (error) {
    console.error("Error fetching security data:", error);
    return null;
  }
}

// Calculate health metrics based on token data
function calculateHealthMetrics(tokenDetails: TokenDetails): TokenMetrics {
  // Calculate scores for each category
  const securityScore = 70;  // Default score
  const liquidityScore = 65;  // Default score
  const tokenomicsScore = 60;  // Default score
  const communityScore = 65;  // Default score
  const developmentScore = 70;  // Default score
  
  // Calculate overall health score
  const healthScore = Math.round(
    (securityScore + liquidityScore + tokenomicsScore + communityScore + developmentScore) / 5
  );
  
  // Extract contract address from platforms if available
  let contractAddress;
  if (tokenDetails.platforms) {
    for (const [platform, address] of Object.entries(tokenDetails.platforms)) {
      if (address && typeof address === 'string') {
        contractAddress = address;
        break;
      }
    }
  }

  // Format market cap
  const marketCap = tokenDetails.market_data?.market_cap?.usd 
    ? formatCurrency(tokenDetails.market_data.market_cap.usd)
    : 'Unknown';
  
  // Create the metrics object
  const metrics: TokenMetrics = {
    name: tokenDetails.name,
    symbol: tokenDetails.symbol.toUpperCase(),
    marketCap,
    categories: {
      security: { score: securityScore },
      liquidity: { score: liquidityScore },
      tokenomics: { score: tokenomicsScore },
      community: { score: communityScore },
      development: { score: developmentScore }
    },
    healthScore,
    lastUpdated: Date.now(),
    // Enhanced token info fields from CoinGecko API
    description: tokenDetails.description?.en,
    website: tokenDetails.links?.homepage?.[0],
    twitterUrl: tokenDetails.links?.twitter_screen_name,
    githubUrl: tokenDetails.links?.repos_url?.github?.[0],
    tokenType: tokenDetails.asset_platform_id 
      ? `${tokenDetails.asset_platform_id.charAt(0).toUpperCase() + tokenDetails.asset_platform_id.slice(1)} Token` 
      : "Native Token",
    network: tokenDetails.asset_platform_id || "ethereum",
    etherscan: {
      contractAddress
    },
    dataQuality: "partial"
  };
  
  return metrics;
}

// Cache token data
async function cacheTokenData(tokenId: string, data: TokenMetrics): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + CACHE_DURATION);
    
    await supabaseClient
      .from('token_data_cache')
      .upsert({
        token_id: tokenId,
        data: data as unknown as Record<string, any>,
        expires_at: expiresAt.toISOString(),
        last_updated: new Date().toISOString()
      });
  } catch (error) {
    console.error("Error caching token data:", error);
  }
}

// Utility function for formatting currency
function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}

// Export the required types for the edge function
export interface TokenMetrics {
  name: string;
  symbol: string;
  marketCap?: string;
  tvl?: string;
  liquidityLock?: string;
  topHoldersPercentage?: string;
  auditStatus?: string;
  socialFollowers?: string;
  poolAge?: string;
  volume24h?: string;
  txCount24h?: number;
  network?: string;
  categories: {
    security: { score: number };
    liquidity: { score: number };
    tokenomics: { score: number };
    community: { score: number };
    development: { score: number };
  };
  healthScore: number;
  lastUpdated?: number;
  dataQuality?: "complete" | "partial";
  goPlus?: GoPlusSecurityData;
  etherscan?: {
    contractAddress?: string;
  };
  defiLlama?: any;
  tvlSparkline?: {
    data: number[];
    trend: 'up' | 'down';
    change: number;
  };
  poolAddress?: string;
  dataSources?: string[];
  description?: string;
  website?: string;
  twitterUrl?: string;
  githubUrl?: string;
  explorerUrl?: string;
  whitepaper?: string;
  launchDate?: string;
  tokenType?: string;
}

// Listen for requests
Deno.serve(handler);
