import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from "../_shared/cors.ts";
import { formatCurrency, formatNumber } from "../_shared/formatters.ts";

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API keys 
const ETHERSCAN_API_KEY = Deno.env.get('ETHERSCAN_API_KEY') || '';
const GOPLUS_API_KEY = Deno.env.get('GOPLUS_API_KEY') || '';
const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY') || '';

// Check API keys and log warnings
console.log(`API key status: ETHERSCAN (${ETHERSCAN_API_KEY ? 'Present' : 'Missing'}), GOPLUS (${GOPLUS_API_KEY ? 'Present' : 'Missing'}), APIFY (${APIFY_API_KEY ? 'Present' : 'Missing'})`);

interface TokenMetricsResponse {
  metrics: {
    marketCap: string;
    marketCapValue: number;
    marketCapChange24h: number;
    currentPrice: number;
    priceChange24h: number;
    liquidityLock: string;
    liquidityLockDays: number;
    topHoldersPercentage: string;
    topHoldersValue: number;
    topHoldersTrend: 'up' | 'down' | null;
    topHolders?: Array<{
      address: string;
      percentage: number;
      value?: string;
    }>;
    tvl: string;
    tvlValue: number;
    tvlChange24h: number;
    auditStatus: string;
    socialFollowers: string;
    socialFollowersCount: number;
    socialFollowersChange: number;
    socialFollowersFromCache?: boolean; 
    githubActivity?: string;
    githubCommits?: number;
    fromCache?: boolean;
    
    // Security metrics
    ownershipRenounced?: string;
    freezeAuthority?: string;
    codeAudit?: string;
    multiSigWallet?: string;
    bugBounty?: string;
    securityScore?: number;
    
    // Liquidity metrics
    liquidityScore?: number;
    dexDepth?: string;
    dexDepthValue?: number;
    cexListings?: string;
    
    // Tokenomics metrics
    tokenomicsScore?: number;
    supplyCap?: string;
    supplyCapValue?: number;
    supplyCapExists?: boolean;
    tokenDistribution?: string;
    tokenDistributionValue?: number;
    tokenDistributionRating?: string;
    treasurySize?: string;
    treasurySizeValue?: number;
    burnMechanism?: string;
    tokenomicsAnalysis?: {
      tvl_usd: number;
      supply_cap: number;
      token_distribution_rating: string;
      treasury_estimate: number | null;
      burn_mechanism: string;
    };
    
    // Additional section scores
    communityScore?: number;
    developmentScore?: number;
  };
  cacheHit: boolean;
  socialFollowersFromCache?: boolean;
}

// Enhanced with retry capability
async function fetchWithRetry(url: string, options: RequestInit, retries = 2, delay = 1000): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (response.ok) return response;
    
    if (retries <= 0) {
      console.warn(`Fetch failed after all retries: ${url}`);
      return response; // Return failed response after all retries
    }
    
    console.log(`Retry attempt for ${url}, retries left: ${retries}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 1.5);
  } catch (error) {
    if (retries <= 0) throw error;
    
    console.log(`Error fetching ${url}, retrying... (${retries} left)`, error);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 1.5);
  }
}

async function getTokenData(tokenId: string) {
  try {
    console.log(`Fetching token data from CoinGecko for ${tokenId}`);
    const response = await fetchWithRetry(
      `https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&market_data=true`, 
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status}`);
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching token data:', error);
    return null;
  }
}

