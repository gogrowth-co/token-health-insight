
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Define headers for CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface TokenomicsData {
  buyTax: number
  sellTax: number
  isMintable: boolean
  holdersCount: number
  topHolderPct: number | null
  top5HoldersPct: number | null
  totalSupply: number | null
  name?: string
  symbol?: string
  scannedAt: string
}

// Function to get data from GoPlus Security API
async function fetchGoPlusData(contractAddress: string): Promise<{
  buyTax: number
  sellTax: number
  isMintable: boolean
}> {
  try {
    const response = await fetch(
      `https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=${contractAddress}`,
      { method: 'GET' }
    )
    
    if (!response.ok) {
      throw new Error(`GoPlus API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Extract contract data
    const contractData = data?.result?.[contractAddress.toLowerCase()]
    
    if (!contractData) {
      throw new Error('No contract data found')
    }
    
    // Extract values
    const buyTax = contractData.buy_tax ? Number(contractData.buy_tax) : 0
    const sellTax = contractData.sell_tax ? Number(contractData.sell_tax) : 0
    const isMintable = contractData.is_mintable === '1'
    
    return {
      buyTax,
      sellTax,
      isMintable
    }
  } catch (error) {
    console.error('Error fetching GoPlus data:', error)
    return {
      buyTax: 0,
      sellTax: 0,
      isMintable: false
    }
  }
}

// Function to get holder count from Etherscan API
async function fetchHolderCount(contractAddress: string): Promise<number> {
  try {
    // Get API key from secrets
    const { data: secretData } = await supabase.functions.invoke('get-secret', {
      body: { secretName: 'ETHERSCAN_API_KEY' }
    })
    
    const apiKey = secretData?.value
    
    if (!apiKey) {
      throw new Error('Etherscan API key not available')
    }
    
    const response = await fetch(
      `https://api.etherscan.io/api?module=token&action=tokenholderlist&contractaddress=${contractAddress}&apikey=${apiKey}`,
      { method: 'GET' }
    )
    
    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status === '1' && Array.isArray(data.result)) {
      return data.result.length
    } else {
      // Try alternative endpoint for holder count
      const countResponse = await fetch(
        `https://api.etherscan.io/api?module=token&action=tokenholdercount&contractaddress=${contractAddress}&apikey=${apiKey}`,
        { method: 'GET' }
      )
      
      const countData = await countResponse.json()
      
      if (countData.status === '1' && countData.result) {
        return parseInt(countData.result, 10)
      }
    }
    
    throw new Error('Failed to get holder count')
  } catch (error) {
    console.error('Error fetching holder count:', error)
    return 0
  }
}

// Function to get top holders from Ethplorer API
async function fetchTopHolders(contractAddress: string): Promise<{
  topHolderPct: number | null
  top5HoldersPct: number | null
  totalSupply: number | null
  name?: string
  symbol?: string
}> {
  try {
    const response = await fetch(
      `https://api.ethplorer.io/getTopTokenHolders/${contractAddress}?apiKey=freekey`,
      { method: 'GET' }
    )
    
    if (!response.ok) {
      throw new Error(`Ethplorer API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    let topHolderPct = null
    let top5HoldersPct = null
    let totalSupply = null
    let name = undefined
    let symbol = undefined
    
    // Extract top holder percentages
    if (data?.holders && Array.isArray(data.holders) && data.holders.length > 0) {
      topHolderPct = data.holders[0].share
      
      // Calculate top 5 holders percentage
      top5HoldersPct = data.holders
        .slice(0, Math.min(5, data.holders.length))
        .reduce((sum, holder) => sum + holder.share, 0)
    }
    
    // Extract token info if available (for fallback)
    if (data?.tokenInfo) {
      if (data.tokenInfo.totalSupply) {
        totalSupply = parseFloat(data.tokenInfo.totalSupply)
      }
      if (data.tokenInfo.name) {
        name = data.tokenInfo.name
      }
      if (data.tokenInfo.symbol) {
        symbol = data.tokenInfo.symbol
      }
    }
    
    return {
      topHolderPct,
      top5HoldersPct,
      totalSupply,
      name,
      symbol
    }
  } catch (error) {
    console.error('Error fetching top holders:', error)
    return {
      topHolderPct: null,
      top5HoldersPct: null,
      totalSupply: null
    }
  }
}

// Cache results in the database
async function cacheTokenomicsData(contractAddress: string, data: TokenomicsData): Promise<void> {
  try {
    await supabase
      .from('token_data_cache')
      .upsert(
        {
          token_id: contractAddress.toLowerCase(),
          data: { tokenomics: data },
          last_updated: new Date().toISOString(),
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString() // 24 hour cache
        },
        { onConflict: 'token_id' }
      )
  } catch (error) {
    console.error('Error caching tokenomics data:', error)
  }
}

// Check cache for tokenomics data
async function getCachedTokenomicsData(contractAddress: string): Promise<TokenomicsData | null> {
  try {
    const { data, error } = await supabase
      .from('token_data_cache')
      .select('data, last_updated, expires_at')
      .eq('token_id', contractAddress.toLowerCase())
      .maybeSingle()
    
    if (error) throw error
    
    if (data && data.data?.tokenomics && new Date(data.expires_at) > new Date()) {
      return data.data.tokenomics
    }
    
    return null
  } catch (error) {
    console.error('Error checking cache:', error)
    return null
  }
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Parse the request body
    const { contractAddress } = await req.json()
    
    if (!contractAddress || !contractAddress.startsWith('0x')) {
      return new Response(
        JSON.stringify({ error: 'Invalid contract address' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Check cache first
    const cachedData = await getCachedTokenomicsData(contractAddress)
    
    if (cachedData) {
      return new Response(
        JSON.stringify({ data: cachedData, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Fetch data from all sources in parallel
    const [goPlusData, holdersCount, topHoldersData] = await Promise.all([
      fetchGoPlusData(contractAddress),
      fetchHolderCount(contractAddress),
      fetchTopHolders(contractAddress)
    ])
    
    // Combine all data
    const tokenomicsData: TokenomicsData = {
      ...goPlusData,
      holdersCount,
      ...topHoldersData,
      scannedAt: new Date().toISOString()
    }
    
    // Cache the results
    await cacheTokenomicsData(contractAddress, tokenomicsData)
    
    return new Response(
      JSON.stringify({ data: tokenomicsData, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    
    return new Response(
      JSON.stringify({ error: 'Failed to fetch tokenomics data' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
