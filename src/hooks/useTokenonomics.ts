
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TokenInfo } from './useTokenInfo';
import { formatCurrency, formatNumber } from '@/lib/utils';

export interface TokenomicsData {
  tvl: string;
  tvlValue: number;
  tvlChange24h: number;
  supplyCap: string;
  supplyCapValue: number;
  supplyCapExists: boolean;
  tokenDistribution: string;
  tokenDistributionValue: number;
  tokenDistributionRating: string;
  treasurySize: string;
  treasurySizeValue: number;
  burnMechanism: string;
  tokenomicsScore: number;
  fromCache?: boolean;
}

export const useTokenomics = (
  tokenIdentifier?: string | null,
  tokenInfo?: TokenInfo | null,
  refreshTrigger: number = 0,
  forceRefresh: boolean = false
) => {
  const normalizedToken = tokenIdentifier?.replace(/^\$/, '').toLowerCase() || '';
  
  return useQuery({
    queryKey: ['tokenomics', normalizedToken, refreshTrigger, forceRefresh],
    queryFn: async (): Promise<TokenomicsData> => {
      if (!normalizedToken) {
        throw new Error('Token identifier is required');
      }

      console.log(`Fetching tokenomics for ${normalizedToken} (refresh: ${refreshTrigger}, force: ${forceRefresh})`);
      
      try {
        // First try to get data from dedicated tokenomics cache table
        const { data: tokenomicsData, error: tokenomicsError } = await supabase
          .from('token_tokenomics_cache')
          .select('*')
          .eq('token_id', normalizedToken)
          .single();
        
        // If data exists in tokenomics cache and we're not forcing a refresh, return it
        if (!forceRefresh && tokenomicsData && !tokenomicsError) {
          console.log(`Found tokenomics cache for ${normalizedToken}`);
          
          return {
            tvl: tokenomicsData.tvl_formatted || 'N/A',
            tvlValue: Number(tokenomicsData.tvl_value) || 0,
            tvlChange24h: Number(tokenomicsData.tvl_change_24h) || 0,
            supplyCap: tokenomicsData.supply_cap_formatted || 'N/A',
            supplyCapValue: Number(tokenomicsData.supply_cap_value) || 0,
            supplyCapExists: tokenomicsData.supply_cap_exists || false,
            tokenDistribution: tokenomicsData.token_distribution_formatted || 'N/A',
            tokenDistributionValue: Number(tokenomicsData.token_distribution_value) || 0,
            tokenDistributionRating: tokenomicsData.token_distribution_rating || 'N/A',
            treasurySize: tokenomicsData.treasury_size_formatted || 'N/A',
            treasurySizeValue: Number(tokenomicsData.treasury_size_value) || 0,
            burnMechanism: tokenomicsData.burn_mechanism || 'N/A',
            tokenomicsScore: tokenomicsData.tokenomics_score || 65,
            fromCache: true
          };
        }

        // If we're forcing a refresh or no cache exists, fetch fresh data from API
        const contractAddress = tokenInfo?.contract_address || '';
        const blockchain = tokenInfo?.blockchain || 'eth';
        
        console.log(`Fetching fresh tokenomics data for ${normalizedToken}, contract=${contractAddress}, blockchain=${blockchain}`);
        
        // Fetch tokenomics data from our edge function
        const { data, error } = await supabase.functions.invoke('get-token-metrics', {
          body: { 
            token: normalizedToken,
            address: contractAddress,
            blockchain: blockchain,
            forceRefresh: forceRefresh,
            includeTokenomics: true, // Only request tokenomics data
            mode: 'tokenomics-only' // Signal that we only want tokenomics data
          }
        });

        if (error) {
          console.error('Error fetching tokenomics data:', error);
          throw new Error(`Failed to fetch tokenomics data: ${error.message}`);
        }

        if (data.error) {
          console.error('API error fetching tokenomics data:', data.error);
          throw new Error(data.error);
        }

        console.log(`Successfully fetched tokenomics for ${normalizedToken}`);
        
        // Extract tokenomics data
        const metrics = data.metrics || {};
        
        return {
          tvl: metrics.tvl || 'N/A',
          tvlValue: metrics.tvlValue || 0,
          tvlChange24h: metrics.tvlChange24h || 0,
          supplyCap: metrics.supplyCap || 'N/A',
          supplyCapValue: metrics.supplyCapValue || 0,
          supplyCapExists: metrics.supplyCapExists || false,
          tokenDistribution: metrics.tokenDistribution || 'N/A',
          tokenDistributionValue: metrics.tokenDistributionValue || 0,
          tokenDistributionRating: metrics.tokenDistributionRating || 'N/A',
          treasurySize: metrics.treasurySize || 'N/A',
          treasurySizeValue: metrics.treasurySizeValue || 0,
          burnMechanism: metrics.burnMechanism || 'N/A',
          tokenomicsScore: metrics.tokenomicsScore || 65,
          fromCache: false
        };
      } catch (error) {
        console.error('Exception fetching tokenomics data:', error);
        
        // Create fallback data
        const fallbackData: TokenomicsData = {
          tvl: 'N/A',
          tvlValue: 0,
          tvlChange24h: 0,
          supplyCap: 'N/A',
          supplyCapValue: 0,
          supplyCapExists: false,
          tokenDistribution: 'N/A',
          tokenDistributionValue: 0,
          tokenDistributionRating: 'N/A',
          treasurySize: 'N/A',
          treasurySizeValue: 0,
          burnMechanism: 'N/A',
          tokenomicsScore: 65,
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