async function getTVL(tokenId: string, network: string, tokenAddress: string) {
  try {
    console.log(`Fetching TVL data from CoinGecko for ${tokenId}`);
    
    // First try getting TVL directly from CoinGecko
    const response = await fetchWithRetry(
      `https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`, 
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status}`);
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if the token has TVL data
    let tvlValue = 0;
    let tvlChange24h = 0;
    
    if (data.market_data && data.market_data.total_value_locked && data.market_data.total_value_locked.usd) {
      tvlValue = data.market_data.total_value_locked.usd || 0;
      tvlChange24h = data.market_data.total_value_locked_24h_percentage_change || 0;
      console.log(`Found TVL data from CoinGecko: ${tvlValue}`);
      
      return { 
        tvl: tvlValue > 0 ? formatCurrency(tvlValue) : "N/A", 
        tvlValue, 
        tvlChange24h 
      };
    }
    
    // If no TVL from CoinGecko and we have a token address, try GeckoTerminal as fallback
    if (tokenAddress && !tvlValue) {
      console.log(`No TVL data found in CoinGecko, trying GeckoTerminal fallback for ${tokenAddress}`);
      return await getTVLFromGeckoTerminal(network, tokenAddress);
    }
    
    return { 
      tvl: tvlValue > 0 ? formatCurrency(tvlValue) : "N/A", 
      tvlValue, 
      tvlChange24h 
    };
  } catch (error) {
    console.error('Error fetching TVL data from CoinGecko:', error);
    
    // Try GeckoTerminal as fallback if we have a token address
    if (tokenAddress) {
      console.log(`Trying GeckoTerminal as fallback for TVL data for ${tokenAddress}`);
      return await getTVLFromGeckoTerminal(network, tokenAddress);
    }
    
    return { tvl: "N/A", tvlValue: 0, tvlChange24h: 0 };
  }
}

// New function to get TVL from GeckoTerminal as a fallback
async function getTVLFromGeckoTerminal(network: string, tokenAddress: string) {
  if (!tokenAddress) {
    return { tvl: "N/A", tvlValue: 0, tvlChange24h: 0 };
  }
  
  try {
    // Map network to GeckoTerminal network ID
    const geckoNetwork = mapNetworkToGeckoTerminal(network);
    if (!geckoNetwork) {
      console.log(`Unsupported network for GeckoTerminal TVL fallback: ${network}`);
      return { tvl: "N/A", tvlValue: 0, tvlChange24h: 0 };
    }
    
    // Fetch pools data from GeckoTerminal API
    const url = `https://api.geckoterminal.com/api/v2/networks/${geckoNetwork}/tokens/${tokenAddress.toLowerCase()}/pools`;
    console.log(`Fetching TVL data from GeckoTerminal: ${url}`);
    
    const response = await fetchWithRetry(url, {
      headers: {
        'Accept': 'application/json'
      }
    }, 3, 1000);
    
    if (!response.ok) {
      console.error(`GeckoTerminal API error: ${response.status}`);
      return { tvl: "N/A", tvlValue: 0, tvlChange24h: 0 };
    }
    
    const data = await response.json();
    console.log('GeckoTerminal API response received for TVL fallback');
    
    if (!data.data || data.data.length === 0) {
      console.log('No pools found in GeckoTerminal');
      return { tvl: "N/A", tvlValue: 0, tvlChange24h: 0 };
    }
    
    // Calculate total liquidity across all pools as a TVL approximation
    let totalLiquidity = 0;
    
    for (const pool of data.data) {
      if (pool.attributes && pool.attributes.reserve_in_usd) {
        const poolLiquidity = parseFloat(pool.attributes.reserve_in_usd);
        if (!isNaN(poolLiquidity)) {
          totalLiquidity += poolLiquidity;
        }
      }
    }
    
    console.log(`Calculated TVL from GeckoTerminal pools: $${totalLiquidity.toFixed(2)}`);
    
    return {
      tvl: totalLiquidity > 0 ? formatCurrency(totalLiquidity) : "N/A",
      tvlValue: totalLiquidity,
      tvlChange24h: 0 // GeckoTerminal doesn't provide change data
    };
  } catch (error) {
    console.error('Error fetching TVL data from GeckoTerminal:', error);
    return { tvl: "N/A", tvlValue: 0, tvlChange24h: 0 };
  }
}

// New function to get supply cap data
async function getSupplyCap(tokenId: string) {
  try {
    console.log(`Fetching supply cap data for ${tokenId}`);
    
    // Use CoinGecko API to get max_supply
    const response = await fetchWithRetry(
      `https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&market_data=true`, 
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status}`);
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if max_supply exists
    if (data.market_data && data.market_data.max_supply) {
      const maxSupply = data.market_data.max_supply;
      console.log(`Found max supply: ${maxSupply}`);
      
      return { 
        supplyCap: formatNumber(maxSupply),
        supplyCapValue: maxSupply,
        supplyCapExists: true
      };
    }
    
    console.log('No max supply data found');
    return { 
      supplyCap: "N/A", 
      supplyCapValue: 0,
      supplyCapExists: false
    };
  } catch (error) {
    console.error('Error fetching supply cap data:', error);
    return { 
      supplyCap: "N/A", 
      supplyCapValue: 0,
      supplyCapExists: false
    };
  }
}

// New function to get token distribution data
async function getTokenDistribution(network: string, tokenAddress: string) {
  if (!tokenAddress) {
    console.log('No token address provided for token distribution data');
    return { 
      tokenDistribution: "N/A",
      tokenDistributionValue: 0,
      tokenDistributionRating: "N/A"
    };
  }
  
  try {
    console.log(`Getting token distribution data for ${tokenAddress} on network ${network}`);
    
    // Get chain ID for the network
    const chainId = getChainIdForNetwork(network);
    if (!chainId) {
      console.log(`Unsupported network for token distribution data: ${network}`);
      return { 
        tokenDistribution: "N/A",
        tokenDistributionValue: 0,
        tokenDistributionRating: "N/A"
      };
    }
    
    // Use GoPlus Security API to get holder data
    const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_address=${tokenAddress}`;
    console.log(`Fetching token distribution data from GoPlus Security for chain ID ${chainId}`);
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    
    if (GOPLUS_API_KEY) {
      headers['API-Key'] = GOPLUS_API_KEY;
      console.log('Using GoPlus API key for authentication');
    } else {
      console.log('No GoPlus API key found, proceeding without authentication');
    }
    
    const response = await fetchWithRetry(url, { headers }, 3, 1000);
    
    if (!response.ok) {
      console.error(`GoPlus API error: ${response.status}`);
      return { 
        tokenDistribution: "N/A",
        tokenDistributionValue: 0, 
        tokenDistributionRating: "N/A"
      };
    }
    
    const data = await response.json();
    console.log('GoPlus API response received for token distribution');
    
    if (data.code !== 1 || !data.result || !data.result[tokenAddress.toLowerCase()]) {
      console.log('No token distribution data found');
      return { 
        tokenDistribution: "N/A",
        tokenDistributionValue: 0,
        tokenDistributionRating: "N/A"
      };
    }
    
    // Get top10_holder_ratio if available
    const securityData = data.result[tokenAddress.toLowerCase()];
    
    if (securityData.top10_holders_ratio) {
      const holderRatio = parseFloat(securityData.top10_holders_ratio);
      console.log(`Found top10 holder ratio: ${holderRatio}%`);
      
      // Determine rating based on criteria
      let rating = "N/A";
      if (holderRatio < 40) {
        rating = "Good";
      } else if (holderRatio < 80) {
        rating = "Moderate";
      } else {
        rating = "Poor";
      }
      
      return {
        tokenDistribution: `${holderRatio.toFixed(1)}%`,
        tokenDistributionValue: holderRatio,
        tokenDistributionRating: rating
      };
    }
    
    console.log('No top10 holder ratio found');
    return { 
      tokenDistribution: "N/A",
      tokenDistributionValue: 0,
      tokenDistributionRating: "N/A"
    };
  } catch (error) {
    console.error('Error fetching token distribution data:', error);
    return { 
      tokenDistribution: "N/A",
      tokenDistributionValue: 0,
      tokenDistributionRating: "N/A"
    };
  }
}

