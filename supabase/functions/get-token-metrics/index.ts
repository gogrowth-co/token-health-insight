import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from "../_shared/cors.ts";

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

async function getTVL(tokenId: string) {
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
    
    if (data.market_data && data.market_data.total_value_locked) {
      tvlValue = data.market_data.total_value_locked.usd || 0;
      tvlChange24h = data.market_data.total_value_locked_24h_percentage_change || 0;
    }
    
    return { 
      tvl: tvlValue > 0 ? formatCurrency(tvlValue) : "N/A", 
      tvlValue, 
      tvlChange24h 
    };
  } catch (error) {
    console.error('Error fetching TVL data:', error);
    return { tvl: "N/A", tvlValue: 0, tvlChange24h: 0 };
  }
}

async function getLiquidityLockInfo(network: string, tokenAddress: string) {
  if (!tokenAddress || network !== 'eth' || !ETHERSCAN_API_KEY) {
    return { liquidityLock: "N/A", liquidityLockDays: 0 };
  }
  
  try {
    console.log(`Fetching liquidity lock info from Etherscan for ${tokenAddress}`);
    
    // Check for lock contracts or timelocks using Etherscan API
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${tokenAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
    
    const response = await fetchWithRetry(url, {});
    
    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== '1' || !data.result) {
      return { liquidityLock: "N/A", liquidityLockDays: 0 };
    }
    
    // Look for common liquidity locker contracts in the transaction list
    const lockerAddresses = [
      '0x000000000000000000000000000000000000dead', // Dead address
      '0x663a5c229c09b049e36dcc11a9dd1d7a4f3dc50d', // Unicrypt
      '0x82ef791a91047d0c4c4fedd0cbe1c101ea9a5a9b', // Team Finance
      '0x9709f9690aef44dd3ccf39b5fca9413c60d38e2d', // PinkLock
    ];
    
    const lockTransactions = data.result.filter((tx: any) => 
      lockerAddresses.some(addr => tx.to.toLowerCase() === addr.toLowerCase()) && 
      tx.isError === '0'
    );
    
    if (lockTransactions.length === 0) {
      return { liquidityLock: "Not Found", liquidityLockDays: 0 };
    }
    
    // Get the latest lock transaction
    const latestLock = lockTransactions[0];
    
    // Estimate lock period based on contract and input data
    let lockDays = 0;
    let lockInfo = "Unknown Lock";
    
    if (latestLock.to.toLowerCase() === '0x000000000000000000000000000000000000dead') {
      // If sent to dead address, it's permanent
      lockDays = 36500; // 100 years
      lockInfo = "Permanent";
    } else if (latestLock.to.toLowerCase() === '0x663a5c229c09b049e36dcc11a9dd1d7a4f3dc50d') {
      // Unicrypt typically has 6 month to 4 year locks
      lockDays = 180; // Estimate 6 months as minimum
      lockInfo = "180+ days (Unicrypt)";
    } else if (latestLock.to.toLowerCase() === '0x82ef791a91047d0c4c4fedd0cbe1c101ea9a5a9b') {
      // Team Finance typically has 30 day to 1 year locks
      lockDays = 30; // Estimate 30 days as minimum
      lockInfo = "30+ days (Team Finance)";
    } else if (latestLock.to.toLowerCase() === '0x9709f9690aef44dd3ccf39b5fca9413c60d38e2d') {
      // PinkLock typically has 30 day to 1 year locks
      lockDays = 30; // Estimate 30 days as minimum
      lockInfo = "30+ days (PinkLock)";
    }
    
    return { liquidityLock: lockInfo, liquidityLockDays: lockDays };
  } catch (error) {
    console.error('Error fetching liquidity lock info:', error);
    return { liquidityLock: "Error", liquidityLockDays: 0 };
  }
}

async function getContractVerificationStatus(network: string, tokenAddress: string) {
  if (!tokenAddress || network !== 'eth' || !ETHERSCAN_API_KEY) {
    return "N/A";
  }
  
  try {
    // Use Etherscan API to check contract verification
    const url = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${tokenAddress}&apikey=${ETHERSCAN_API_KEY}`;
    console.log('Checking contract verification status from Etherscan');
    
    const response = await fetchWithRetry(url, {});
    
    if (!response.ok) {
      console.error(`Etherscan API error: ${response.status}`);
      throw new Error(`Etherscan API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== '1' || !data.result || data.result.length === 0) {
      console.log('No verification data found');
      return "Not Verified";
    }
    
    // Check if source code is available
    const sourceCode = data.result[0].SourceCode;
    
    const isVerified = sourceCode && sourceCode.length > 0;
    console.log(`Contract verification status: ${isVerified ? 'Verified' : 'Not Verified'}`);
    
    return isVerified ? "Verified" : "Not Verified";
  } catch (error) {
    console.error('Error checking contract verification:', error);
    return "N/A";
  }
}

