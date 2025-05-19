
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

export const useTokenInfo = (tokenIdentifier?: string | null) => {
  // Basic client-side normalization that mirrors the edge function logic
  // We want to keep this minimal and let the edge function handle the full resolution
  const normalizedToken = tokenIdentifier?.trim() || '';
  
  console.log(`[useTokenInfo] Fetching info for token: ${normalizedToken}`);

  return useQuery({
    queryKey: ['tokenInfo', normalizedToken],
    queryFn: async (): Promise<TokenInfo> => {
      if (!normalizedToken) {
        throw new Error('Token identifier is required');
      }

      console.log(`[useTokenInfo] Calling edge function for token: ${normalizedToken}`);

      try {
        const { data, error } = await supabase.functions.invoke('get-token-info', {
          body: { token: normalizedToken }
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
        
        // Ensure we have default values for critical fields
        const tokenInfo: TokenInfo = {
          id: data.id || normalizedToken,
          name: data.name || 'Unknown Token',
          symbol: data.symbol || "--",
          description: data.description || `${data.name || 'This token'} is a cryptocurrency token${data.symbol ? ` with symbol ${data.symbol.toUpperCase()}` : ''}.`,
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
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes - renamed from cacheTime to gcTime in React Query v5
    retry: 2, // Retry up to 2 times on failure
  });
};