// New function to check burn mechanism
async function getBurnMechanism(network: string, tokenAddress: string) {
  if (!tokenAddress) {
    console.log('No token address provided for burn mechanism data');
    return { burnMechanism: "N/A" };
  }
  
  try {
    console.log(`Getting burn mechanism data for ${tokenAddress} on network ${network}`);
    
    // Get chain ID for the network
    const chainId = getChainIdForNetwork(network);
    if (!chainId) {
      console.log(`Unsupported network for burn mechanism data: ${network}`);
      return { burnMechanism: "N/A" };
    }
    
    // Use GoPlus Security API to get token security data
    const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_address=${tokenAddress}`;
    console.log(`Fetching burn mechanism data from GoPlus Security for chain ID ${chainId}`);
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    
    if (GOPLUS_API_KEY) {
      headers['API-Key'] = GOPLUS_API_KEY;
      console.log('Using GoPlus API key for authentication');
    } else {
      console.log('No GoPlus API key found, proceeding without authentication');
    }
    
    const response = await fetchWithRetry(url, { headers }, 3, 1000);
    
    if (!response.ok) {
      console.error(`GoPlus API error: ${response.status}`);
      return { burnMechanism: "N/A" };
    }
    
    const data = await response.json();
    console.log('GoPlus API response received for burn mechanism');
    
    if (data.code !== 1 || !data.result || !data.result[tokenAddress.toLowerCase()]) {
      console.log('No burn mechanism data found');
      return { burnMechanism: "N/A" };
    }
    
    // Check for burn mechanism based on criteria
    const securityData = data.result[tokenAddress.toLowerCase()];
    
    // Logic: If token cannot mint, cannot take back ownership, and ownership is renounced: "Yes"
    const hasMintFunction = securityData.has_mint_function === "1";
    const canTakeBackOwnership = securityData.can_take_back_ownership === "1";
    const isOwnershipRenounced = securityData.owner_address === "0x0000000000000000000000000000000000000000" || 
                                 securityData.owner_address === "0x000000000000000000000000000000000000dead";
    
    console.log(`Burn mechanism check - Mint: ${hasMintFunction}, Take Back: ${canTakeBackOwnership}, Renounced: ${isOwnershipRenounced}`);
    
    if (!hasMintFunction && !canTakeBackOwnership && isOwnershipRenounced) {
      return { burnMechanism: "Yes" };
    } else if (securityData.is_open_source !== "1" && securityData.is_open_source !== true) {
      return { burnMechanism: "N/A" }; // Cannot determine for closed source contracts
    } else {
      return { burnMechanism: "No" };
    }
  } catch (error) {
    console.error('Error fetching burn mechanism data:', error);
    return { burnMechanism: "N/A" };
  }
}

// Helper function to get security information
async function getSecurityInfo(network: string, tokenAddress: string) {
  if (!tokenAddress) {
    console.log('No token address provided for security data');
    return { 
      ownershipRenounced: "N/A",
      freezeAuthority: "N/A",
    };
  }
  
  try {
    console.log(`Getting security data for ${tokenAddress} on network ${network}`);
    
    // If we don't have a chain ID for this network, return default values
    const chainId = getChainIdForNetwork(network);
    if (!chainId) {
      console.log(`Unsupported network for security data: ${network}`);
      return { 
        ownershipRenounced: "N/A",
        freezeAuthority: "N/A",
      };
    }
    
    // Use GoPlus Security API to get token security data
    const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_address=${tokenAddress}`;
    console.log(`Fetching security data from GoPlus Security for chain ID ${chainId}`);
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    
    if (GOPLUS_API_KEY) {
      headers['API-Key'] = GOPLUS_API_KEY;
      console.log('Using GoPlus API key for authentication');
    } else {
      console.log('No GoPlus API key found, proceeding without authentication');
    }
    
    const response = await fetchWithRetry(url, { headers }, 3, 1000);
    
    if (!response.ok) {
      console.error('GoPlus API error:', response.status);
      return { 
        ownershipRenounced: "N/A",
        freezeAuthority: "N/A",
      };
    }
    
    const data = await response.json();
    console.log('GoPlus API security response received');
    
    if (data.code !== 1 || !data.result || !data.result[tokenAddress.toLowerCase()]) {
      console.log('No security data found');
      return { 
        ownershipRenounced: "N/A",
        freezeAuthority: "N/A",
      };
    }
    
    // Extract security information
    const securityData = data.result[tokenAddress.toLowerCase()];
    console.log('Security data found:', JSON.stringify(securityData).substring(0, 500) + '...');
    
    // Check if ownership is renounced - true if owner_address is 0x0000...dead or similar
    let ownershipRenounced = "No";
    if (securityData.owner_address) {
      const zeroAddress = "0x0000000000000000000000000000000000000000";
      const deadAddress = "0x000000000000000000000000000000000000dead";
      
      if (
        securityData.owner_address.toLowerCase() === zeroAddress.toLowerCase() ||
        securityData.owner_address.toLowerCase() === deadAddress.toLowerCase() || 
        securityData.owner_type === "no_owner"
      ) {
        ownershipRenounced = "Yes";
      }
    }
    
    // Enhanced check for freeze authority using multiple indicators
    let freezeAuthority = "N/A";
    
    // Check for blacklist functionality first (direct indication of freeze capability)
    if (securityData.is_blacklisted === "1" || securityData.has_blacklist === "1") {
      freezeAuthority = "Yes"; 
    }
    // Check for whitelist functionality (another form of address restriction)
    else if (securityData.is_whitelisted === "1") {
      freezeAuthority = "Yes";
    }
    // Check if contract can take back ownership (indirect ability to control)
    else if (securityData.can_take_back_ownership === "1") {
      freezeAuthority = "Yes";
    }
    // Check for mint function (ability to dilute value)
    else if (securityData.has_mint_function === "1") {
      freezeAuthority = "Yes";
    }
    // Check if proxy contract (could have upgradeable functions)
    else if (securityData.is_proxy === "1") {
      freezeAuthority = "Possible";
    }
    // If none of the above apply and we know it's open source code
    else if (securityData.is_open_source === true || securityData.is_open_source === "1") {
      freezeAuthority = "No";
    }
    // Default to N/A if we can't determine
    
    console.log(`Security metrics determined: Ownership Renounced - ${ownershipRenounced}, Freeze Authority - ${freezeAuthority}`);
    
    return {
      ownershipRenounced,
      freezeAuthority,
    };
  } catch (error) {
    console.error('Error fetching security data:', error);
    return { 
      ownershipRenounced: "N/A",
      freezeAuthority: "N/A",
    };
  }
}

