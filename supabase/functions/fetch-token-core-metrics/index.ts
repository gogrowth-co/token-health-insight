
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to validate Ethereum addresses
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Function to normalize Ethereum addresses (lowercase)
function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

// Define the response type for token metrics
interface TokenCoreMetrics {
  name: string;
  symbol: string;
  price: number | null;
  marketCap: number | null;
  volume24h: number | null; 
  dexVolume24h: number | null;
  liquidityUSD: number | null;
  supply: number | null;
  contractAddress: string;
  dataQuality: "complete" | "partial" | "minimal";
  dataSources: string[];
  scannedAt: string;
  tvlSparkline?: {
    data: number[];
    trend: 'up' | 'down';
    change: number;
  };
  communityData?: {
    twitterFollowers?: number;
    telegramUsers?: number;
    redditSubscribers?: number;
  };
  developerData?: {
    forks?: number;
    stars?: number;
    commitCount?: number;
  };
}

async function fetchCoingeckoData(contractAddress: string): Promise<any> {
  console.log(`Fetching CoinGecko data for contract: ${contractAddress}`);
  
  try {
    // First try direct contract lookup
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/ethereum/contract/${contractAddress}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true`,
      { method: "GET" }
    );
    
    if (response.status === 200) {
      return await response.json();
    } else if (response.status === 404) {
      console.log("Contract not found in CoinGecko, trying search API");
      
      // If contract not found, try searching for it
      const searchResponse = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${contractAddress}`,
        { method: "GET" }
      );
      
      if (searchResponse.status === 200) {
        const searchData = await searchResponse.json();
        if (searchData.coins && searchData.coins.length > 0) {
          const topResult = searchData.coins[0];
          console.log(`Found match via search: ${topResult.id}`);
          
          // Fetch details for the top result
          const detailResponse = await fetch(
            `https://api.coingecko.com/api/v3/coins/${topResult.id}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true`,
            { method: "GET" }
          );
          
          if (detailResponse.status === 200) {
            return await detailResponse.json();
          }
        }
      }
      
      return null;
    } else {
      console.error(`CoinGecko API error: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching from CoinGecko:", error);
    return null;
  }
}

async function fetchGeckoTerminalData(contractAddress: string): Promise<any> {
  console.log(`Fetching GeckoTerminal data for contract: ${contractAddress}`);
  
  try {
    const response = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/eth/tokens/${contractAddress}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json;version=20230302",
        },
      }
    );
    
    if (response.status === 200) {
      return await response.json();
    } else {
      console.log(`GeckoTerminal API error: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching from GeckoTerminal:", error);
    return null;
  }
}

async function fetchTokenHistoricalTVL(contractAddress: string, days = 30): Promise<any> {
  try {
    const response = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/eth/tokens/${contractAddress}/pools/history?interval=day&limit=${days}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json;version=20230302",
        },
      }
    );
    
    if (response.status === 200) {
      const data = await response.json();
      return data?.data || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching historical TVL:", error);
    return [];
  }
}

function generateTVLSparkline(historicalData: any[]): { 
  data: number[]; 
  trend: 'up' | 'down'; 
  change: number;
} | undefined {
  if (!historicalData || historicalData.length < 2) {
    return undefined;
  }
  
  try {
    // Extract TVL values
    const tvlValues = historicalData.map(item => 
      parseFloat(item.attributes?.reserve_in_usd || "0")
    );
    
    // Calculate change
    const firstValue = tvlValues[0] || 0;
    const lastValue = tvlValues[tvlValues.length - 1] || 0;
    const absoluteChange = lastValue - firstValue;
    const percentChange = firstValue > 0 
      ? (absoluteChange / firstValue) * 100 
      : 0;
    
    return {
      data: tvlValues,
      trend: absoluteChange >= 0 ? 'up' : 'down',
      change: parseFloat(percentChange.toFixed(2))
    };
  } catch (error) {
    console.error("Error generating TVL sparkline:", error);
    return undefined;
  }
}

function calculateDataQuality(metrics: TokenCoreMetrics): "complete" | "partial" | "minimal" {
  // Count how many essential fields are populated
  const essentialFields = [
    metrics.name,
    metrics.symbol,
    metrics.price,
    metrics.marketCap,
    metrics.volume24h,
    metrics.supply,
    metrics.liquidityUSD,
    metrics.dexVolume24h
  ];
  
  const populatedCount = essentialFields.filter(field => field !== null && field !== undefined).length;
  const totalFields = essentialFields.length;
  
  const percentComplete = (populatedCount / totalFields) * 100;
  
  if (percentComplete >= 75) {
    return "complete";
  } else if (percentComplete >= 40) {
    return "partial";
  } else {
    return "minimal";
  }
}