async function getTopHoldersData(network: string, tokenAddress: string) {
  if (!tokenAddress) {
    console.log('No token address provided for holders data');
    return { 
      topHoldersPercentage: "N/A", 
      topHoldersValue: 0, 
      topHoldersTrend: null,
      topHolders: []
    };
  }
  
  try {
    console.log(`Getting top holders data for ${tokenAddress} on network ${network}`);
    
    // First try to ensure the table exists
    try {
      await ensureTokenHoldersCacheExists();
      console.log('Token holders cache table exists or was created');
    } catch (tableError) {
      console.error('Error ensuring token_holders_cache table exists:', tableError);
      // Continue anyway, the query below will fail if the table doesn't exist
    }
    
    // Check cache
    try {
      const { data: cachedData, error: cacheError } = await supabase
        .from('token_holders_cache')
        .select('*')
        .eq('token_address', tokenAddress.toLowerCase())
        .single();
      
      if (cachedData && !cacheError) {
        const cacheTime = new Date(cachedData.last_updated);
        const now = new Date();
        const cacheAgeHours = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);
        
        // Use cache if it's less than 24 hours old
        if (cacheAgeHours < 24) {
          console.log(`Cache hit for holders data: ${tokenAddress} (age: ${cacheAgeHours.toFixed(1)} hours)`);
          
          // Parse the holders data from the cached JSON string
          let parsedHolders = [];
          try {
            if (cachedData.holders_data) {
              parsedHolders = JSON.parse(cachedData.holders_data);
            }
          } catch (parseError) {
            console.error('Error parsing cached holders data:', parseError);
          }
          
          return {
            topHoldersPercentage: cachedData.percentage,
            topHoldersValue: cachedData.value,
            topHoldersTrend: cachedData.trend,
            topHolders: parsedHolders,
            fromCache: true
          };
        } else {
          console.log(`Cache expired for holders data: ${tokenAddress}`);
        }
      } else if (cacheError) {
        console.error('Cache error for holders data:', cacheError);
      }
    } catch (cacheQueryError) {
      console.error('Error querying token_holders_cache:', cacheQueryError);
    }
    
    // Use GoPlus Security API to get top holders data
    const chainId = getChainIdForNetwork(network);
    if (!chainId) {
      console.log(`Unsupported network for holders data: ${network}`);
      return { 
        topHoldersPercentage: "N/A", 
        topHoldersValue: 0, 
        topHoldersTrend: null,
        topHolders: []
      };
    }
    
    const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_address=${tokenAddress}`;
    console.log(`Fetching top holders data from GoPlus Security for chain ID ${chainId}`);
    
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
      
      // Check for stale cache as fallback
      const { data: staleCache } = await supabase
        .from('token_holders_cache')
        .select('*')
        .eq('token_address', tokenAddress.toLowerCase())
        .single();
        
      if (staleCache) {
        console.log(`Using stale cache data for ${tokenAddress} as fallback due to API error`);
        
        // Parse the holders data from the cached JSON string
        let parsedHolders = [];
        try {
          if (staleCache.holders_data) {
            parsedHolders = JSON.parse(staleCache.holders_data);
          }
        } catch (parseError) {
          console.error('Error parsing stale cached holders data:', parseError);
        }
        
        return {
          topHoldersPercentage: staleCache.percentage,
          topHoldersValue: staleCache.value,
          topHoldersTrend: staleCache.trend,
          topHolders: parsedHolders,
          fromCache: true
        };
      }
      
      throw new Error(`GoPlus API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('GoPlus API response received');
    
    if (data.code !== 1 || !data.result || !data.result[tokenAddress.toLowerCase()]) {
      console.log('No holder data found');
      
      // If no data but we have stale cache, use it as fallback
      const { data: staleCache } = await supabase
        .from('token_holders_cache')
        .select('*')
        .eq('token_address', tokenAddress.toLowerCase())
        .single();
        
      if (staleCache) {
        console.log(`Using stale cache data for ${tokenAddress} as fallback due to missing data`);
        
        // Parse the holders data from the cached JSON string
        let parsedHolders = [];
        try {
          if (staleCache.holders_data) {
            parsedHolders = JSON.parse(staleCache.holders_data);
          }
        } catch (parseError) {
          console.error('Error parsing stale cached holders data:', parseError);
        }
        
        return {
          topHoldersPercentage: staleCache.percentage,
          topHoldersValue: staleCache.value,
          topHoldersTrend: staleCache.trend,
          topHolders: parsedHolders,
          fromCache: true
        };
      }
      
      return { 
        topHoldersPercentage: "N/A", 
        topHoldersValue: 0, 
        topHoldersTrend: null,
        topHolders: []
      };
    }
    
    // Get top holders percentage if available
    const securityData = data.result[tokenAddress.toLowerCase()];
    let holdersPercentage = 0;
    let topHolders = [];
    
    if (securityData.holder_count && securityData.holders) {
      // Convert holders object to array and sort by percentage
      const holdersArray = Object.entries(securityData.holders).map(([address, holder]: [string, any]) => ({
        address,
        percentage: parseFloat(holder.percent)
      }));
      
      // Sort by percentage (highest first)
      holdersArray.sort((a, b) => b.percentage - a.percentage);
      
      // Take top 10 holders
      topHolders = holdersArray.slice(0, 10);
      
      // Calculate top 10 holders percentage
      holdersPercentage = topHolders.reduce((total, holder) => total + holder.percentage, 0);
      console.log(`Calculated top 10 holders percentage: ${holdersPercentage}%`);
      console.log(`Found ${topHolders.length} top holders`);
    }
    
    // Determine risk trend based on percentage
    let trend = null;
    if (holdersPercentage > 0) {
      trend = holdersPercentage > 50 ? "up" : "down";
    }
    
    console.log(`Top holders percentage: ${holdersPercentage > 0 ? holdersPercentage.toFixed(1) + '%' : 'N/A'}`);
    
    // Cache the result including the detailed holders data
    try {
      await supabase
        .from('token_holders_cache')
        .upsert({
          token_address: tokenAddress.toLowerCase(),
          percentage: holdersPercentage > 0 ? `${holdersPercentage.toFixed(1)}%` : "N/A",
          value: holdersPercentage,
          trend: trend,
          holders_data: JSON.stringify(topHolders),
          last_updated: new Date().toISOString()
        });
        
      console.log('Saved holders data to cache');
    } catch (cacheError) {
      console.error('Error caching holders data:', cacheError);
    }
    
    return {
      topHoldersPercentage: holdersPercentage > 0 ? `${holdersPercentage.toFixed(1)}%` : "N/A",
      topHoldersValue: holdersPercentage,
      topHoldersTrend: trend,
      topHolders: topHolders
    };
  } catch (error) {
    console.error('Error fetching top holders data:', error);
    return { 
      topHoldersPercentage: "N/A", 
      topHoldersValue: 0, 
      topHoldersTrend: null,
      topHolders: []
    };
  }
}