// New function to get DEX depth and liquidity data from GeckoTerminal
async function getDexLiquidityData(network: string, tokenAddress: string) {
  if (!tokenAddress) {
    console.log('No token address provided for DEX liquidity data');
    return { 
      dexDepth: "N/A", 
      dexDepthValue: 0
    };
  }
  
  try {
    console.log(`Getting DEX liquidity data for ${tokenAddress} on network ${network}`);
    
    // Map network to GeckoTerminal network ID
    const geckoNetwork = mapNetworkToGeckoTerminal(network);
    if (!geckoNetwork) {
      console.log(`Unsupported network for GeckoTerminal: ${network}`);
      return { 
        dexDepth: "N/A", 
        dexDepthValue: 0
      };
    }
    
    // Fetch pools data from GeckoTerminal API
    const url = `https://api.geckoterminal.com/api/v2/networks/${geckoNetwork}/tokens/${tokenAddress.toLowerCase()}/pools`;
    console.log(`Fetching DEX liquidity data from GeckoTerminal: ${url}`);
    
    const response = await fetchWithRetry(url, {
      headers: {
        'Accept': 'application/json'
      }
    }, 3, 1000);
    
    if (!response.ok) {
      console.error(`GeckoTerminal API error: ${response.status}`);
      return { 
        dexDepth: "Coming Soon", 
        dexDepthValue: 0
      };
    }
    
    const data = await response.json();
    console.log('GeckoTerminal API response received');
    
    if (!data.data || data.data.length === 0) {
      console.log('No pools found');
      return { 
        dexDepth: "Low", 
        dexDepthValue: 0
      };
    }
    
    // Calculate total liquidity across all pools
    let totalLiquidity = 0;
    
    for (const pool of data.data) {
      if (pool.attributes && pool.attributes.reserve_in_usd) {
        const poolLiquidity = parseFloat(pool.attributes.reserve_in_usd);
        if (!isNaN(poolLiquidity)) {
          totalLiquidity += poolLiquidity;
        }
      }
    }
    
    console.log(`Total DEX liquidity: $${totalLiquidity.toFixed(2)}`);
    
    // Determine depth category
    let depthCategory = "N/A";
    
    if (totalLiquidity >= 500000) {
      depthCategory = "Good";
    } else if (totalLiquidity >= 50000) {
      depthCategory = "Moderate";
    } else if (totalLiquidity > 0) {
      depthCategory = "Low";
    } else {
      depthCategory = "N/A";
    }
    
    return {
      dexDepth: depthCategory,
      dexDepthValue: totalLiquidity
    };
  } catch (error) {
    console.error('Error fetching DEX liquidity data:', error);
    return { 
      dexDepth: "Coming Soon", 
      dexDepthValue: 0
    };
  }
}

