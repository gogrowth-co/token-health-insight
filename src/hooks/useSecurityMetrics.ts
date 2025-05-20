
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TokenInfo } from './useTokenInfo';

export interface SecurityData {
  ownershipRenounced: string;
  freezeAuthority: string;
  codeAudit: string;
  multiSigWallet: string;
  bugBounty: string;
  securityScore: number;
  fromCache?: boolean;
}

export const useSecurityMetrics = (
  tokenIdentifier?: string | null,
  tokenInfo?: TokenInfo | null,
  refreshTrigger: number = 0,
  forceRefresh: boolean = false
) => {
  const normalizedToken = tokenIdentifier?.replace(/^\$/, '').toLowerCase() || '';
  const contractAddress = tokenInfo?.contract_address || '';
  
  return useQuery({
    queryKey: ['securityMetrics', normalizedToken, refreshTrigger, forceRefresh],
    queryFn: async (): Promise<SecurityData> => {
      if (!normalizedToken && !contractAddress) {
        throw new Error('Token identifier or contract address is required');
      }

      console.log(`Fetching security metrics for ${normalizedToken || contractAddress} (refresh: ${refreshTrigger})`);
      
      try {
        // First try to get data from token_security_cache table
        const { data: secData, error: secError } = await supabase
          .from('token_security_cache')
          .select('*')
          .eq('token_address', contractAddress)
          .maybeSingle();
          
        // If data exists and we're not forcing a refresh, return it
        if (!forceRefresh && secData && !secError) {
          console.log(`Found security cache for ${contractAddress}`);
          
          return {
            ownershipRenounced: secData.ownership_renounced !== undefined 
              ? secData.ownership_renounced ? 'Yes' : 'No' 
              : 'N/A',
            freezeAuthority: secData.freeze_authority !== undefined
              ? secData.freeze_authority ? 'Yes' : 'No'
              : 'N/A',
            codeAudit: secData.code_audit || 'N/A',
            multiSigWallet: secData.multi_sig_wallet || 'N/A',
            bugBounty: secData.bug_bounty || 'N/A',
            securityScore: secData.security_score || 50,
            fromCache: true
          };
        }

        // If we're forcing a refresh or no cache exists, fetch fresh data
        console.log(`Fetching fresh security data for ${normalizedToken || contractAddress}`);
        
        // Fetch security data from our edge function
        const { data, error } = await supabase.functions.invoke('get-token-metrics', {
          body: { 
            token: normalizedToken,
            address: contractAddress,
            forceRefresh: forceRefresh,
            includeSecurity: true,
            mode: 'security-only'
          }
        });

        if (error) {
          console.error('Error fetching security data:', error);
          throw new Error(`Failed to fetch security data: ${error.message}`);
        }

        if (data.error) {
          console.error('API error fetching security data:', data.error);
          throw new Error(data.error);
        }

        console.log(`Successfully fetched security metrics for ${normalizedToken || contractAddress}`);
        
        // Extract security data
        const metrics = data.metrics || {};
        
        return {
          ownershipRenounced: metrics.ownershipRenounced || 'N/A',
          freezeAuthority: metrics.freezeAuthority || 'N/A',
          codeAudit: metrics.codeAudit || 'N/A',
          multiSigWallet: metrics.multiSigWallet || 'N/A',
          bugBounty: metrics.bugBounty || 'N/A',
          securityScore: metrics.securityScore || 50,
          fromCache: false
        };
      } catch (error) {
        console.error('Exception fetching security data:', error);
        
        // Create fallback data
        const fallbackData: SecurityData = {
          ownershipRenounced: 'N/A',
          freezeAuthority: 'N/A',
          codeAudit: 'N/A',
          multiSigWallet: 'N/A',
          bugBounty: 'N/A',
          securityScore: 50,
          fromCache: false
        };
        
        return fallbackData;
      }
    },
    enabled: !!normalizedToken || !!contractAddress,
    staleTime: forceRefresh ? 0 : 5 * 60 * 1000, // 0 if force refresh, otherwise 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2
  });
};
