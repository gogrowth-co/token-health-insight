
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TokenInfo {
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
  blockchain?: string; // Stores the primary blockchain (ETH, BSC, etc.)
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
  twitter?: string; // Add twitter property to fix the error
}

export const useTokenInfo = (tokenIdentifier?: string | null, forceRefresh: boolean = false) => {
  // Basic client-side normalization that mirrors the edge function logic
  const normalizedToken = tokenIdentifier?.trim() || '';
  
  console.log(`[useTokenInfo] Fetching info for token: ${normalizedToken}, forceRefresh: ${forceRefresh}`);

  return useQuery({
    queryKey: ['tokenInfo', normalizedToken, forceRefresh],
    queryFn: async (): Promise<TokenInfo> => {
      if (!normalizedToken) {
        throw new Error('Token identifier is required');
      }

      console.log(`[useTokenInfo] Checking cache for token: ${normalizedToken}`);

      // First, try to get data from token_data_cache table
      const { data: cacheData, error: cacheError } = await supabase
        .from('token_data_cache')
        .select('*')
        .or(`token_name.eq.${normalizedToken},token_symbol.ilike.${normalizedToken},coingecko_id.eq.${normalizedToken},token_address.eq.${normalizedToken}`)
        .maybeSingle();

      // If data exists in cache and we're not forcing a refresh, use it
      if (!forceRefresh && cacheData && !cacheError) {
        console.log(`[useTokenInfo] Found data in token_data_cache for: ${normalizedToken}`);
        
        return {
          id: cacheData.coingecko_id || normalizedToken,
          name: cacheData.token_name || 'Unknown Token',
          symbol: cacheData.token_symbol?.toUpperCase() || "--",
          image: cacheData.logo_url,
          description: cacheData.description,
          blockchain: cacheData.chain || "ethereum",
          genesis_date: cacheData.launch_date,
          contract_address: cacheData.token_address,
          links: {
            homepage: cacheData.website_url ? [cacheData.website_url] : [],
            twitter_screen_name: cacheData.twitter_handle,
            github: cacheData.github_url
          },
          twitter: cacheData.twitter_handle
        };
      }

      try {
        const { data, error } = await supabase.functions.invoke('get-token-info', {
          body: { 
            token: normalizedToken, 
            forceRefresh: forceRefresh
          }
        });

        if (error) {
          console.error('[useTokenInfo] Error fetching token info:', error);
          throw new Error(`Failed to fetch token info: ${error.message}`);
        }

        if (!data) {
          console.error('[useTokenInfo] No data returned from token info endpoint');
          throw new Error('No data returned from token info endpoint');
        }
        
        console.log(`[useTokenInfo] Received data for token: ${data.id || normalizedToken}, name: ${data.name || 'N/A'}`);
        console.log('[useTokenInfo] Contract address:', data.contract_address || 'Not available');
        console.log('[useTokenInfo] Blockchain:', data.blockchain || 'Not specified');
        console.log('[useTokenInfo] Launch date:', data.genesis_date || 'Not available');

        // Cache the token data if we have essential information
        if (data.id && data.name && data.contract_address) {
          console.log('[useTokenInfo] Caching token data in token_data_cache');
          try {
            await supabase.from('token_data_cache').upsert({
              coingecko_id: data.id,
              token_name: data.name,
              token_symbol: data.symbol,
              token_address: data.contract_address,
              chain: data.blockchain || 'ethereum',
              description: data.description,
              website_url: data.links?.homepage?.[0],
              twitter_handle: data.links?.twitter_screen_name || data.twitter,
              github_url: data.links?.github,
              launch_date: data.genesis_date,
              logo_url: data.image
            }, {
              onConflict: 'token_address'
            });
          } catch (cacheError) {
            console.error('[useTokenInfo] Error caching token data:', cacheError);
            // Non-blocking, we'll still return the data
          }
        }
        
        // Ensure we have default values for critical fields
        const tokenInfo: TokenInfo = {
          id: data.id || normalizedToken,
          name: data.name || 'Unknown Token',
          symbol: data.symbol || "--",
          description: data.description || `${data.name || 'This token'} is a cryptocurrency token${data.symbol ? ` with symbol ${data.symbol.toUpperCase()}` : ''}.`,
          blockchain: data.blockchain || "", // Store blockchain info if available
          genesis_date: data.genesis_date || undefined, // Store launch date
          contract_address: data.contract_address || undefined,
          links: {
            homepage: Array.isArray(data.links?.homepage) ? data.links.homepage : data.links?.homepage ? [data.links.homepage] : [],
            twitter_screen_name: data.links?.twitter_screen_name || undefined,
            github: data.links?.github || undefined,
            repos_url: data.links?.repos_url || undefined
          },
          twitter: data.links?.twitter_screen_name || data.twitter,
          // Pass through all other data
          ...data
        };
        
        return tokenInfo;
      } catch (error) {
        console.error('[useTokenInfo] Exception fetching token info:', error);
        throw error;
      }
    },
    enabled: !!normalizedToken,
    staleTime: forceRefresh ? 0 : 60 * 1000, // 0 if force refresh, otherwise 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes - renamed from cacheTime to gcTime in React Query v5
    retry: 2, // Retry up to 2 times on failure
  });
};
