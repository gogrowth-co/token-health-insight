
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

// Set up CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? ""
);

// Base URLs for APIs
const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const GECKO_TERMINAL_BASE_URL = "https://api.geckoterminal.com/api/v2";

// API Headers
const GECKO_TERMINAL_HEADERS = {
  'Accept': 'application/json;version=20230302'
};

// Utility functions for API requests
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// CoinGecko API functions
async function getTokenDetails(tokenId: string) {
  console.log(`Fetching CoinGecko details for token: ${tokenId}`);
  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE_URL}/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true`,
      {},
      8000
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API returned ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`CoinGecko API error: ${error.message}`);
    return null;
  }
}

async function getTokenMarketChart(tokenId: string, days = 30) {
  console.log(`Fetching CoinGecko market chart for token: ${tokenId}`);
  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE_URL}/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}`,
      {},
      8000
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API returned ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`CoinGecko API error: ${error.message}`);
    return null;
  }
}

// GeckoTerminal API functions
function detectNetwork(tokenIdOrSymbol: string): string {
  // Extract network from token ID if it contains a colon
  if (tokenIdOrSymbol.includes(':')) {
    const parts = tokenIdOrSymbol.split(':');
    return mapNetworkName(parts[0]);
  }
  
  // Default to Ethereum for CoinGecko IDs without explicit network
  return 'eth';
}

function mapNetworkName(network: string): string {
  const networkMap: Record<string, string> = {
    'ethereum': 'eth',
    'binance-smart-chain': 'bsc',
    'polygon-pos': 'polygon',
    'fantom': 'ftm',
    'avalanche': 'avax',
    'arbitrum-one': 'arbitrum',
    'optimistic-ethereum': 'optimism',
  };
  
  return networkMap[network.toLowerCase()] || 'eth';
}

function extractContractAddress(tokenIdOrSymbol: string): string | null {
  // If the token ID contains a colon, it might be in the format 'network:address'
  if (tokenIdOrSymbol.includes(':')) {
    const parts = tokenIdOrSymbol.split(':');
    if (parts.length > 1) {
      return parts[1];
    }
  }
  
  // If it looks like an Ethereum address
  if (/^0x[a-fA-F0-9]{40}$/.test(tokenIdOrSymbol)) {
    return tokenIdOrSymbol;
  }
  
  return null;
}