async function processTokenMetrics(contractAddress: string): Promise<TokenCoreMetrics | null> {
  // Normalize contract address
  const normalizedAddress = normalizeAddress(contractAddress);
  
  // Check cache first
  const { data: cachedData, error: cacheError } = await supabase
    .from("token_data_cache")
    .select("*")
    .eq("token_id", normalizedAddress)
    .single();
  
  // If we have fresh cache (less than 15 minutes old), return it
  if (cachedData && !cacheError) {
    const cacheAge = Date.now() - new Date(cachedData.last_updated).getTime();
    const cacheMaxAge = 15 * 60 * 1000; // 15 minutes in ms
    
    if (cacheAge < cacheMaxAge) {
      console.log("Returning cached data");
      return cachedData.data as TokenCoreMetrics;
    }
  }
  
  // Fetch fresh data
  console.log("Fetching fresh data");
  const [coingeckoData, geckoTerminalData] = await Promise.all([
    fetchCoingeckoData(normalizedAddress),
    fetchGeckoTerminalData(normalizedAddress)
  ]);
  
  // If we couldn't get any data, return null
  if (!coingeckoData && !geckoTerminalData) {
    console.log("No data found from any source");
    return null;
  }
  
  // Track our data sources
  const dataSources: string[] = [];
  if (coingeckoData) dataSources.push("coingecko");
  if (geckoTerminalData) dataSources.push("geckoterminal");
  
  // Build our metrics object from CoinGecko data
  const metrics: TokenCoreMetrics = {
    name: coingeckoData?.name || "Unknown Token",
    symbol: coingeckoData?.symbol?.toUpperCase() || "???",
    price: coingeckoData?.market_data?.current_price?.usd || null,
    marketCap: coingeckoData?.market_data?.market_cap?.usd || null,
    volume24h: coingeckoData?.market_data?.total_volume?.usd || null,
    supply: coingeckoData?.market_data?.circulating_supply || null,
    contractAddress: normalizedAddress,
    dexVolume24h: null,
    liquidityUSD: null,
    dataQuality: "minimal",
    dataSources,
    scannedAt: new Date().toISOString(),
  };
  
  // Add community data if available
  if (coingeckoData?.community_data) {
    metrics.communityData = {
      twitterFollowers: coingeckoData.community_data.twitter_followers || undefined,
      telegramUsers: coingeckoData.community_data.telegram_channel_user_count || undefined,
      redditSubscribers: coingeckoData.community_data.reddit_subscribers || undefined
    };
  }
  
  // Add developer data if available
  if (coingeckoData?.developer_data) {
    metrics.developerData = {
      forks: coingeckoData.developer_data.forks || undefined,
      stars: coingeckoData.developer_data.stars || undefined,
      commitCount: coingeckoData.developer_data.commit_count_4_weeks || undefined
    };
  }
  
  // Add GeckoTerminal data if available
  if (geckoTerminalData?.data) {
    const tokenData = geckoTerminalData.data;
    
    // Add liquidity data
    metrics.liquidityUSD = 
      parseFloat(tokenData.attributes?.total_reserve_in_usd) || null;
      
    // Add DEX volume
    metrics.dexVolume24h = 
      parseFloat(tokenData.attributes?.volume_usd?.h24) || null;
    
    // Fetch and add TVL sparkline data
    const historicalTVL = await fetchTokenHistoricalTVL(normalizedAddress);
    if (historicalTVL.length > 0) {
      metrics.tvlSparkline = generateTVLSparkline(historicalTVL);
    }
  }
  
  // Calculate data quality
  metrics.dataQuality = calculateDataQuality(metrics);
  
  // Save to cache
  await supabase
    .from("token_data_cache")
    .upsert({
      token_id: normalizedAddress,
      data: metrics,
      last_updated: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hour expiry
    });
  
  return metrics;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  
  try {
    // Parse the request payload
    const { contractAddress } = await req.json();
    
    // Validate input
    if (!contractAddress) {
      return new Response(
        JSON.stringify({ error: "Contract address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate Ethereum address format
    if (!isValidEthereumAddress(contractAddress)) {
      return new Response(
        JSON.stringify({ error: "Invalid Ethereum address format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Process and return metrics
    const metrics = await processTokenMetrics(contractAddress);
    
    if (!metrics) {
      return new Response(
        JSON.stringify({ error: "Could not retrieve token metrics" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Return success response
    return new Response(
      JSON.stringify(metrics),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
