
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from "../_shared/cors.ts";

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API keys (would be better to store these as secrets)
const ETHERSCAN_API_KEY = Deno.env.get('ETHERSCAN_API_KEY') || '';
const GOPLUS_API_KEY = Deno.env.get('GOPLUS_API_KEY') || '';
const GITHUB_API_KEY = Deno.env.get('GITHUB_API_KEY') || '';

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
    tvl: string;
    tvlValue: number;
    tvlChange24h: number;
    auditStatus: string;
    socialFollowers: string;
    socialFollowersCount: number;
    socialFollowersChange: number;
    githubActivity?: string;
    githubCommits?: number;
  };
  cacheHit: boolean;
}

async function getTokenData(tokenId: string) {
  try {
    console.log(`Fetching token data from CoinGecko for ${tokenId}`);
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&market_data=true`, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
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

async function getTVL(network: string, tokenAddress: string) {
  if (!tokenAddress) return { tvl: "N/A", tvlValue: 0, tvlChange24h: 0, liquidityLock: "N/A", liquidityLockDays: 0 };
  
  try {
    // Attempt to get pools data from GeckoTerminal
    const url = `https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${tokenAddress}/pools`;
    console.log(`Fetching TVL data from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`GeckoTerminal API error: ${response.status}`);
      throw new Error(`GeckoTerminal API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      console.log('No pool data found for token');
      return { tvl: "N/A", tvlValue: 0, tvlChange24h: 0, liquidityLock: "N/A", liquidityLockDays: 0 };
    }
    
    // Calculate total TVL across all pools
    let totalTVL = 0;
    let tvlChange24h = 0;
    let poolsWithData = 0;
    let liquidityLocked = false;
    let lockDuration = 0;
    
    console.log(`Found ${data.data.length} pools for token`);
    
    for (const pool of data.data.slice(0, 5)) { // Limit to top 5 pools
      const attributes = pool.attributes;
      
      // Add to TVL if reserve_in_usd is available
      if (attributes.reserve_in_usd) {
        totalTVL += parseFloat(attributes.reserve_in_usd);
        
        // Add to 24h change if available
        if (attributes.reserve_change_24h) {
          tvlChange24h += parseFloat(attributes.reserve_change_24h);
          poolsWithData++;
        }
      }
      
      // Check for liquidity lock information
      if (attributes.liquidity_locked_until || attributes.lock_duration) {
        liquidityLocked = true;
        
        // Get the longest lock duration
        if (attributes.lock_duration && parseInt(attributes.lock_duration) > lockDuration) {
          lockDuration = parseInt(attributes.lock_duration);
        } else if (attributes.liquidity_locked_until) {
          // Calculate days remaining in lock
          const lockDate = new Date(attributes.liquidity_locked_until);
          const now = new Date();
          const daysRemaining = Math.ceil((lockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysRemaining > lockDuration) {
            lockDuration = daysRemaining > 0 ? daysRemaining : 0;
          }
        }
      }
    }
    
    // Calculate average TVL change if we have data
    if (poolsWithData > 0) {
      tvlChange24h = tvlChange24h / poolsWithData;
    }
    
    // Format TVL
    const formattedTVL = formatCurrency(totalTVL);
    
    // Format liquidity lock status
    let liquidityLockStatus = "Unlocked";
    if (liquidityLocked && lockDuration > 0) {
      if (lockDuration > 365) {
        liquidityLockStatus = "365+ days";
      } else {
        liquidityLockStatus = `${lockDuration} days`;
      }
    }
    
    console.log(`TVL: ${formattedTVL}, Liquidity Lock: ${liquidityLockStatus}, Lock Days: ${lockDuration}`);
    
    return {
      tvl: formattedTVL,
      tvlValue: totalTVL,
      tvlChange24h: tvlChange24h,
      liquidityLock: liquidityLockStatus,
      liquidityLockDays: lockDuration
    };
  } catch (error) {
    console.error('Error fetching TVL data:', error);
    return { tvl: "N/A", tvlValue: 0, tvlChange24h: 0, liquidityLock: "N/A", liquidityLockDays: 0 };
  }
}

async function getContractVerificationStatus(network: string, tokenAddress: string) {
  if (!tokenAddress || network !== 'eth') return "N/A";
  
  try {
    // Use Etherscan API to check contract verification
    const url = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${tokenAddress}&apikey=${ETHERSCAN_API_KEY}`;
    console.log('Checking contract verification status from Etherscan');
    
    const response = await fetch(url);
    
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
  if (!tokenAddress) return { topHoldersPercentage: "N/A", topHoldersValue: 0, topHoldersTrend: null };
  
  try {
    // Use GoPlus Security API to get top holders data
    const chainId = getChainIdForNetwork(network);
    if (!chainId) {
      console.log(`Unsupported network for holders data: ${network}`);
      return { topHoldersPercentage: "N/A", topHoldersValue: 0, topHoldersTrend: null };
    }
    
    const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_address=${tokenAddress}`;
    console.log(`Fetching top holders data from GoPlus Security for chain ID ${chainId}`);
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    
    if (GOPLUS_API_KEY) {
      headers['API-Key'] = GOPLUS_API_KEY;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.error(`GoPlus API error: ${response.status}`);
      throw new Error(`GoPlus API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 1 || !data.result || !data.result[tokenAddress.toLowerCase()]) {
      console.log('No holder data found');
      return { topHoldersPercentage: "N/A", topHoldersValue: 0, topHoldersTrend: null };
    }
    
    // Get top holders percentage if available
    const securityData = data.result[tokenAddress.toLowerCase()];
    let holdersPercentage = 0;
    
    if (securityData.holder_count && securityData.holders) {
      // Calculate top 10 holders percentage
      const topHolders = Object.values(securityData.holders).slice(0, 10);
      holdersPercentage = topHolders.reduce((total: number, holder: any) => total + parseFloat(holder.percent), 0);
    }
    
    // Determine risk trend based on percentage
    let trend = null;
    if (holdersPercentage > 0) {
      trend = holdersPercentage > 50 ? "up" : "down";
    }
    
    console.log(`Top holders percentage: ${holdersPercentage > 0 ? holdersPercentage.toFixed(1) + '%' : 'N/A'}`);
    
    return {
      topHoldersPercentage: holdersPercentage > 0 ? `${holdersPercentage.toFixed(1)}%` : "N/A",
      topHoldersValue: holdersPercentage,
      topHoldersTrend: trend
    };
  } catch (error) {
    console.error('Error fetching top holders data:', error);
    return { topHoldersPercentage: "N/A", topHoldersValue: 0, topHoldersTrend: null };
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

async function getSocialData(twitterHandle: string) {
  if (!twitterHandle) return { socialFollowers: "N/A", socialFollowersCount: 0, socialFollowersChange: 0 };
  
  try {
    // Check if we have cached data for this handle
    const { data: cachedData, error: cacheError } = await supabase
      .from('social_metrics_cache')
      .select('followers_count, previous_count, last_updated')
      .eq('twitter_handle', twitterHandle)
      .single();
    
    if (cachedData) {
      console.log(`Found cached social data for @${twitterHandle}: ${cachedData.followers_count} followers`);
      
      // Calculate % change if we have previous data
      let change = 0;
      if (cachedData.previous_count > 0) {
        change = ((cachedData.followers_count - cachedData.previous_count) / cachedData.previous_count) * 100;
      }
      
      // Format the followers count
      const formattedFollowers = formatFollowerCount(cachedData.followers_count);
      
      return {
        socialFollowers: formattedFollowers,
        socialFollowersCount: cachedData.followers_count,
        socialFollowersChange: change
      };
    } else {
      console.log(`No cached social data for @${twitterHandle}`);
    }
    
    // For now, return placeholder (would be populated by real API call)
    return { socialFollowers: "N/A", socialFollowersCount: 0, socialFollowersChange: 0 };
  } catch (error) {
    console.error('Error fetching social data:', error);
    return { socialFollowers: "N/A", socialFollowersCount: 0, socialFollowersChange: 0 };
  }
}

async function getGithubActivity(githubRepo: string) {
  if (!githubRepo) return { githubActivity: "N/A", githubCommits: 0 };
  
  try {
    // Extract owner/repo from URL if it's a full URL
    let owner = '';
    let repo = '';
    
    if (githubRepo.includes('github.com')) {
      const url = new URL(githubRepo);
      const pathParts = url.pathname.split('/').filter(part => part);
      if (pathParts.length >= 2) {
        owner = pathParts[0];
        repo = pathParts[1];
      }
    } else {
      // Assume format is already owner/repo
      const parts = githubRepo.split('/');
      if (parts.length >= 2) {
        owner = parts[0];
        repo = parts[1];
      }
    }
    
    if (!owner || !repo) {
      return { githubActivity: "N/A", githubCommits: 0 };
    }
    
    // Get commits from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateString = thirtyDaysAgo.toISOString().split('T')[0];
    
    const url = `https://api.github.com/repos/${owner}/${repo}/commits?since=${dateString}&per_page=100`;
    console.log(`Fetching GitHub commits from: ${url}`);
    
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (GITHUB_API_KEY) {
      headers['Authorization'] = `token ${GITHUB_API_KEY}`;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.error(`GitHub API error: ${response.status}`);
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const commits = await response.json();
    
    // Count number of commits
    const commitCount = Array.isArray(commits) ? commits.length : 0;
    
    console.log(`GitHub activity: ${commitCount} commits in last 30 days`);
    
    // Determine activity level
    let activityLevel = "N/A";
    if (commitCount > 50) {
      activityLevel = "Very Active";
    } else if (commitCount > 20) {
      activityLevel = "Active";
    } else if (commitCount > 5) {
      activityLevel = "Moderate";
    } else if (commitCount > 0) {
      activityLevel = "Low";
    } else {
      activityLevel = "Inactive";
    }
    
    return { githubActivity: activityLevel, githubCommits: commitCount };
  } catch (error) {
    console.error('Error fetching GitHub activity:', error);
    return { githubActivity: "N/A", githubCommits: 0 };
  }
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

// Helper function to format follower count
function formatFollowerCount(count: number): string {
  if (!count) return "N/A";
  
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  } else if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  } else {
    return count.toString();
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
    const { token, address, twitter, github } = requestBody;
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token parameter is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log(`Processing metrics for token: ${token}, address: ${address || 'N/A'}, twitter: ${twitter || 'N/A'}`);
    
    // Check cache first
    const { data: cachedMetrics, error: cacheError } = await supabase
      .from('token_metrics_cache')
      .select('*')
      .eq('token_id', token)
      .single();
      
    // Use cached data if it exists and is less than 5 minutes old
    if (cachedMetrics && !cacheError) {
      const cacheTime = new Date(cachedMetrics.last_updated);
      const now = new Date();
      const cacheAgeMinutes = (now.getTime() - cacheTime.getTime()) / (1000 * 60);
      
      if (cacheAgeMinutes < 5) {
        console.log(`Cache hit for token metrics: ${token} (age: ${cacheAgeMinutes.toFixed(1)} minutes)`);
        
        return new Response(
          JSON.stringify({ 
            metrics: cachedMetrics.metrics,
            cacheHit: true
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
    const network = requestBody.blockchain?.toLowerCase() || 'eth'; // In a real implementation, determine from token data
    
    // Get contract address from token data if not provided
    const contractAddress = address || (tokenData && tokenData.contract_address) || '';
    
    // Get Twitter handle if not provided
    const twitterHandle = twitter || (tokenData && tokenData.links && tokenData.links.twitter_screen_name) || '';

    // Get GitHub repo if not provided
    const githubRepo = github || (tokenData && tokenData.links && tokenData.links.repos_url && tokenData.links.repos_url.github && tokenData.links.repos_url.github[0]) || '';
    
    // Fetch all metrics in parallel
    const [tvlData, auditStatus, topHoldersData, socialData, githubData] = await Promise.all([
      getTVL(network, contractAddress),
      getContractVerificationStatus(network, contractAddress),
      getTopHoldersData(network, contractAddress),
      getSocialData(twitterHandle),
      getGithubActivity(githubRepo)
    ]);
    
    // Construct metrics response
    const metrics: TokenMetricsResponse['metrics'] = {
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
      
      // Contract verification status
      auditStatus,
      
      // Top holders data
      ...topHoldersData,
      
      // Social data
      ...socialData,
      
      // GitHub data
      ...githubData
    };
    
    // Cache the metrics
    await supabase
      .from('token_metrics_cache')
      .upsert({
        token_id: token,
        metrics,
        last_updated: new Date().toISOString()
      })
      .eq('token_id', token);
    
    return new Response(
      JSON.stringify({ 
        metrics,
        cacheHit: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error processing metrics:", error);
    return new Response(
      JSON.stringify({ error: 'Failed to process metrics', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