async function getTokenPools(network: string, tokenAddress: string) {
  console.log(`Fetching GeckoTerminal pools for: ${network}/${tokenAddress}`);
  try {
    const response = await fetchWithTimeout(
      `${GECKO_TERMINAL_BASE_URL}/networks/${network}/tokens/${tokenAddress}/pools`,
      { headers: GECKO_TERMINAL_HEADERS },
      8000
    );
    
    if (!response.ok) {
      throw new Error(`GeckoTerminal API returned ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`GeckoTerminal API error: ${error.message}`);
    return null;
  }
}

async function getPoolData(network: string, poolAddress: string) {
  console.log(`Fetching GeckoTerminal pool data for: ${network}/${poolAddress}`);
  try {
    const response = await fetchWithTimeout(
      `${GECKO_TERMINAL_BASE_URL}/networks/${network}/pools/${poolAddress}`,
      { headers: GECKO_TERMINAL_HEADERS },
      8000
    );
    
    if (!response.ok) {
      throw new Error(`GeckoTerminal API returned ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`GeckoTerminal API error: ${error.message}`);
    return null;
  }
}

// Calculate scores based on real data
function calculateSecurityScore(tokenDetails: any, poolData: any = null, securityData: any = null): number {
  let score = 50; // Base score
  
  // Add points based on market cap rank (established projects tend to be more secure)
  if (tokenDetails?.market_cap_rank) {
    if (tokenDetails.market_cap_rank <= 10) score += 20;
    else if (tokenDetails.market_cap_rank <= 100) score += 15;
    else if (tokenDetails.market_cap_rank <= 1000) score += 10;
  }
  
  // Add points for having GitHub repositories (transparency)
  if (tokenDetails?.links?.repos_url?.github?.length > 0) score += 5;
  
  // Add points for having a market cap (established project)
  if (tokenDetails?.market_data?.market_cap?.usd) score += 5;

  // Pool data security factors
  if (poolData?.data?.attributes?.liquidity_locked) {
    const lockInfo = poolData.data.attributes.liquidity_locked;
    if (lockInfo.is_locked) {
      score += 5;
      
      // Additional points for longer locks
      if (lockInfo.duration_in_seconds) {
        const lockDays = lockInfo.duration_in_seconds / (60 * 60 * 24);
        if (lockDays > 365) score += 5;
        else if (lockDays > 180) score += 3;
      }
    } else {
      score -= 5; // Penalty for not having locked liquidity
    }
  }
  
  // Security data from GoPlus API
  if (securityData?.result) {
    const data = securityData.result;
    const contractAddress = Object.keys(data)[0];
    const contractData = data[contractAddress];
    
    if (contractData) {
      // Critical risk factors
      if (contractData.is_honeypot && contractData.is_honeypot === "1") {
        score -= 40; // Severe penalty for honeypot
      }
      
      if (contractData.owner_address === "0x0000000000000000000000000000000000000000") {
        score += 15; // Major plus for renounced ownership
      } else {
        score -= 10; // Penalty for retained ownership
      }
      
      if (contractData.can_take_back_ownership && contractData.can_take_back_ownership === "1") {
        score -= 20; // Penalty for backdoor ownership capability
      }
      
      if (contractData.selfdestruct && contractData.selfdestruct === "1") {
        score -= 15; // Penalty for self-destruct capability
      }
      
      // Moderate risk factors
      if (contractData.mintable && contractData.mintable === "1") {
        score -= 5; // Penalty for mint capability
      }
      
      if (contractData.is_open_source && contractData.is_open_source === "1") {
        score += 10; // Bonus for open source code
      } else {
        score -= 10; // Penalty for closed source
      }
      
      // Tax considerations
      const buyTax = parseFloat(contractData.buy_tax || "0");
      const sellTax = parseFloat(contractData.sell_tax || "0");
      
      if (buyTax > 10 || sellTax > 10) {
        score -= 10; // Heavy penalty for high taxes
      } else if (buyTax > 5 || sellTax > 5) {
        score -= 5; // Penalty for moderate taxes
      }
    }
  }
  
  // Cap the score
  return Math.min(Math.max(score, 0), 100);
}

function calculateLiquidityScore(tokenDetails: any, marketChart: any = null, poolData: any = null): number {
  let score = 50; // Base score
  
  const volume = tokenDetails?.market_data?.total_volume?.usd || 0;
  const marketCap = tokenDetails?.market_data?.market_cap?.usd || 0;
  
  // Volume to market cap ratio (higher is better)
  if (marketCap > 0) {
    const volumeToMarketCapRatio = volume / marketCap;
    if (volumeToMarketCapRatio > 0.3) score += 30;
    else if (volumeToMarketCapRatio > 0.1) score += 20;
    else if (volumeToMarketCapRatio > 0.05) score += 10;
  }
  
  // Absolute volume (higher is better)
  if (volume > 10000000) score += 20; // >$10M daily volume
  else if (volume > 1000000) score += 15; // >$1M daily volume
  else if (volume > 100000) score += 10; // >$100K daily volume

  // Pool data from GeckoTerminal
  if (poolData?.data?.attributes) {
    const attrs = poolData.data.attributes;
    
    // Check pool reserve (TVL)
    const reserve = parseFloat(attrs.reserve_in_usd || '0');
    if (reserve > 1000000) score += 10; // >$1M TVL
    else if (reserve > 100000) score += 5; // >$100K TVL
    
    // Check 24h transaction count
    const tx24h = attrs.transactions?.h24 || 0;
    if (tx24h > 1000) score += 10; // >1000 daily transactions
    else if (tx24h > 100) score += 5; // >100 daily transactions
    
    // Check pool age
    if (attrs.creation_timestamp) {
      const creationDate = new Date(attrs.creation_timestamp);
      const now = new Date();
      const diffDays = Math.ceil(Math.abs(now.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 365) score += 10; // >1 year old
      else if (diffDays > 180) score += 8; // >6 months old
      else if (diffDays > 90) score += 5; // >3 months old
      else if (diffDays > 30) score += 2; // >1 month old
    }
  }
  
  // Market chart price stability
  if (marketChart?.prices && marketChart.prices.length > 0) {
    // Calculate volatility from price history
    const prices = marketChart.prices.map((p: any) => p[1]);
    const volatility = calculateVolatility(prices);
    
    if (volatility < 0.05) score += 10; // Very stable price
    else if (volatility < 0.1) score += 5; // Moderately stable price
    else if (volatility > 0.3) score -= 10; // Very volatile
  }
  
  // Cap the score
  return Math.min(Math.max(score, 0), 100);
}

function calculateTokenomicsScore(tokenDetails: any, poolData: any = null, securityData: any = null): number {
  let score = 65; // Base score
  
  // Look for supply data
  if (tokenDetails?.market_data) {
    const marketData = tokenDetails.market_data;
    
    // Check for max supply (good tokenomics usually has a cap)
    if (marketData.max_supply) {
      score += 10;
      
      // Check circulating vs total supply ratio
      if (marketData.circulating_supply && marketData.total_supply) {
        const ratio = marketData.circulating_supply / marketData.total_supply;
        if (ratio > 0.7) score += 10; // Most tokens are circulating (good distribution)
        else if (ratio < 0.3) score -= 10; // Most tokens are not circulating (potential for dumps)
      }
    } else {
      score -= 5; // No max supply means potential unlimited inflation
    }
  }
  
  // Security data from GoPlus API can give us tax info
  if (securityData?.result) {
    const data = securityData.result;
    const contractAddress = Object.keys(data)[0];
    const contractData = data[contractAddress];
    
    if (contractData) {
      // Tax considerations
      const buyTaxValue = parseFloat(contractData.buy_tax || "0");
      const sellTaxValue = parseFloat(contractData.sell_tax || "0");
      
      if (buyTaxValue > 10) {
        score -= 10; // Heavy penalty for high buy tax
      } else if (buyTaxValue > 5) {
        score -= 5; // Penalty for moderate buy tax
      }
      
      if (sellTaxValue > 10) {
        score -= 15; // Heavy penalty for high sell tax
      } else if (sellTaxValue > 5) {
        score -= 10; // Penalty for moderate sell tax
      }
      
      // Honeypot factors
      if (contractData.is_honeypot && contractData.is_honeypot === "1") {
        score = Math.min(score, 20); // Cap tokenomics score for honeypots
      }
    }
  }
  
  return Math.min(Math.max(score, 0), 100);
}

function calculateCommunityScore(tokenDetails: any, twitterData: any = null): number {
  // Based on social metrics
  const twitterFollowers = twitterData?.data?.followersCount || tokenDetails?.community_data?.twitter_followers || 0;
  const redditSubscribers = tokenDetails?.community_data?.reddit_subscribers || 0;
  const telegramUsers = tokenDetails?.community_data?.telegram_channel_user_count || 0;
  
  let score = 50; // Base score
  
  // Twitter followers
  if (twitterFollowers > 1000000) score += 20;
  else if (twitterFollowers > 100000) score += 15;
  else if (twitterFollowers > 10000) score += 10;
  else if (twitterFollowers > 1000) score += 5;
  
  // Twitter verification adds points
  if (twitterData?.data?.verified) {
    score += 10;
  }
  
  // Twitter account age
  if (twitterData?.data?.createdAt) {
    const createdAt = new Date(twitterData.data.createdAt);
    const now = new Date();
    const accountAgeInYears = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    if (accountAgeInYears > 3) score += 10;
    else if (accountAgeInYears > 1) score += 5;
  }
  
  // Twitter engagement (estimated by tweet count)
  if (twitterData?.data?.tweetCount) {
    if (twitterData.data.tweetCount > 5000) score += 10;
    else if (twitterData.data.tweetCount > 1000) score += 5;
  }
  
  // Reddit subscribers
  if (redditSubscribers > 100000) score += 10;
  else if (redditSubscribers > 10000) score += 7;
  else if (redditSubscribers > 1000) score += 5;
  
  // Telegram users
  if (telegramUsers > 100000) score += 10;
  else if (telegramUsers > 10000) score += 7;
  else if (telegramUsers > 1000) score += 5;
  
  return Math.min(Math.max(score, 0), 100);
}

function calculateDevelopmentScore(tokenDetails: any): number {
  let score = 50; // Base score
  
  if (tokenDetails?.developer_data) {
    const devData = tokenDetails.developer_data;
    
    // Recent commit activity
    const commitCount = devData.commit_count_4_weeks || 0;
    if (commitCount > 100) score += 20;
    else if (commitCount > 50) score += 15;
    else if (commitCount > 20) score += 10;
    else if (commitCount > 0) score += 5;
    
    // GitHub stars
    const stars = devData.stars || 0;
    if (stars > 5000) score += 15;
    else if (stars > 1000) score += 10;
    else if (stars > 100) score += 5;
    
    // GitHub forks
    const forks = devData.forks || 0;
    if (forks > 1000) score += 15;
    else if (forks > 100) score += 10;
    else if (forks > 10) score += 5;
    
    // Contributors
    const contributors = devData.pull_request_contributors || 0;
    if (contributors > 50) score += 15;
    else if (contributors > 20) score += 10;
    else if (contributors > 5) score += 5;
  }
  
  return Math.min(Math.max(score, 0), 100);
}

// Helper functions
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

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  } else {
    return value.toString();
  }
}

