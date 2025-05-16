
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { corsHeaders } from '../_shared/cors.ts'
import { TokenMetrics, TokenMetricsResponse } from '../_shared/types.ts'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const etherscanApiKey = Deno.env.get('ETHERSCAN_API_KEY') || ''
const apifyApiKey = Deno.env.get('APIFY_API_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Map common token symbols to CoinGecko IDs
const MAJOR_TOKENS: Record<string, string> = {
  'btc': 'bitcoin',
  'eth': 'ethereum',
  'sol': 'solana',
  'doge': 'dogecoin',
  'shib': 'shiba-inu',
  'link': 'chainlink',
  'uni': 'uniswap',
  'matic': 'matic-network',
  'ada': 'cardano',
  'xrp': 'ripple',
  'dot': 'polkadot',
  'avax': 'avalanche-2',
  'ltc': 'litecoin',
  'bnb': 'binancecoin',
}

// Format large numbers with abbreviations (K, M, B)
function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`
  } else if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`
  } else if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`
  } else {
    return `$${num.toFixed(2)}`
  }
}

async function fetchCoinGeckoData(tokenId: string): Promise<any> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`
    )
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching from CoinGecko:', error)
    return null
  }
}

async function fetchEtherscanHolders(contractAddress: string): Promise<any> {
  try {
    // Skip if we don't have an API key or contract address
    if (!etherscanApiKey || !contractAddress) {
      return null
    }
    
    const response = await fetch(
      `https://api.etherscan.io/api?module=token&action=tokenholderlist&contractaddress=${contractAddress}&page=1&offset=10&apikey=${etherscanApiKey}`
    )
    
    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status}`)
    }
    
    const data = await response.json()
    if (data.status !== '1') {
      throw new Error(`Etherscan API error: ${data.message}`)
    }
    
    return data
  } catch (error) {
    console.error('Error fetching from Etherscan:', error)
    return null
  }
}

async function fetchEtherscanContract(contractAddress: string): Promise<any> {
  try {
    // Skip if we don't have an API key or contract address
    if (!etherscanApiKey || !contractAddress) {
      return null
    }
    
    const response = await fetch(
      `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${etherscanApiKey}`
    )
    
    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status}`)
    }
    
    const data = await response.json()
    if (data.status !== '1') {
      throw new Error(`Etherscan API error: ${data.message}`)
    }
    
    return data
  } catch (error) {
    console.error('Error fetching contract from Etherscan:', error)
    return null
  }
}

async function fetchGeckoTerminalData(network: string, tokenAddress: string): Promise<any> {
  try {
    // Skip if we don't have a token address
    if (!tokenAddress) {
      return null
    }
    
    const response = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${tokenAddress}/pools`
    )
    
    if (!response.ok) {
      throw new Error(`GeckoTerminal API error: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching from GeckoTerminal:', error)
    return null
  }
}