// Helper function to convert network name to chain ID for GoPlus API
function getChainIdForNetwork(network: string): string | null {
  const networkMap: Record<string, string> = {
    'eth': '1', 
    'ethereum': '1',
    'bsc': '56', 
    'binance-smart-chain': '56',
    'polygon': '137', 
    'polygon-pos': '137',
    'avalanche': '43114',
    'arbitrum': '42161', 
    'arbitrum-one': '42161',
    'optimism': '10', 
    'optimistic-ethereum': '10',
    'fantom': '250',
    'base': '8453'
  };
  
  return networkMap[network.toLowerCase()] || null;
}

// Helper function to format currency
function formatCurrency(value: number): string {
  if (!value) return "N/A";
  
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}

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
      console.error(`GoPlus API error: ${response.status}`);
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

// Main handler
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get token info from request body
    const requestBody = await req.json();
    const { token, address, twitter, github, sources = {}, includeSecurity = false } = requestBody;
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token parameter is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log(`Processing metrics for token: ${token}, address: ${address || 'N/A'}, twitter: ${twitter || 'N/A'}, github: ${github || 'N/A'}`);
    console.log(`Data sources: ${JSON.stringify(sources)}`);
    
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
        getTVL(token),
        getContractVerificationStatus(network, contractAddress),
        getTopHoldersData(network, contractAddress),
        getLiquidityLockInfo(network, contractAddress)
      ];
      
      // Only fetch security info if requested
      if (includeSecurity) {
        fetchPromises.push(getSecurityInfo(network, contractAddress));
      }
      
      const results = await Promise.all(fetchPromises);
      
      // Extract results
      const [tvlData, auditStatus, topHoldersData, liquidityLockInfo, securityInfo] = results;
      
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
      
      // Add security metrics if available
      if (securityInfo) {
        Object.assign(metrics, securityInfo);
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
        freezeAuthority: "N/A"
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
