
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
  image: string;
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
  last_updated?: string;
  links?: {
    homepage?: string[];
    twitter_screen_name?: string;
    github?: string;
  };
  contract_address?: string;
  sparkline_7d?: {
    price: number[];
  };
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
  "ltc": "litecoin"
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
    
    // Check if it's a GET request with URL params
    const url = new URL(req.url);
    token = url.searchParams.get('token');
    
    // If not found in URL params and it's a POST request, check the request body
    if (!token && req.method === 'POST') {
      try {
        const bodyText = await req.text();
        if (bodyText) {
          const body = JSON.parse(bodyText);
          token = body.token;
          console.log("Found token in request body:", token);
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
    token = token.replace(/^\$/, '').toLowerCase();
    console.log("Processing token:", token);

    // Check if we have cached token data
    const { data: cachedData, error: cacheError } = await supabase
      .from('token_data_cache')
      .select('*')
      .eq('token_id', token)
      .single();

    // If we have valid cached data that's not expired, return it
    if (cachedData && !cacheError && new Date(cachedData.expires_at) > new Date()) {
      console.log(`Cache hit for token: ${token}`);
      return new Response(
        JSON.stringify(cachedData.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Cache miss for token: ${token}, fetching from CoinGecko`);

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
    
    // Find matches by symbol (case insensitive)
    const symbolMatches = coinList.filter(coin => 
      coin.symbol.toLowerCase() === token
    );
    
    // If no exact symbol matches, try to search by name or ID
    if (symbolMatches.length === 0) {
      console.log(`No exact symbol matches for: ${token}, trying search API`);
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
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

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
        JSON.stringify({ error: 'Search API failed', status: searchResponse.status }),
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
    
    // If no coins found, return an error
    return new Response(
      JSON.stringify({ error: `Token not found: ${token}`, suggestions: searchResults.coins?.slice(0, 5) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    );
  } catch (error) {
    console.error("Error in search fallback:", error);
    return new Response(
      JSON.stringify({ error: 'Search fallback failed', details: error.message }),
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
        return new Response(
          JSON.stringify({ error: `Failed to fetch data for token: ${originalToken}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
        );
      }

      const simplePriceData = await simplePriceResponse.json();
      const tokenData = {
        id: coinId,
        symbol: originalToken,
        name: coinId,  // Not ideal, but it's what we have
        current_price: simplePriceData[coinId]?.usd,
        market_cap: simplePriceData[coinId]?.usd_market_cap,
        price_change_percentage_24h: simplePriceData[coinId]?.usd_24h_change,
        last_updated: new Date(simplePriceData[coinId]?.last_updated_at * 1000).toISOString()
      };

      // Cache the data for 1 minute
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
        JSON.stringify(tokenData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process and transform the full market data
    const fullData = await marketResponse.json();
    const tokenData: TokenData = {
      id: fullData.id,
      symbol: fullData.symbol,
      name: fullData.name,
      image: fullData.image?.large || fullData.image?.small || fullData.image?.thumb,
      description: fullData.description?.en,
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
      sparkline_7d: fullData.market_data?.sparkline_7d,
      links: {
        homepage: fullData.links?.homepage,
        twitter_screen_name: fullData.links?.twitter_screen_name,
        github: fullData.links?.repos_url?.github?.[0]
      },
      contract_address: fullData.contract_address
    };

    // Cache the data for 1 minute
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
          category_scores: null
        });
    } catch (error) {
      console.error("Error storing token scan:", error);
      // Continue even if this fails, as it's not critical
    }

    return new Response(
      JSON.stringify(tokenData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error fetching token data:", error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch and process token data', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}
