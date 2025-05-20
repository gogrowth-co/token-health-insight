
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TokenInfo } from './useTokenInfo';

export interface LiquidityData {
  liquidityLock: string;
  liquidityLockDays: number;
  cexListings: string;
  dexDepth: string;
  dexDepthValue: number;
  holderDistribution: string;
  holderDistributionValue: number;
  tradingVolume24h: number;
  tradingVolumeFormatted: string;
  tradingVolumeChange24h: number;
  liquidityScore: number;
  fromCache?: boolean;
}

export const useLiquidityMetrics = (
  tokenIdentifier?: string | null,
  tokenInfo?: TokenInfo | null,
  refreshTrigger: number = 0,
  forceRefresh: boolean = false
) => {
  const normalizedToken = tokenIdentifier?.replace(/^\$/, '').toLowerCase() || '';
  
  return useQuery({
    queryKey: ['liquidityMetrics', normalizedToken, refreshTrigger, forceRefresh],
    queryFn: async (): Promise<LiquidityData> => {
      if (!normalizedToken) {
        throw new Error('Token identifier is required');
      }

      console.log(`Fetching liquidity metrics for ${normalizedToken} (refresh: ${refreshTrigger}, force: ${forceRefresh})`);
      
      try {
        // First try to get data from liquidity cache table
        const { data: liquidityData, error: liquidityError } = await supabase
          .from('token_liquidity_cache')
          .select('*')
          .eq('token_id', normalizedToken)
          .single();
        
        // If data exists and we're not forcing a refresh, return it
        if (!forceRefresh && liquidityData && !liquidityError) {
          console.log(`Found liquidity cache for ${normalizedToken}`);
          
          return {
            liquidityLock: liquidityData.liquidity_lock || 'N/A',
            liquidityLockDays: liquidityData.liquidity_lock_days || 0,
            cexListings: liquidityData.cex_listings || 'N/A',
            dexDepth: liquidityData.dex_depth || 'N/A',
            dexDepthValue: Number(liquidityData.dex_depth_value) || 0,
            holderDistribution: liquidityData.holder_distribution || 'N/A',
            holderDistributionValue: Number(liquidityData.holder_distribution_value) || 0,
            tradingVolume24h: Number(liquidityData.trading_volume_24h) || 0,
            tradingVolumeFormatted: liquidityData.trading_volume_formatted || 'N/A',
            tradingVolumeChange24h: Number(liquidityData.trading_volume_change_24h) || 0,
            liquidityScore: liquidityData.liquidity_score || 50,
            fromCache: true
          };
        }

        // If we're forcing a refresh or no cache exists, fetch fresh data from API
        const contractAddress = tokenInfo?.contract_address || '';
        const blockchain = tokenInfo?.blockchain || 'eth';
        
        console.log(`Fetching fresh liquidity data for ${normalizedToken}, contract=${contractAddress}, blockchain=${blockchain}`);
        
        // Fetch liquidity data from our edge function
        const { data, error } = await supabase.functions.invoke('get-token-metrics', {
          body: { 
            token: normalizedToken,
            address: contractAddress,
            blockchain: blockchain,
            forceRefresh: forceRefresh,
            includeLiquidity: true,
            mode: 'liquidity-only'
          }
        });

        if (error) {
          console.error('Error fetching liquidity data:', error);
          throw new Error(`Failed to fetch liquidity data: ${error.message}`);
        }

        if (data.error) {
          console.error('API error fetching liquidity data:', data.error);
          throw new Error(data.error);
        }

        console.log(`Successfully fetched liquidity for ${normalizedToken}`);
        
        // Extract liquidity data
        const metrics = data.metrics || {};
        
        return {
          liquidityLock: metrics.liquidityLock || 'N/A',
          liquidityLockDays: metrics.liquidityLockDays || 0,
          cexListings: metrics.cexListings || 'N/A',
          dexDepth: metrics.dexDepth || 'N/A',
          dexDepthValue: metrics.dexDepthValue || 0,
          holderDistribution: metrics.holderDistribution || 'N/A',
          holderDistributionValue: metrics.holderDistributionValue || 0,
          tradingVolume24h: metrics.tradingVolume24h || 0,
          tradingVolumeFormatted: metrics.tradingVolumeFormatted || 'N/A',
          tradingVolumeChange24h: metrics.tradingVolumeChange24h || 0,
          liquidityScore: metrics.liquidityScore || 50,
          fromCache: false
        };
      } catch (error) {
        console.error('Exception fetching liquidity data:', error);
        
        // Create fallback data
        const fallbackData: LiquidityData = {
          liquidityLock: 'N/A',
          liquidityLockDays: 0,
          cexListings: 'N/A',
          dexDepth: 'N/A',
          dexDepthValue: 0,
          holderDistribution: 'N/A',
          holderDistributionValue: 0,
          tradingVolume24h: 0,
          tradingVolumeFormatted: 'N/A',
          tradingVolumeChange24h: 0,
          liquidityScore: 50,
          fromCache: false
        };
        
        return fallbackData;
      }
    },
    enabled: !!normalizedToken,
    staleTime: forceRefresh ? 0 : 5 * 60 * 1000, // 0 if force refresh, otherwise 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2
  });
};