function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  // Calculate daily returns
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  
  // Calculate standard deviation of returns (volatility)
  const avg = returns.reduce((sum, val) => sum + val, 0) / returns.length;
  const variance = returns.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Parse request body
    const { tokenId } = await req.json();
    console.log(`Scanning token: ${tokenId}`);

    if (!tokenId) {
      return new Response(
        JSON.stringify({ error: "Missing tokenId parameter" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check token cache first
    const { data: cachedData } = await supabaseClient
      .from('token_data_cache')
      .select('data')
      .eq('token_id', tokenId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedData) {
      console.log(`Using cached data for token: ${tokenId}`);
      
      // Get authentication info from request to save scan history
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        try {
          // Extract token from Bearer header
          const token = authHeader.replace('Bearer ', '');
          const { data: { user } } = await supabaseClient.auth.getUser(token);
          
          if (user) {
            // Save scan history for authenticated user
            await supabaseClient
              .from('token_scans')
              .insert({
                user_id: user.id,
                token_id: tokenId,
                token_symbol: cachedData.data.symbol,
                token_name: cachedData.data.name,
                health_score: cachedData.data.healthScore,
                category_scores: cachedData.data.categories
              });
          }
        } catch (authError) {
          // Log but don't fail the request if saving history fails
          console.error(`Error saving scan history: ${authError.message}`);
        }
      }
      
      return new Response(JSON.stringify(cachedData.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`No cache found for token: ${tokenId}, fetching fresh data`);

    // Create a controller to manage the overall timeout for the entire operation
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("Overall operation timeout reached, aborting");
      timeoutController.abort();
    }, 25000); // 25 seconds overall timeout

    try {
      // Start concurrent API calls
      console.log("Starting concurrent API calls for token data");
      
      const tokenDetailsPromise = getTokenDetails(tokenId);
      const marketChartPromise = getTokenMarketChart(tokenId);
      
      // Extract contract address for additional APIs
      const contractAddress = extractContractAddress(tokenId);
      const network = detectNetwork(tokenId);
      
      console.log(`Contract address: ${contractAddress}, Network: ${network}`);
      
      // Only call these APIs if we have a contract address
      let tokenPoolsPromise = null;
      let securityDataPromise = null;
      
      if (contractAddress) {
        tokenPoolsPromise = getTokenPools(network, contractAddress);
        
        // Call Security API via edge function
        securityDataPromise = supabaseClient.functions.invoke('fetch-security-data', {
          body: { contractAddress }
        }).catch(err => {
          console.error(`Security data fetch error: ${err.message}`);
          return { data: null };
        });
      }
      
      // Call Twitter API via edge function
      const twitterPromise = supabaseClient.functions.invoke('fetch-twitter-profile', {
        body: { tokenId }
      }).catch(err => {
        console.error(`Twitter profile fetch error: ${err.message}`);
        return { data: null };
      });
      
      // Wait for basic token data first
      const [tokenDetails, marketChart] = await Promise.all([
        tokenDetailsPromise,
        marketChartPromise
      ]);
      
      console.log(`Got tokenDetails: ${!!tokenDetails}, marketChart: ${!!marketChart}`);
      
      if (!tokenDetails) {
        throw new Error("Failed to fetch token details");
      }
      
      // Then wait for supplementary data
      const [tokenPools, securityResult, twitterResult] = await Promise.allSettled([
        tokenPoolsPromise || Promise.resolve(null),
        securityDataPromise || Promise.resolve(null),
        twitterPromise
      ]);
      
      console.log(`Supplementary data results - tokenPools: ${tokenPools.status}, security: ${securityResult.status}, twitter: ${twitterResult.status}`);
      
      // Get pool data if token pools were found
      let poolData = null;
      if (tokenPools && tokenPools.status === 'fulfilled' && tokenPools.value?.data?.length > 0) {
        try {
          const primaryPool = tokenPools.value.data[0];
          const poolId = primaryPool.id.split(':');
          
          if (poolId.length > 1) {
            poolData = await getPoolData(poolId[0], poolId[1]);
            console.log(`Got pool data: ${!!poolData}`);
          }
        } catch (poolError) {
          console.error(`Error fetching pool data: ${poolError.message}`);
        }
      }
      
      // Calculate scores based on available data
      const securityScore = calculateSecurityScore(
        tokenDetails, 
        poolData,
        securityResult.status === 'fulfilled' ? securityResult.value.data : null
      );
      
      const liquidityScore = calculateLiquidityScore(
        tokenDetails,
        marketChart,
        poolData
      );
      
      const tokenomicsScore = calculateTokenomicsScore(
        tokenDetails,
        poolData,
        securityResult.status === 'fulfilled' ? securityResult.value.data : null
      );
      
      const communityScore = calculateCommunityScore(
        tokenDetails,
        twitterResult.status === 'fulfilled' ? twitterResult.value : null
      );
      
      const developmentScore = calculateDevelopmentScore(tokenDetails);
      
      // Calculate overall health score
      const healthScore = Math.round(
        (securityScore * 0.25) + 
        (liquidityScore * 0.25) + 
        (tokenomicsScore * 0.2) + 
        (communityScore * 0.15) + 
        (developmentScore * 0.15)
      );
      
      console.log(`Calculated scores - security: ${securityScore}, liquidity: ${liquidityScore}, tokenomics: ${tokenomicsScore}, community: ${communityScore}, development: ${developmentScore}, overall: ${healthScore}`);
      
      // Extract data from pool if available
      let liquidityLock = "Unknown";
      let tvl = "$0";
      let volume24h = "$0";
      let txCount24h = 0;
      let poolAge = "Unknown";
      
      if (poolData?.data?.attributes) {
        const attrs = poolData.data.attributes;
        
        // Get TVL (reserve_in_usd)
        if (attrs.reserve_in_usd) {
          tvl = formatCurrency(parseFloat(attrs.reserve_in_usd));
        }
        
        // Get 24h volume
        if (attrs.volume_usd && attrs.volume_usd.h24) {
          volume24h = formatCurrency(parseFloat(attrs.volume_usd.h24));
        }
        
        // Get 24h transaction count
        if (attrs.transactions && attrs.transactions.h24) {
          txCount24h = attrs.transactions.h24;
        }
        
        // Get pool creation date and calculate age
        if (attrs.creation_timestamp) {
          const creationDate = new Date(attrs.creation_timestamp);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - creationDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          poolAge = diffDays === 1 ? '1 day' : `${diffDays} days`;
        }
        
        // Get liquidity lock info
        if (attrs.liquidity_locked) {
          if (attrs.liquidity_locked.is_locked) {
            if (attrs.liquidity_locked.locked_until) {
              const lockDate = new Date(attrs.liquidity_locked.locked_until);
              const now = new Date();
              if (lockDate > now) {
                // Calculate days left
                const diffTime = Math.abs(lockDate.getTime() - now.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                liquidityLock = diffDays === 1 ? '1 day' : `${diffDays} days`;
              } else {
                liquidityLock = "Expired";
              }
            } else if (attrs.liquidity_locked.duration_in_seconds) {
              // Convert seconds to days
              const days = Math.ceil(attrs.liquidity_locked.duration_in_seconds / (60 * 60 * 24));
              liquidityLock = days === 1 ? '1 day' : `${days} days`;
            }
          } else {
            liquidityLock = "Not locked";
          }
        }
      }
      
      // Format market cap and other metrics
      const marketCap = tokenDetails.market_data?.market_cap?.usd ? 
        formatCurrency(tokenDetails.market_data.market_cap.usd) : "$0";
      
      const socialFollowers = twitterResult.status === 'fulfilled' && twitterResult.value.data?.followersCount ? 
        formatNumber(twitterResult.value.data.followersCount) : 
        formatNumber(tokenDetails.community_data?.twitter_followers || 0);
      
      // Security status based on GoPlus data
      let auditStatus = "Unknown";
      if (securityResult.status === 'fulfilled' && securityResult.value.data?.result) {
        const secData = securityResult.value.data.result;
        const addr = Object.keys(secData)[0];
        
        if (secData[addr]) {
          if (secData[addr].is_open_source === "1") {
            auditStatus = "Verified";
          } else {
            auditStatus = "Unverified";
          }
          
          if (secData[addr].is_proxy === "1") {
            auditStatus += " (Proxy)";
          }
        }
      }
      
      // Build the metrics object
      const metrics = {
        name: tokenDetails.name,
        symbol: tokenDetails.symbol.toUpperCase(),
        marketCap,
        liquidityLock,
        topHoldersPercentage: "Unknown", // Would require Etherscan API for accurate data
        tvl,
        auditStatus,
        socialFollowers,
        poolAge,
        volume24h,
        txCount24h,
        network,
        etherscan: {
          contractAddress
        },
        categories: {
          security: { score: securityScore },
          liquidity: { score: liquidityScore },
          tokenomics: { score: tokenomicsScore },
          community: { score: communityScore },
          development: { score: developmentScore }
        },
        healthScore,
        lastUpdated: Date.now()
      };
      
      // Add security data if available
      if (securityResult.status === 'fulfilled' && securityResult.value.data?.result) {
        const secData = securityResult.value.data.result;
        const addr = Object.keys(secData)[0];
        
        if (secData[addr]) {
          metrics.goPlus = {
            ownershipRenounced: secData[addr].owner_address === "0x0000000000000000000000000000000000000000",
            canMint: secData[addr].mintable === "1",
            hasBlacklist: secData[addr].has_blacklist === "1",
            slippageModifiable: secData[addr].slippage_modifiable === "1",
            isHoneypot: secData[addr].is_honeypot === "1",
            ownerCanChangeBalance: secData[addr].can_take_back_ownership === "1",
            isProxy: secData[addr].is_proxy === "1",
            hasExternalCalls: secData[addr].external_call === "1",
            transferPausable: secData[addr].transfer_pausable === "1",
            isSelfdestructable: secData[addr].selfdestruct === "1",
            isOpenSource: secData[addr].is_open_source === "1",
            buyTax: secData[addr].buy_tax || "0",
            sellTax: secData[addr].sell_tax || "0",
            riskLevel: parseInt(secData[addr].trust_list || "0") ? "Low" : "High"
          };
        }
      }
      
      // Add twitter data if available
      if (twitterResult.status === 'fulfilled' && twitterResult.value.data) {
        metrics.twitter = twitterResult.value.data;
      }
      
      console.log("Final metrics object created, caching results");
      
      // Cache the result
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour cache
      
      await supabaseClient
        .from('token_data_cache')
        .upsert({
          token_id: tokenId,
          data: metrics,
          expires_at: expiresAt.toISOString(),
          last_updated: new Date().toISOString()
        });
        
      // Get authentication info from request to save scan history
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        try {
          // Extract token from Bearer header
          const token = authHeader.replace('Bearer ', '');
          const { data: { user } } = await supabaseClient.auth.getUser(token);
          
          if (user) {
            console.log(`Saving scan history for user: ${user.id}`);
            // Save scan history for authenticated user
            await supabaseClient
              .from('token_scans')
              .insert({
                user_id: user.id,
                token_id: tokenId,
                token_symbol: metrics.symbol,
                token_name: metrics.name,
                health_score: metrics.healthScore,
                category_scores: metrics.categories
              });
          }
        } catch (authError) {
          // Log but don't fail the request if saving history fails
          console.error(`Error saving scan history: ${authError.message}`);
        }
      }

      console.log("Returning final metrics to client");
      return new Response(JSON.stringify(metrics), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error(`Error processing request: ${error.message}`);
    
    return new Response(
      JSON.stringify({ error: "Error processing token scan", message: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
