
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TokenInfo } from './useTokenInfo';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

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
  githubActivity?: string;
  githubCommits?: number;
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
        // Get contract address and Twitter handle from tokenInfo if available
        const contractAddress = tokenInfo?.contract_address || '';
        const twitterHandle = tokenInfo?.links?.twitter_screen_name || '';
        const githubRepo = tokenInfo?.links?.github || '';
        
        // Fetch metrics from our edge function
        const { data, error } = await supabase.functions.invoke('get-token-metrics', {
          body: { 
            token: normalizedToken,
            address: contractAddress,
            twitter: twitterHandle,
            github: githubRepo
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
        
        // If we have market cap from tokenInfo but not from metrics, use it
        if (tokenInfo?.market_cap && (!data.metrics.marketCapValue || data.metrics.marketCapValue === 0)) {
          data.metrics.marketCapValue = tokenInfo.market_cap;
          data.metrics.marketCap = formatCurrency(tokenInfo.market_cap);
        }

        // If we have price from tokenInfo but not from metrics, use it
        if (tokenInfo?.current_price && (!data.metrics.currentPrice || data.metrics.currentPrice === 0)) {
          data.metrics.currentPrice = tokenInfo.current_price;
        }

        // If we have price change from tokenInfo but not from metrics, use it
        if (tokenInfo?.price_change_percentage_24h && (!data.metrics.priceChange24h || data.metrics.priceChange24h === 0)) {
          data.metrics.priceChange24h = tokenInfo.price_change_percentage_24h;
        }
        
        return data.metrics as TokenMetrics;
      } catch (error) {
        console.error('Exception fetching token metrics:', error);
        
        // Create a minimal metrics object with data from tokenInfo if available
        if (tokenInfo) {
          const fallbackMetrics: Partial<TokenMetrics> = {
            marketCap: tokenInfo.market_cap ? formatCurrency(tokenInfo.market_cap) : 'N/A',
            marketCapValue: tokenInfo.market_cap || 0,
            marketCapChange24h: tokenInfo.price_change_percentage_24h || 0,
            currentPrice: tokenInfo.current_price || 0,
            priceChange24h: tokenInfo.price_change_percentage_24h || 0,
            liquidityLock: 'N/A',
            liquidityLockDays: 0,
            topHoldersPercentage: 'N/A',
            topHoldersValue: 0,
            topHoldersTrend: null,
            tvl: 'N/A',
            tvlValue: 0,
            tvlChange24h: 0,
            auditStatus: 'N/A',
            socialFollowers: 'N/A',
            socialFollowersCount: 0,
            socialFollowersChange: 0
          };
          
          return fallbackMetrics as TokenMetrics;
        }
        
        // Show more helpful error message
        if ((error as Error).message?.includes('Failed to fetch')) {
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
    retry: 1, // Retry failed requests once
  });
};
