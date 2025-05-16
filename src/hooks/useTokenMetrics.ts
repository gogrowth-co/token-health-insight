
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TokenInfo } from './useTokenInfo';
import { toast } from '@/components/ui/use-toast';

export interface TokenMetrics {
  marketCap: string;
  marketCapValue: number;
  marketCapChange24h: number;
  currentPrice: number;
  priceChange24h: number;
  liquidityLock: string;
  liquidityLockDays: number;
  topHoldersPercentage: string;
  topHoldersValue: number;
  topHoldersTrend: 'up' | 'down' | null;
  tvl: string;
  tvlValue: number;
  tvlChange24h: number;
  auditStatus: string;
  socialFollowers: string;
  socialFollowersCount: number;
  socialFollowersChange: number;
}

export const useTokenMetrics = (
  tokenIdentifier?: string | null,
  tokenInfo?: TokenInfo | null,
  refreshTrigger: number = 0
) => {
  const normalizedToken = tokenIdentifier?.replace(/^\$/, '').toLowerCase() || '';
  
  return useQuery({
    queryKey: ['tokenMetrics', normalizedToken, refreshTrigger],
    queryFn: async (): Promise<TokenMetrics> => {
      if (!normalizedToken) {
        throw new Error('Token identifier is required');
      }

      console.log(`Fetching token metrics for ${normalizedToken} (refresh: ${refreshTrigger})`);
      
      try {
        // First attempt with a short timeout
        const { data, error } = await supabase.functions.invoke('get-token-metrics', {
          body: { 
            token: normalizedToken,
            address: tokenInfo?.contract_address || '',
            twitter: tokenInfo?.links?.twitter_screen_name || ''
          }
        });

        if (error) {
          console.error('Error fetching token metrics:', error);
          throw new Error(`Failed to fetch token metrics: ${error.message}`);
        }

        if (data.error) {
          console.error('API error fetching token metrics:', data.error);
          throw new Error(data.error);
        }

        console.log(`Successfully fetched metrics for ${normalizedToken}:`, data);
        return data.metrics as TokenMetrics;
      } catch (error) {
        console.error('Exception fetching token metrics:', error);
        
        // Show more helpful error message
        if (error.message?.includes('Failed to fetch')) {
          toast({
            title: "Connection error",
            description: "Unable to connect to our servers. Please check your internet connection.",
            variant: "destructive",
          });
        }
        
        throw error;
      }
    },
    enabled: !!normalizedToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2, // Retry failed requests up to 2 times
  });
};
