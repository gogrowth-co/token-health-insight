import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from "../_shared/cors.ts";

interface CoinGeckoListItem {
  id: string;
  symbol: string;
  name: string;
}

interface TokenData {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  description?: string;
  market_cap?: number;
  market_cap_rank?: number;
  current_price?: number;
  price_change_24h?: number;
  price_change_percentage_24h?: number;
  high_24h?: number;
  low_24h?: number;
  total_volume?: number;
  circulating_supply?: number;
  total_supply?: number;
  max_supply?: number;
  ath?: number;
  ath_change_percentage?: number;
  ath_date?: string;
  atl?: number;
  atl_change_percentage?: number;
  atl_date?: string;
  genesis_date?: string; // Launch date of the token
  last_updated?: string;
  links?: {
    homepage?: string[];
    twitter_screen_name?: string;
    github?: string;
    repos_url?: {
      github?: string[];
    };
  };
  contract_address?: string;
  sparkline_7d?: {
    price: number[];
  };
  platforms?: Record<string, string>; // Maps blockchain networks to contract addresses
  blockchain?: string; // Added to store primary blockchain
}

// Known major tokens by symbol - used to prioritize search results
const MAJOR_TOKENS = {
  "btc": "bitcoin",
  "eth": "ethereum",
  "usdt": "tether",
  "bnb": "binancecoin",
  "xrp": "ripple",
  "usdc": "usd-coin",
  "sol": "solana",
  "ada": "cardano",
  "doge": "dogecoin",
  "trx": "tron",
  "dot": "polkadot",
  "matic": "matic-network",
  "avax": "avalanche-2",
  "link": "chainlink",
  "shib": "shiba-inu",
  "ltc": "litecoin",
  "ethereum": "ethereum", // Add full names for common tokens
  "bitcoin": "bitcoin"
};

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get token from URL params or request body
    let token;
    let forceRefresh = false;
    
    // Check if it's a GET request with URL params
    const url = new URL(req.url);
    token = url.searchParams.get('token');
    forceRefresh = url.searchParams.get('forceRefresh') === 'true';
    
    // If not found in URL params and it's a POST request, check the request body
    if ((!token || forceRefresh === false) && req.method === 'POST') {
      try {
        const bodyText = await req.text();
        if (bodyText) {
          const body = JSON.parse(bodyText);
          token = body.token || token;
          forceRefresh = body.forceRefresh || forceRefresh;
          console.log("Found token in request body:", token);
          console.log("Force refresh flag:", forceRefresh);
        }
      } catch (e) {
        console.error("Error parsing request body:", e);
      }
    }

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token parameter is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Normalize token input: remove $ prefix, convert to lowercase
    token = token.replace(/^\$/, '').toLowerCase().trim();
    console.log(`Processing normalized token: ${token}, forceRefresh: ${forceRefresh}`);

    // Check if we have cached token data that's not too old (7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Only use cache if not forcing refresh
    if (!forceRefresh) {
      const { data: cachedData, error: cacheError } = await supabase
        .from('token_data_cache')
        .select('*')
        .eq('token_id', token)
        .single();

      // If we have valid cached data that's not expired AND not older than 7 days, return it
      if (
        cachedData && 
        !cacheError && 
        new Date(cachedData.expires_at) > new Date() && 
        new Date(cachedData.last_updated) > sevenDaysAgo
      ) {
        console.log(`Cache hit for token: ${token} (not older than 7 days)`);
        
        // Ensure all required fields have fallbacks before returning
        const data = ensureRequiredFields(cachedData.data);
        
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log(`Force refresh requested for token: ${token}, bypassing cache`);
    }

    console.log(`${forceRefresh ? 'Force refresh' : 'Cache miss or stale data (>7 days)'} for token: ${token}, fetching from CoinGecko`);

    // Check if this is a known major token
    const knownTokenId = MAJOR_TOKENS[token];
    if (knownTokenId) {
      console.log(`Found as major token: ${token} -> ${knownTokenId}`);
      return await fetchAndCacheTokenData(knownTokenId, token);
    }

    // Step 1: Get CoinGecko ID from symbol
    const coinListResponse = await fetch('https://api.coingecko.com/api/v3/coins/list');
    
    if (!coinListResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch coin list from CoinGecko' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }
    
    const coinList: CoinGeckoListItem[] = await coinListResponse.json();
    
    // Find matches by symbol (case insensitive) or exact id match
    const symbolMatches = coinList.filter(coin => 
      coin.symbol.toLowerCase() === token || coin.id.toLowerCase() === token
    );
    
    // If no exact symbol matches, try to search by name or ID
    if (symbolMatches.length === 0) {
      console.log(`No exact symbol/id matches for: ${token}, trying search API`);
      return await trySearchFallback(token);
    }

    console.log(`Found ${symbolMatches.length} matching symbols for: ${token}`);
    
    // First check if any of the matches has a name or id that contains the token
    // This helps when the token is actually the name of the cryptocurrency (e.g., "bitcoin")
    const nameOrIdMatch = symbolMatches.find(
      coin => coin.id.toLowerCase() === token || 
              coin.id.toLowerCase().includes(token) || 
              coin.name.toLowerCase() === token
    );
    
    if (nameOrIdMatch) {
      console.log(`Found name/id match: ${nameOrIdMatch.id}`);
      return await fetchAndCacheTokenData(nameOrIdMatch.id, token);
    }
    
    // Sort matches by coinId length (shorter is often better/original)
    // and prioritize those with market data
    const sortedMatches = [...symbolMatches].sort((a, b) => a.id.length - b.id.length);
    
    // Use the first match by default
    const coinId = sortedMatches[0].id;
    console.log(`Using first sorted match: ${coinId}`);
    
    return await fetchAndCacheTokenData(coinId, token);

  } catch (error) {
    console.error("Error processing request:", error.message);
    
    // Create a basic response with required fields when there's an error
    const fallbackResponse: TokenData = {
      id: "",
      symbol: "",
      name: "Unknown Token",
      description: "Token information unavailable. Please try again later."
    };
    
    return new Response(
      JSON.stringify(fallbackResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Ensure all required fields have fallbacks
function ensureRequiredFields(data: TokenData): TokenData {
  if (!data) return createFallbackToken();
  
  // Make sure all critical fields have proper defaults
  const processedData = {
    ...data,
    name: data.name || "Unknown Token",
    symbol: data.symbol || "--",
    description: data.description || `${data.name || "Unknown token"} is a cryptocurrency token ${data.symbol ? `with symbol ${data.symbol.toUpperCase()}` : ''}`,
    links: data.links || {}
  };
  
  // Make sure links structure exists and all key properties have fallbacks
  processedData.links = {
    homepage: Array.isArray(data.links?.homepage) ? data.links.homepage : data.links?.homepage ? [data.links.homepage] : [],
    twitter_screen_name: data.links?.twitter_screen_name || "",
    github: data.links?.github || "",
    repos_url: data.links?.repos_url || {}
  };
  
  return processedData;
}

// Create a fallback token with all required fields
function createFallbackToken(): TokenData {
  return {
    id: "",
    symbol: "--",
    name: "Unknown Token",
    description: "Token information unavailable. Please try again later.",
    links: {
      homepage: [],
      twitter_screen_name: "",
      github: "",
      repos_url: {}
    }
  };
}

// Get primary blockchain from contract addresses
function getPrimaryBlockchain(platforms: Record<string, string> | undefined, contractAddress?: string): string {
  if (!platforms || Object.keys(platforms).length === 0) {
    return "";
  }
  
  // Prioritize known chains
  const priorityChains = ["ethereum", "binance_smart_chain", "polygon_pos", "solana", "avalanche"];
  
  for (const chain of priorityChains) {
    if (platforms[chain] && (!contractAddress || platforms[chain] === contractAddress)) {
      return chain.split('_')[0].toUpperCase().substring(0, 3);
    }
  }
  
  // If no priority chain found, return the first one
  const firstChain = Object.keys(platforms)[0];
  return firstChain.substring(0, 3).toUpperCase();
}

// Fallback to search API if we don't find an exact match
async function trySearchFallback(token: string): Promise<Response> {
  try {
    // Use the CoinGecko search API
    const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(token)}`;
    console.log(`Trying search API: ${searchUrl}`);
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      console.error("Search API failed:", searchResponse.status);
      return new Response(
        JSON.stringify(ensureRequiredFields({ id: token, name: "Unknown Token", symbol: token })),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }
    
    const searchResults = await searchResponse.json();
    
    // Check if we found any coins
    if (searchResults.coins && searchResults.coins.length > 0) {
      // Sort by market cap rank (if available)
      const sortedResults = searchResults.coins.sort((a: any, b: any) => {
        const rankA = a.market_cap_rank || Number.MAX_SAFE_INTEGER;
        const rankB = b.market_cap_rank || Number.MAX_SAFE_INTEGER;
        return rankA - rankB;
      });
      
      console.log(`Search found ${sortedResults.length} results, using top result: ${sortedResults[0].id}`);
      return await fetchAndCacheTokenData(sortedResults[0].id, token);
    }
    
    // If no coins found, return a graceful fallback
    console.log(`No search results found for token: ${token}`);
    return new Response(
      JSON.stringify(ensureRequiredFields({ id: token, name: "Unknown Token", symbol: token })),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    );
  } catch (error) {
    console.error("Error in search fallback:", error);
    
    // Return a graceful fallback with all required fields
    return new Response(
      JSON.stringify(createFallbackToken()),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

// Fetch and cache token data
async function fetchAndCacheTokenData(coinId: string, originalToken: string): Promise<Response> {
  try {
    // Step 2: Get detailed market data for the coin
    const marketDataUrl = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`;
    console.log(`Fetching market data: ${marketDataUrl}`);
    
    const marketResponse = await fetch(marketDataUrl);
    
    if (!marketResponse.ok) {
      console.error("Market data fetch failed:", marketResponse.status);
      
      // Fallback to simpler endpoint if detailed data fails
      const simplePriceUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`;
      const simplePriceResponse = await fetch(simplePriceUrl);
      
      if (!simplePriceResponse.ok) {
        console.log(`Simple price API also failed for token: ${originalToken}`);
        return new Response(
          JSON.stringify(ensureRequiredFields({ 
            id: coinId, 
            symbol: originalToken,
            name: coinId.charAt(0).toUpperCase() + coinId.slice(1).replace(/-/g, ' ')
          })),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
        );
      }

      const simplePriceData = await simplePriceResponse.json();
      console.log(`Simple price data for ${coinId}:`, simplePriceData[coinId]);
      
      const coinName = coinId.charAt(0).toUpperCase() + coinId.slice(1).replace(/-/g, ' ');
      const symbol = originalToken.toUpperCase();
      
      const tokenData = {
        id: coinId,
        symbol: originalToken,
        name: coinName,
        description: `${coinName} is a cryptocurrency token with symbol ${symbol}.`,
        current_price: simplePriceData[coinId]?.usd,
        market_cap: simplePriceData[coinId]?.usd_market_cap,
        price_change_percentage_24h: simplePriceData[coinId]?.usd_24h_change,
        last_updated: new Date(simplePriceData[coinId]?.last_updated_at * 1000).toISOString(),
        links: {
          homepage: [],
          twitter_screen_name: "",
          github: "",
          repos_url: {}
        }
      };

      // Cache the data for 1 minute but mark it for refresh (7 day expiry)
      const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();
      await supabase
        .from('token_data_cache')
        .upsert({
          token_id: originalToken,
          data: tokenData,
          expires_at: expiresAt,
          last_updated: new Date().toISOString()
        })
        .eq('token_id', originalToken);

      return new Response(
        JSON.stringify(ensureRequiredFields(tokenData)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process and transform the full market data
    const fullData = await marketResponse.json();
    const tokenName = fullData.name || coinId.charAt(0).toUpperCase() + coinId.slice(1).replace(/-/g, ' ');
    const tokenSymbol = fullData.symbol || originalToken;
    
    // Create a default description if none exists
    const tokenDescription = fullData.description?.en || `${tokenName} is a cryptocurrency token with symbol ${tokenSymbol?.toUpperCase() || ''}.`;
    
    // Extract primary contract address
    // For Ethereum tokens, prioritize the Ethereum contract address
    let contractAddress = fullData.contract_address || "";
    let blockchain = "";
    
    // If platforms data exists, try to extract addresses from there
    if (fullData.platforms && Object.keys(fullData.platforms).length > 0) {
      console.log("Found platforms data:", fullData.platforms);
      
      // Get the primary blockchain
      blockchain = getPrimaryBlockchain(fullData.platforms, contractAddress);
      
      // Prioritize Ethereum address if available
      if (fullData.platforms.ethereum) {
        contractAddress = fullData.platforms.ethereum;
      } 
      // Otherwise use the first available address
      else {
        const firstPlatform = Object.keys(fullData.platforms)[0];
        if (fullData.platforms[firstPlatform]) {
          contractAddress = fullData.platforms[firstPlatform];
        }
      }
    }
    
    // Clean up GitHub URL to get just the organization/repo part if it's a full URL
    let githubUrl = fullData.links?.repos_url?.github?.[0] || "";
    if (githubUrl && githubUrl.includes('github.com')) {
      try {
        const url = new URL(githubUrl);
        githubUrl = url.pathname.replace(/^\//, ''); // Remove leading slash
      } catch (e) {
        // Keep original if it's not a valid URL
      }
    }
    
    // Ensure we properly extract social links
    console.log('Homepage URL(s):', fullData.links?.homepage);
    console.log('Twitter handle:', fullData.links?.twitter_screen_name);
    console.log('GitHub URL:', githubUrl);
    
    const tokenData: TokenData = {
      id: fullData.id,
      symbol: tokenSymbol,
      name: tokenName,
      image: fullData.image?.large || fullData.image?.small || fullData.image?.thumb,
      description: tokenDescription,
      market_cap: fullData.market_data?.market_cap?.usd,
      market_cap_rank: fullData.market_cap_rank,
      current_price: fullData.market_data?.current_price?.usd,
      price_change_24h: fullData.market_data?.price_change_24h,
      price_change_percentage_24h: fullData.market_data?.price_change_percentage_24h,
      high_24h: fullData.market_data?.high_24h?.usd,
      low_24h: fullData.market_data?.low_24h?.usd,
      total_volume: fullData.market_data?.total_volume?.usd,
      circulating_supply: fullData.market_data?.circulating_supply,
      total_supply: fullData.market_data?.total_supply,
      max_supply: fullData.market_data?.max_supply,
      last_updated: fullData.last_updated,
      genesis_date: fullData.genesis_date, // Launch date
      ath: fullData.market_data?.ath?.usd,
      ath_change_percentage: fullData.market_data?.ath_change_percentage?.usd,
      ath_date: fullData.market_data?.ath_date?.usd,
      atl: fullData.market_data?.atl?.usd,
      atl_change_percentage: fullData.market_data?.atl_change_percentage?.usd,
      atl_date: fullData.market_data?.atl_date?.usd,
      sparkline_7d: fullData.market_data?.sparkline_7d,
      links: {
        homepage: Array.isArray(fullData.links?.homepage) ? fullData.links?.homepage : fullData.links?.homepage ? [fullData.links.homepage] : [],
        twitter_screen_name: fullData.links?.twitter_screen_name || "",
        github: githubUrl || "",
        repos_url: fullData.links?.repos_url || {}
      },
      contract_address: contractAddress,
      platforms: fullData.platforms || {},
      blockchain: blockchain
    };

    console.log(`Successfully fetched full data for ${coinId} (${tokenName})`);
    console.log(`Contract address: ${contractAddress}`);
    console.log(`Blockchain: ${blockchain}`);
    console.log(`Launch date: ${fullData.genesis_date || 'Not available'}`);
    console.log(`Description available: ${!!tokenData.description}`);
    console.log(`Social links: Homepage=${tokenData.links?.homepage?.[0] || 'none'}, Twitter=${tokenData.links?.twitter_screen_name || 'none'}, GitHub=${tokenData.links?.github || 'none'}`);
    
    // Cache the data for 1 minute (but mark it as fresh for 7 days)
    const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();
    await supabase
      .from('token_data_cache')
      .upsert({
        token_id: originalToken,
        data: tokenData,
        expires_at: expiresAt,
        last_updated: new Date().toISOString()
      })
      .eq('token_id', originalToken);
    
    // Store token scan record
    try {
      await supabase
        .from('token_scans')
        .insert({
          token_id: originalToken,
          token_symbol: tokenData.symbol,
          token_name: tokenData.name,
          token_address: tokenData.contract_address || null,
          health_score: null, // This would be calculated based on full scan
          category_scores: null,
          metadata: {
            blockchain: blockchain,
            genesis_date: tokenData.genesis_date,
            website: tokenData.links?.homepage?.[0] || null,
            twitter: tokenData.links?.twitter_screen_name || null,
            github: tokenData.links?.github || null,
            image: tokenData.image || null,
            description: tokenData.description || null, // Store the description in metadata as well
          }
        });
    } catch (error) {
      console.error("Error storing token scan:", error);
      // Continue even if this fails, as it's not critical
    }

    return new Response(
      JSON.stringify(ensureRequiredFields(tokenData)),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error fetching token data:", error);
    
    // Return a graceful fallback response
    return new Response(
      JSON.stringify(createFallbackToken()),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}
