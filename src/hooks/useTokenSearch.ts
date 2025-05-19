
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TokenSearchResult {
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

export const useTokenSearch = (query?: string | null) => {
  const normalizedQuery = query?.trim() || '';

  return useQuery({
    queryKey: ['tokenSearch', normalizedQuery],
    queryFn: async (): Promise<TokenSearchResult[]> => {
      if (!normalizedQuery) {
        return [];
      }

      try {
        console.log(`Searching for token: ${normalizedQuery}`);
        const { data, error } = await supabase.functions.invoke('search-tokens', {
          body: { query: normalizedQuery }
        });

        if (error) {
          console.error('Error searching tokens:', error);
          throw new Error(`Failed to search tokens: ${error.message}`);
        }

        if (!data || !Array.isArray(data.results)) {
          return [];
        }

        return data.results as TokenSearchResult[];
      } catch (error) {
        console.error('Exception searching tokens:', error);
        throw error;
      }
    },
    enabled: !!normalizedQuery,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