// Helper to map network to GeckoTerminal network ID
function mapNetworkToGeckoTerminal(network: string): string | null {
  const networkMap: Record<string, string> = {
    'eth': 'eth', 
    'ethereum': 'eth',
    'bsc': 'bsc', 
    'binance-smart-chain': 'bsc',
    'polygon': 'polygon', 
    'polygon-pos': 'polygon',
    'avalanche': 'avalanche',
    'arbitrum': 'arbitrum', 
    'arbitrum-one': 'arbitrum',
    'optimism': 'optimism', 
    'optimistic-ethereum': 'optimism',
    'fantom': 'fantom',
    'base': 'base'
  };
  
  return networkMap[network.toLowerCase()] || null;
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get token info from request body
    const requestBody = await req.json();
    const { token, address, twitter, github, sources = {}, includeSecurity = false, includeLiquidity = false, includeTokenomics = true } = requestBody;
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token parameter is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log(`Processing metrics for token: ${token}, address: ${address || 'N/A'}, twitter: ${twitter || 'N/A'}, github: ${github || 'N/A'}`);
    console.log(`Data sources: ${JSON.stringify(sources)}`);
    console.log(`Include: Security=${includeSecurity}, Liquidity=${includeLiquidity}, Tokenomics=${includeTokenomics}`);
    
    // Create the cache tables if they don't exist
    try {
      await ensureTokenHoldersCacheExists();
    } catch (tableError) {
      console.error('Error ensuring cache tables exist:', tableError);
      // Continue anyway
    }
    
    // Check cache first
    const { data: cachedMetrics, error: cacheError } = await supabase
      .from('token_metrics_cache')
      .select('*')
      .eq('token_id', token)
      .single();
      
    // Use cached data if it exists and is less than 5 minutes old
    const forceRefresh = requestBody.forceRefresh || false;
    
    if (!forceRefresh && cachedMetrics && !cacheError) {
      const cacheTime = new Date(cachedMetrics.last_updated);
      const now = new Date();
      const cacheAgeMinutes = (now.getTime() - cacheTime.getTime()) / (1000 * 60);
      
      if (cacheAgeMinutes < 5) {
        console.log(`Cache hit for token metrics: ${token} (age: ${cacheAgeMinutes.toFixed(1)} minutes)`);
        
        return new Response(
          JSON.stringify({ 
            metrics: cachedMetrics.metrics,
            cacheHit: true,
            socialFollowersFromCache: cachedMetrics.metrics.socialFollowersFromCache
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log(`Cache expired for token: ${token} (age: ${cacheAgeMinutes.toFixed(1)} minutes)`);
      }
    }
    
    // Get token data from CoinGecko
    const tokenData = await getTokenData(token);
    
    // Default network is Ethereum
    const network = requestBody.blockchain?.toLowerCase() || 'eth';
    
    // Get contract address from token data if not provided
    const contractAddress = address || (tokenData && tokenData.contract_address) || '';
    
    console.log(`Using final values for APIs: Contract=${contractAddress}, Twitter=${twitter || 'N/A'}, GitHub=${github || 'N/A'}, Blockchain=${network}`);
    
    try {
      // Fetch all metrics in parallel based on specified sources
      const fetchPromises = [
        getTVL(token, network, contractAddress),
        getContractVerificationStatus(network, contractAddress),
        getTopHoldersData(network, contractAddress),
        getLiquidityLockInfo(network, contractAddress)
      ];
      
      // Only fetch security info if requested
      if (includeSecurity) {
        fetchPromises.push(getSecurityInfo(network, contractAddress));
      }
      
      // Only fetch liquidity info if requested
      if (includeLiquidity && contractAddress) {
        fetchPromises.push(getDexLiquidityData(network, contractAddress));
      }
      
      // Add tokenomics data fetching
      if (includeTokenomics && contractAddress) {
        fetchPromises.push(getSupplyCap(token));
        fetchPromises.push(getTokenDistribution(network, contractAddress));
        fetchPromises.push(getBurnMechanism(network, contractAddress));
      }
      
      const results = await Promise.all(fetchPromises);
      
      // Extract results
      const tvlData = results[0];
      const auditStatus = results[1];
      const topHoldersData = results[2];
      const liquidityLockInfo = results[3];
      
      // Extract optional results
      let securityInfo = undefined;
      let liquidityInfo = undefined;
      
      if (includeSecurity) {
        securityInfo = results[4];
      }
      
      if (includeLiquidity && contractAddress) {
        liquidityInfo = includeSecurity ? results[5] : results[4];
      }
      
      // Extract tokenomics results if included
      let supplyCap = undefined;
      let tokenDistributionData = undefined;
      let burnMechanism = undefined;
      
      if (includeTokenomics) {
        const baseIndex = includeSecurity ? (includeLiquidity ? 6 : 5) : (includeLiquidity ? 5 : 4);
        supplyCap = results[baseIndex];
        tokenDistributionData = results[baseIndex + 1];
        burnMechanism = results[baseIndex + 2];
      }
      
      // Construct metrics response
      const metrics: any = {
        // Market data from CoinGecko
        marketCap: tokenData && tokenData.market_data && tokenData.market_data.market_cap 
          ? formatCurrency(tokenData.market_data.market_cap.usd) 
          : "N/A",
        marketCapValue: tokenData && tokenData.market_data && tokenData.market_data.market_cap 
          ? tokenData.market_data.market_cap.usd 
          : 0,
        marketCapChange24h: tokenData && tokenData.market_data && tokenData.market_data.market_cap_change_percentage_24h 
          ? tokenData.market_data.market_cap_change_percentage_24h 
          : 0,
        currentPrice: tokenData && tokenData.market_data && tokenData.market_data.current_price 
          ? tokenData.market_data.current_price.usd 
          : 0,
        priceChange24h: tokenData && tokenData.market_data && tokenData.market_data.price_change_percentage_24h 
          ? tokenData.market_data.price_change_percentage_24h 
          : 0,
        
        // TVL data
        ...tvlData,
        
        // Liquidity lock data
        ...liquidityLockInfo,
        
        // Contract verification status
        auditStatus,
        
        // Top holders data
        ...topHoldersData,
        
        // Social followers (Coming Soon)
        socialFollowers: "Coming Soon",
        socialFollowersCount: 0,
        socialFollowersChange: 0,
        socialFollowersFromCache: false
      };
      
      // Add tokenomics data to metrics
      if (includeTokenomics) {
        if (supplyCap) {
          metrics.supplyCap = supplyCap.supplyCap;
          metrics.supplyCapValue = supplyCap.supplyCapValue;
          metrics.supplyCapExists = supplyCap.supplyCapExists;
        } else {
          metrics.supplyCap = "N/A";
          metrics.supplyCapValue = 0;
          metrics.supplyCapExists = false;
        }
        
        if (tokenDistributionData) {
          metrics.tokenDistribution = tokenDistributionData.tokenDistribution;
          metrics.tokenDistributionValue = tokenDistributionData.tokenDistributionValue;
          metrics.tokenDistributionRating = tokenDistributionData.tokenDistributionRating;
        } else {
          metrics.tokenDistribution = "N/A";
          metrics.tokenDistributionValue = 0;
          metrics.tokenDistributionRating = "N/A";
        }
        
        if (burnMechanism) {
          metrics.burnMechanism = burnMechanism.burnMechanism;
        } else {
          metrics.burnMechanism = "N/A";
        }
        
        // Treasury Size is coming soon, no direct API source
        metrics.treasurySize = "N/A";
        metrics.treasurySizeValue = 0;
        
        // Calculate tokenomics score based on available metrics
        let tokenomicsScore = 65; // Base score
        
        // Adjust score based on TVL
        if (metrics.tvlValue > 1000000000) { // > $1B
          tokenomicsScore += 15;
        } else if (metrics.tvlValue > 100000000) { // > $100M
          tokenomicsScore += 10;
        } else if (metrics.tvlValue > 10000000) { // > $10M
          tokenomicsScore += 5;
        } else if (metrics.tvlValue < 1000000) { // < $1M
          tokenomicsScore -= 5;
        }
        
        // Adjust score based on supply cap
        if (metrics.supplyCapExists) {
          tokenomicsScore += 10;
        }
        
        // Adjust score based on token distribution
        if (metrics.tokenDistributionRating === "Good") {
          tokenomicsScore += 10;
        } else if (metrics.tokenDistributionRating === "Moderate") {
          tokenomicsScore += 5;
        } else if (metrics.tokenDistributionRating === "Poor") {
          tokenomicsScore -= 10;
        }
        
        // Adjust score based on burn mechanism
        if (metrics.burnMechanism === "Yes") {
          tokenomicsScore += 10;
        }
        
        // Ensure score stays within 0-100 range
        metrics.tokenomicsScore = Math.max(0, Math.min(100, tokenomicsScore));
        console.log(`Calculated tokenomics score: ${metrics.tokenomicsScore}`);
        
        // Store tokenomics analysis in a structure matching the requested format
        metrics.tokenomicsAnalysis = {
          tvl_usd: metrics.tvlValue,
          supply_cap: metrics.supplyCapValue,
          token_distribution_rating: metrics.tokenDistributionRating,
          treasury_estimate: null,
          burn_mechanism: metrics.burnMechanism
        };
      }
      
      // Cache the metrics
      try {
        await supabase
          .from('token_metrics_cache')
          .upsert({
            token_id: token,
            metrics,
            last_updated: new Date().toISOString()
          });
        
        console.log('Saved metrics to cache');
      } catch (cacheError) {
        console.error('Error saving metrics to cache:', cacheError);
      }
      
      return new Response(
        JSON.stringify({ 
          metrics,
          cacheHit: false,
          socialFollowersFromCache: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error("Error processing specific metrics:", error);
      
      // Create a fallback response with basic metrics and error information
      const fallbackMetrics: any = {
        marketCap: tokenData && tokenData.market_data && tokenData.market_data.market_cap 
          ? formatCurrency(tokenData.market_data.market_cap.usd) 
          : "N/A",
        marketCapValue: tokenData && tokenData.market_data && tokenData.market_data.market_cap 
          ? tokenData.market_data.market_cap.usd 
          : 0,
        marketCapChange24h: tokenData && tokenData.market_data && tokenData.market_data.market_cap_change_percentage_24h 
          ? tokenData.market_data.market_cap_change_percentage_24h 
          : 0,
        currentPrice: tokenData && tokenData.market_data && tokenData.market_data.current_price 
          ? tokenData.market_data.current_price.usd 
          : 0,
        priceChange24h: tokenData && tokenData.market_data && tokenData.market_data.price_change_percentage_24h 
          ? tokenData.market_data.price_change_percentage_24h 
          : 0,
        liquidityLock: "N/A",
        liquidityLockDays: 0,
        topHoldersPercentage: "N/A",
        topHoldersValue: 0,
        topHoldersTrend: null,
        topHolders: [],
        tvl: "N/A",
        tvlValue: 0,
        tvlChange24h: 0,
        auditStatus: "N/A",
        socialFollowers: "Coming Soon",
        socialFollowersCount: 0,
        socialFollowersChange: 0,
        socialFollowersFromCache: false,
        ownershipRenounced: "N/A",
        freezeAuthority: "N/A",
        dexDepth: "Coming Soon",
        dexDepthValue: 0,
        cexListings: "Coming Soon"
      };
      
      // Cache the fallback metrics
      try {
        await supabase
          .from('token_metrics_cache')
          .upsert({
            token_id: token,
            metrics: fallbackMetrics,
            last_updated: new Date().toISOString()
          });
          
        console.log('Saved fallback metrics to cache');
      } catch (cacheError) {
        console.error("Error caching fallback metrics:", cacheError);
      }
      
      return new Response(
        JSON.stringify({ 
          metrics: fallbackMetrics,
          cacheHit: false,
          error: "Partial data available due to API errors"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error("Error processing metrics:", error);
    return new Response(
      JSON.stringify({ error: 'Failed to process metrics', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper function to ensure token_holders_cache table exists
async function ensureTokenHoldersCacheExists() {
  try {
    console.log('Checking if token_holders_cache table exists');
    const { error } = await supabase
      .from('token_holders_cache')
      .select('count')
      .limit(1);
    
    if (error && error.message.includes('relation "token_holders_cache" does not exist')) {
      console.log('Creating token_holders_cache table via RPC');
      await supabase.rpc('create_token_holders_cache_table');
      
      // Extend the table schema to include holders_data column
      const { error: alterError } = await supabase.rpc('alter_token_holders_cache_add_holders_data');
      if (alterError) {
        console.error('Error adding holders_data column:', alterError);
        // If the RPC doesn't exist, create the function
        await supabase.rpc('create_alter_token_holders_cache_function');
        // Try again
        await supabase.rpc('alter_token_holders_cache_add_holders_data');
      }
      
      console.log('Token holders cache table created with holders_data column');
    } else if (error) {
      console.error('Error checking token_holders_cache table:', error);
      throw error;
    } else {
      console.log('Token holders cache table exists');
      
      // Check if holders_data column exists
      try {
        const { error: queryError } = await supabase
          .from('token_holders_cache')
          .select('holders_data')
          .limit(1);
          
        if (queryError && queryError.message.includes('column "holders_data" does not exist')) {
          console.log('Adding holders_data column to token_holders_cache table');
          await supabase.rpc('alter_token_holders_cache_add_holders_data');
        }
      } catch (columnError) {
        console.error('Error checking for holders_data column:', columnError);
      }
    }
  } catch (error) {
    console.error('Error in ensureTokenHoldersCacheExists:', error);
    throw error;
  }
}

// Helper function to get contract verification status
async function getContractVerificationStatus(network: string, contractAddress: string) {
  if (!contractAddress) {
    console.log('No contract address provided for verification status');
    return { verificationStatus: "N/A" };
  }
  
  try {
    console.log(`Getting verification status for ${contractAddress} on network ${network}`);
    
    // Use Etherscan API to get contract verification status
    const url = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}`;
    console.log(`Fetching verification status from Etherscan: ${url}`);
    
    const response = await fetchWithRetry(url, {
      headers: {
        'Accept': 'application/json'
      }
    }, 3, 1000);
    
    if (!response.ok) {
      console.error(`Etherscan API error: ${response.status}`);
      return { verificationStatus: "N/A" };
    }
    
    const data = await response.json();
    console.log('Etherscan API response received');
    
    if (data.code !== 1 || !data.result || !data.result.source_code) {
      console.log('No verification status found');
      return { verificationStatus: "N/A" };
    }
    
    // Extract verification status
    const verificationStatus = data.result.source_code ? "Verified" : "Unverified";
    console.log(`Verification status for ${contractAddress}: ${verificationStatus}`);
    
    return { verificationStatus };
  } catch (error) {
    console.error('Error fetching verification status:', error);
    return { verificationStatus: "N/A" };
  }
}

// Helper function to get top holders data
async function getTopHoldersData(network: string, contractAddress: string) {
  if (!contractAddress) {
    console.log('No contract address provided for top holders data');
    return { topHolders: [], topHoldersPercentage: "N/A", topHoldersValue: 0, topHoldersTrend: null };
  }
  
  try {
    console.log(`Getting top holders data for ${contractAddress} on network ${network}`);
    
    // Use Etherscan API to get top holders data
    const url = `https://api.etherscan.io/api?module=token&action=getTopHolders&contractAddress=${contractAddress}`;
    console.log(`Fetching top holders data from Etherscan: ${url}`);
    
    const response = await fetchWithRetry(url, {
      headers: {
        'Accept': 'application/json'
      }
    }, 3, 1000);
    
    if (!response.ok) {
      console.error(`Etherscan API error: ${response.status}`);
      return { topHolders: [], topHoldersPercentage: "N/A", topHoldersValue: 0, topHoldersTrend: null };
    }
    
    const data = await response.json();
    console.log('Etherscan API response received');
    
    if (data.code !== 1 || !data.result || !data.result.top_holders) {
      console.log('No top holders data found');
      return { topHolders: [], topHoldersPercentage: "N/A", topHoldersValue: 0, topHoldersTrend: null };
    }
    
    // Extract top holders data
    const topHolders = data.result.top_holders;
    const topHoldersPercentage = topHolders.length > 0 ? topHolders[0].percentage : "N/A";
    const topHoldersValue = topHolders.length > 0 ? topHolders[0].value : 0;
    const topHoldersTrend = topHolders.length > 0 ? topHolders[0].trend : null;
    
    console.log(`Top holders data for ${contractAddress}: ${topHoldersPercentage}, ${topHoldersValue}, ${topHoldersTrend}`);
    
    return { topHolders, topHoldersPercentage, topHoldersValue, topHoldersTrend };
  } catch (error) {
    console.error('Error fetching top holders data:', error);
    return { topHolders: [], topHoldersPercentage: "N/A", topHoldersValue: 0, topHoldersTrend: null };
  }
}

// Helper function to get liquidity lock info
async function getLiquidityLockInfo(network: string, contractAddress: string) {
  if (!contractAddress) {
    console.log('No contract address provided for liquidity lock info');
    return { liquidityLock: "N/A", liquidityLockDays: 0 };
  }
  
  try {
    console.log(`Getting liquidity lock info for ${contractAddress} on network ${network}`);
    
    // Use Etherscan API to get liquidity lock info
    const url = `https://api.etherscan.io/api?module=token&action=getLiquidityLock&contractAddress=${contractAddress}`;
    console.log(`Fetching liquidity lock info from Etherscan: ${url}`);
    
    const response = await fetchWithRetry(url, {
      headers: {
        'Accept': 'application/json'
      }
    }, 3, 1000);
    
    if (!response.ok) {
      console.error(`Etherscan API error: ${response.status}`);
      return { liquidityLock: "N/A", liquidityLockDays: 0 };
    }
    
    const data = await response.json();
    console.log('Etherscan API response received');
    
    if (data.code !== 1 || !data.result || !data.result.liquidity_lock) {
      console.log('No liquidity lock info found');
      return { liquidityLock: "N/A", liquidityLockDays: 0 };
    }
    
    // Extract liquidity lock info
    const liquidityLock = data.result.liquidity_lock;
    const liquidityLockDays = data.result.liquidity_lock_days;
    
    console.log(`Liquidity lock info for ${contractAddress}: ${liquidityLock}, ${liquidityLockDays}`);
    
    return { liquidityLock, liquidityLockDays };
  } catch (error) {
    console.error('Error fetching liquidity lock info:', error);
    return { liquidityLock: "N/A", liquidityLockDays: 0 };
  }
}

// Helper function to get chain ID for the network
function getChainIdForNetwork(network: string): string | null {
  const networkMap: Record<string, string> = {
    'eth': 'eth', 
    'ethereum': 'eth',
    'bsc': 'bsc', 
    'binance-smart-chain': 'bsc',
    'polygon': 'polygon', 
    'polygon-pos': 'polygon',
    'avalanche': 'avalanche',
    'arbitrum': 'arbitrum', 
    'arbitrum-one': 'arbitrum',
    'optimism': 'optimism', 
    'optimistic-ethereum': 'optimism',
    'fantom': 'fantom',
    'base': 'base'
  };
  
  return networkMap[network.toLowerCase()] || null;
}
