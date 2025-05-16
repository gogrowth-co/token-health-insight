
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
    const url = new URL(req.url);
    let token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token parameter is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Normalize token input: remove $ prefix, convert to lowercase
    token = token.replace(/^\$/, '').toLowerCase();

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

    // Step 1: Get CoinGecko ID from symbol
    const coinListResponse = await fetch('https://api.coingecko.com/api/v3/coins/list');
    
    if (!coinListResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch coin list from CoinGecko' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }
    
    const coinList: CoinGeckoListItem[] = await coinListResponse.json();
    const matchedCoins = coinList.filter(coin => coin.symbol.toLowerCase() === token);
    
    if (matchedCoins.length === 0) {
      return new Response(
        JSON.stringify({ error: `Token not found: ${token}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Usually use the first match, but if we find an exact match by id, prefer that
    let coinId = matchedCoins[0].id;
    const exactMatch = matchedCoins.find(coin => coin.id.toLowerCase() === token);
    if (exactMatch) {
      coinId = exactMatch.id;
    }

    // Step 2: Get detailed market data for the coin
    const marketDataUrl = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`;
    const marketResponse = await fetch(marketDataUrl);
    
    if (!marketResponse.ok) {
      // Fallback to simpler endpoint if detailed data fails
      const simplePriceUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`;
      const simplePriceResponse = await fetch(simplePriceUrl);
      
      if (!simplePriceResponse.ok) {
        return new Response(
          JSON.stringify({ error: `Failed to fetch data for token: ${token}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
        );
      }

      const simplePriceData = await simplePriceResponse.json();
      const tokenData = {
        id: coinId,
        symbol: token,
        name: matchedCoins[0].name,
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
          token_id: token,
          data: tokenData,
          expires_at: expiresAt,
          last_updated: new Date().toISOString()
        })
        .eq('token_id', token);

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
        token_id: token,
        data: tokenData,
        expires_at: expiresAt,
        last_updated: new Date().toISOString()
      })
      .eq('token_id', token);
    
    // Store token scan record
    try {
      await supabase
        .from('token_scans')
        .insert({
          token_id: token,
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
    console.error("Error processing request:", error.message);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
