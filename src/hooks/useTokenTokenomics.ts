
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

export interface TokenTokenomicsData {
  buyTax: number;
  sellTax: number;
  isMintable: boolean;
  holdersCount: number;
  topHolderPct: number | null;
  top5HoldersPct: number | null;
  totalSupply: number | null;
  name?: string;
  symbol?: string;
  scannedAt: string;
}

/**
 * Fetches tokenomics data for the given contract address
 */
export function useTokenTokenomics(contractAddress: string | null) {
  return useQuery({
    queryKey: ['tokenomics', contractAddress],
    queryFn: async (): Promise<TokenTokenomicsData | null> => {
      if (!contractAddress) return null;
      
      try {
        console.log('Fetching tokenomics data for', contractAddress);
        
        const { data, error } = await supabase.functions.invoke('fetch-token-tokenomics', {
          body: { contractAddress }
        });
        
        if (error) {
          console.error('Error fetching tokenomics data:', error);
          throw error;
        }
        
        return data?.data || null;
      } catch (error) {
        console.error('Failed to fetch tokenomics data:', error);
        throw error;
      }
    },
    enabled: !!contractAddress,
    staleTime: 1000 * 60 * 15, // 15 minutes
    retry: 2,
  });
}

/**
 * Formats the tokenomics data for display
 */
export function formatTokenomicsData(data: TokenTokenomicsData | null) {
  if (!data) return null;
  
  return {
    buyTax: `${data.buyTax}%`,
    sellTax: `${data.sellTax}%`,
    isMintable: data.isMintable ? 'Yes' : 'No',
    holdersCount: data.holdersCount.toLocaleString(),
    topHolderPct: data.topHolderPct !== null ? `${data.topHolderPct.toFixed(2)}%` : 'Unknown',
    top5HoldersPct: data.top5HoldersPct !== null ? `${data.top5HoldersPct.toFixed(2)}%` : 'Unknown',
    totalSupply: data.totalSupply !== null 
      ? data.totalSupply > 1000000 
        ? `${(data.totalSupply / 1000000).toFixed(2)}M` 
        : data.totalSupply.toLocaleString()
      : 'Unknown',
  };
}