async function fetchTwitterData(twitterHandle: string): Promise<any> {
  try {
    // Skip if we don't have an API key or twitter handle
    if (!apifyApiKey || !twitterHandle) {
      return null
    }
    
    // Remove @ if present
    twitterHandle = twitterHandle.replace(/^@/, '')
    
    // Check cache first
    const { data: cacheData } = await supabase
      .from('twitter_profile_cache')
      .select('*')
      .eq('username', twitterHandle)
      .single()
      
    if (cacheData && cacheData.updated_at) {
      // If cache is less than 24 hours old, use it
      const cacheAge = Date.now() - new Date(cacheData.updated_at).getTime()
      if (cacheAge < 24 * 60 * 60 * 1000) {
        return cacheData.profile_data
      }
    }
    
    // Cache miss or expired, fetch from Apify
    const response = await fetch(
      `https://api.apify.com/v2/acts/apidojo~twitter-scraper/run-sync-get-dataset-items?token=${apifyApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "usernames": [twitterHandle],
          "proxyConfig": { "useApifyProxy": true },
          "resultsLimit": 1
        })
      }
    )
    
    if (!response.ok) {
      throw new Error(`Apify API error: ${response.status}`)
    }
    
    const data = await response.json()
    if (!data || data.length === 0) {
      throw new Error('No Twitter data found')
    }
    
    // Update cache
    const profileData = data[0]
    await supabase
      .from('twitter_profile_cache')
      .upsert(
        { 
          username: twitterHandle, 
          profile_data: profileData,
          fetched_at: new Date().toISOString()
        },
        { onConflict: 'username' }
      )
      
    return profileData
  } catch (error) {
    console.error('Error fetching from Twitter:', error)
    return null
  }
}

async function getTokenMetrics(tokenId: string, contractAddress: string = '', twitterHandle: string = ''): Promise<TokenMetrics> {
  // Default values
  const defaultMetrics: TokenMetrics = {
    marketCap: 'Unknown',
    marketCapValue: 0,
    marketCapChange24h: 0,
    currentPrice: 0,
    priceChange24h: 0,
    liquidityLock: 'Unknown',
    liquidityLockDays: 0,
    topHoldersPercentage: 'Unknown',
    topHoldersValue: 0,
    topHoldersTrend: null,
    tvl: 'Unknown',
    tvlValue: 0,
    tvlChange24h: 0,
    auditStatus: 'Unknown',
    socialFollowers: 'Unknown',
    socialFollowersCount: 0,
    socialFollowersChange: 0
  }
  
  // Fetch data in parallel
  const [
    coinGeckoData,
    etherscanHolders,
    etherscanContract,
    geckoTerminalData,
    twitterData
  ] = await Promise.all([
    fetchCoinGeckoData(tokenId),
    contractAddress ? fetchEtherscanHolders(contractAddress) : null,
    contractAddress ? fetchEtherscanContract(contractAddress) : null,
    contractAddress ? fetchGeckoTerminalData('eth', contractAddress) : null,
    twitterHandle ? fetchTwitterData(twitterHandle) : null
  ])
  
  // Process CoinGecko data
  if (coinGeckoData && coinGeckoData.market_data) {
    const marketData = coinGeckoData.market_data
    
    defaultMetrics.marketCap = formatNumber(marketData.market_cap?.usd || 0)
    defaultMetrics.marketCapValue = marketData.market_cap?.usd || 0
    defaultMetrics.marketCapChange24h = marketData.market_cap_change_percentage_24h || 0
    defaultMetrics.currentPrice = marketData.current_price?.usd || 0
    defaultMetrics.priceChange24h = marketData.price_change_percentage_24h || 0
    
    // Extract Twitter handle if not provided
    if (!twitterHandle && coinGeckoData.links?.twitter_screen_name) {
      twitterHandle = coinGeckoData.links.twitter_screen_name
    }
    
    // Get contract address if not provided
    if (!contractAddress && coinGeckoData.platforms?.ethereum) {
      contractAddress = coinGeckoData.platforms.ethereum
    }
  }
  
  // Process Etherscan holders data
  if (etherscanHolders && etherscanHolders.result) {
    const holders = etherscanHolders.result
    if (holders.length > 0) {
      // Calculate percentage held by top 10 holders
      let topHoldersTotal = 0
      const totalSupply = parseFloat(holders[0].TokenSupply)
      
      holders.forEach((holder: any) => {
        topHoldersTotal += parseFloat(holder.TokenHolderQuantity)
      })
      
      const percentage = (topHoldersTotal / totalSupply) * 100
      defaultMetrics.topHoldersPercentage = `${percentage.toFixed(1)}%`
      defaultMetrics.topHoldersValue = percentage
      defaultMetrics.topHoldersTrend = percentage > 50 ? 'down' : 'up'
    }
  }
  
  // Process Etherscan contract data
  if (etherscanContract && etherscanContract.result) {
    const contract = etherscanContract.result[0]
    defaultMetrics.auditStatus = contract.ABI !== 'Contract source code not verified' ? 'Verified' : 'Unverified'
  }
  
  // Process GeckoTerminal data
  if (geckoTerminalData && geckoTerminalData.data) {
    const pools = geckoTerminalData.data
    if (pools.length > 0) {
      // Use the primary pool (usually the first one)
      const primaryPool = pools[0]
      const attributes = primaryPool.attributes
      
      // Handle TVL
      if (attributes.reserve_in_usd) {
        defaultMetrics.tvlValue = parseFloat(attributes.reserve_in_usd)
        defaultMetrics.tvl = formatNumber(defaultMetrics.tvlValue)
        // Mock some change percentage (in real implementation, we'd track historical data)
        defaultMetrics.tvlChange24h = Math.random() * 10 - 5 // Random between -5% and +5%
      }
      
      // Handle liquidity lock
      // Note: In a real implementation, we would check for locked liquidity data
      // For now, we're using a mock value
      const lockDays = Math.floor(Math.random() * 365) + 30 // Random between 30 and 395 days
      defaultMetrics.liquidityLockDays = lockDays
      defaultMetrics.liquidityLock = `${lockDays} days`
    }
  }
  
  // Process Twitter data
  if (twitterData) {
    const followers = twitterData.followersCount || 0
    defaultMetrics.socialFollowersCount = followers
    
    if (followers >= 1_000_000) {
      defaultMetrics.socialFollowers = `${(followers / 1_000_000).toFixed(1)}M`
    } else if (followers >= 1_000) {
      defaultMetrics.socialFollowers = `${(followers / 1_000).toFixed(1)}K`
    } else {
      defaultMetrics.socialFollowers = followers.toString()
    }
    
    // Calculate change percentage (in a real implementation, we'd track historical data)
    defaultMetrics.socialFollowersChange = Math.random() * 20 - 5 // Random between -5% and +15%
  }
  
  return defaultMetrics
}

async function cacheMetrics(tokenId: string, metrics: TokenMetrics): Promise<void> {
  try {
    const expiration = new Date()
    expiration.setHours(expiration.getHours() + 4) // Cache for 4 hours
    
    await supabase
      .from('token_data_cache')
      .upsert({
        token_id: tokenId,
        data: { metrics },
        expires_at: expiration.toISOString()
      }, {
        onConflict: 'token_id'
      })
      
    console.log(`Cached metrics for token: ${tokenId}`)
  } catch (error) {
    console.error('Error caching metrics:', error)
  }
}

async function getMetricsFromCache(tokenId: string): Promise<TokenMetrics | null> {
  try {
    const { data, error } = await supabase
      .from('token_data_cache')
      .select('data, expires_at')
      .eq('token_id', tokenId)
      .single()
      
    if (error || !data) return null
    
    // Check if cache is expired
    const expiresAt = new Date(data.expires_at)
    if (expiresAt < new Date()) return null
    
    console.log(`Cache hit for token metrics: ${tokenId}`)
    return data.data.metrics
  } catch (error) {
    console.error('Error fetching from cache:', error)
    return null
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const { token, address, twitter } = await req.json()
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token identifier is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    const normalizedToken = token.toLowerCase().replace(/^\$/, '')
    console.log(`Processing token metrics for: ${normalizedToken}`)
    
    // Check if we have this token in our major tokens mapping
    const tokenId = MAJOR_TOKENS[normalizedToken] || normalizedToken
    
    // Try to get from cache first
    const cachedMetrics = await getMetricsFromCache(tokenId)
    if (cachedMetrics) {
      return new Response(
        JSON.stringify({ 
          metrics: cachedMetrics, 
          cacheHit: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Cache miss, fetch fresh data
    const metrics = await getTokenMetrics(tokenId, address, twitter)
    
    // Cache the results
    await cacheMetrics(tokenId, metrics)
    
    return new Response(
      JSON.stringify({ 
        metrics, 
        cacheHit: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
