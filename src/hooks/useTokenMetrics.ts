
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TokenInfo } from './useTokenInfo';

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
  tokenInfo?: TokenInfo | null
) => {
  const normalizedToken = tokenIdentifier?.replace(/^\$/, '').toLowerCase() || '';
  
  return useQuery({
    queryKey: ['tokenMetrics', normalizedToken],
    queryFn: async (): Promise<TokenMetrics> => {
      if (!normalizedToken) {
        throw new Error('Token identifier is required');
      }

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

      return data.metrics as TokenMetrics;
    },
    enabled: !!normalizedToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};
