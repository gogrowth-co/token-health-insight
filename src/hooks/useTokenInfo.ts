
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
}

export const useTokenInfo = (tokenIdentifier?: string | null, forceRefresh: boolean = false) => {
  // Basic client-side normalization that mirrors the edge function logic
  // We want to keep this minimal and let the edge function handle the full resolution
  const normalizedToken = tokenIdentifier?.trim() || '';
  
  console.log(`[useTokenInfo] Fetching info for token: ${normalizedToken}, forceRefresh: ${forceRefresh}`);

  return useQuery({
    queryKey: ['tokenInfo', normalizedToken, forceRefresh], // Add forceRefresh to the query key
    queryFn: async (): Promise<TokenInfo> => {
      if (!normalizedToken) {
        throw new Error('Token identifier is required');
      }

      console.log(`[useTokenInfo] Calling edge function for token: ${normalizedToken}`);

      try {
        const { data, error } = await supabase.functions.invoke('get-token-info', {
          body: { token: normalizedToken, forceRefresh: forceRefresh } // Pass forceRefresh to edge function
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
        
        // Log social links for debugging
        if (data.links) {
          console.log('[useTokenInfo] Social links:', {
            homepage: data.links.homepage,
            twitter: data.links.twitter_screen_name,
            github: data.links.github
          });
        } else {
          console.log('[useTokenInfo] No social links in API response');
        }

        // Log description
        console.log('[useTokenInfo] Description available:', !!data.description);
        if (data.description) {
          console.log('[useTokenInfo] Description preview:', data.description.substring(0, 100) + '...');
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
