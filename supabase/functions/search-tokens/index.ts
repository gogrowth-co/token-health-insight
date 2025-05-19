
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from "../_shared/cors.ts";

interface CoinGeckoListItem {
  id: string;
  symbol: string;
  name: string;
}

interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

interface TokenSearchResult {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  market_cap?: number;
  market_cap_rank?: number;
  current_price?: number;
  total_volume?: number;
  contract_address?: string;
}

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const isEthereumAddress = (input: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(input);
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get query from request body
    const { query } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const normalizedQuery = query.trim().toLowerCase();
    console.log(`Processing token search query: ${normalizedQuery}`);

    // Check if we have cached search results
    const { data: cachedData, error: cacheError } = await supabase
      .from('token_search_cache')
      .select('*')
      .eq('query', normalizedQuery)
      .single();

    // If we have valid cached data that's not expired, return it
    if (cachedData && !cacheError && new Date(cachedData.expires_at) > new Date()) {
      console.log(`Cache hit for query: ${normalizedQuery}`);
      return new Response(
        JSON.stringify({ results: cachedData.results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Cache miss for query: ${normalizedQuery}, fetching from CoinGecko`);
    
    let results: TokenSearchResult[] = [];

    // If input is an Ethereum address, try direct contract lookup
    if (isEthereumAddress(normalizedQuery)) {
      console.log(`Detected Ethereum address: ${normalizedQuery}`);
      try {
        const contractResponse = await fetch(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${normalizedQuery}`);
        
        if (contractResponse.ok) {
          const contractData = await contractResponse.json();
          results.push({
            id: contractData.id,
            name: contractData.name,
            symbol: contractData.symbol.toUpperCase(),
            image: contractData.image?.small,
            market_cap: contractData.market_data?.market_cap?.usd,
            market_cap_rank: contractData.market_cap_rank,
            current_price: contractData.market_data?.current_price?.usd,
            total_volume: contractData.market_data?.total_volume?.usd,
            contract_address: normalizedQuery
          });
        } else {
          console.log(`Contract address not found in CoinGecko: ${normalizedQuery}`);
        }
      } catch (error) {
        console.error(`Error looking up contract address: ${error}`);
      }
    }

    // If we didn't find results by address (or it wasn't an address), try the search by name/symbol
    if (results.length === 0) {
      // First get the coin list
      const coinListResponse = await fetch('https://api.coingecko.com/api/v3/coins/list');
      
      if (!coinListResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch coin list from CoinGecko' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
        );
      }
      
      const coinList: CoinGeckoListItem[] = await coinListResponse.json();
      
      // Strip '$' from query if present for symbol comparison
      const queryForSymbol = normalizedQuery.startsWith('$') 
        ? normalizedQuery.substring(1) 
        : normalizedQuery;
      
      // Find matches by symbol or name
      const symbolMatches = coinList.filter(coin => 
        coin.symbol.toLowerCase() === queryForSymbol
      );
      
      const nameMatches = coinList.filter(coin => 
        coin.name.toLowerCase().includes(normalizedQuery)
      );
      
      // Combine unique matches (symbol matches first, then name matches)
      const combinedMatches = [...symbolMatches];
      
      // Add name matches only if they're not already in the combined list
      for (const nameCoin of nameMatches) {
        if (!combinedMatches.some(coin => coin.id === nameCoin.id)) {
          combinedMatches.push(nameCoin);
        }
      }
      
      // Take top matches (limit to 10 to avoid rate limiting)
      const topMatches = combinedMatches.slice(0, 10);
      
      if (topMatches.length > 0) {
        console.log(`Found ${topMatches.length} matching coins for: ${normalizedQuery}`);
        
        // Get market data for matching coins
        const coinIds = topMatches.map(coin => coin.id).join(',');
        const marketDataUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=100&page=1&sparkline=false`;
        
        try {
          const marketResponse = await fetch(marketDataUrl);
          
          if (marketResponse.ok) {
            const marketData: CoinGeckoMarketData[] = await marketResponse.json();
            
            // Map to our result format
            results = marketData.map(coin => ({
              id: coin.id,
              name: coin.name,
              symbol: coin.symbol.toUpperCase(),
              image: coin.image,
              market_cap: coin.market_cap,
              market_cap_rank: coin.market_cap_rank,
              current_price: coin.current_price,
              total_volume: coin.total_volume
            }));
            
            // Sort by market cap (highest first)
            results.sort((a, b) => {
              const marketCapA = a.market_cap || 0;
              const marketCapB = b.market_cap || 0;
              return marketCapB - marketCapA;
            });
            
            console.log(`Got market data for ${results.length} coins`);
          } else {
            console.error(`Failed to get market data: ${marketResponse.status}`);
            
            // Fallback: Return basic info without market data
            results = topMatches.map(coin => ({
              id: coin.id,
              name: coin.name,
              symbol: coin.symbol.toUpperCase()
            }));
          }
        } catch (error) {
          console.error(`Error fetching market data: ${error}`);
          
          // Fallback: Return basic info without market data
          results = topMatches.map(coin => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol.toUpperCase()
          }));
        }
      } else {
        console.log(`No matches found for: ${normalizedQuery}`);
      }
    }

    // Cache results for 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    try {
      await supabase
        .from('token_search_cache')
        .upsert({
          query: normalizedQuery,
          results: results,
          expires_at: expiresAt,
          last_updated: new Date().toISOString()
        })
        .eq('query', normalizedQuery);
    } catch (error) {
      console.error(`Error caching search results: ${error}`);
      // Continue even if caching fails
    }

    return new Response(
      JSON.stringify({ results }),
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
