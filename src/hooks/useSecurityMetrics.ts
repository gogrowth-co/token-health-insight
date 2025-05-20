
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TokenInfo } from './useTokenInfo';

export interface SecurityData {
  ownershipRenounced: string;
  ownershipRenouncedValue: boolean;
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
    queryKey: ['securityMetrics', normalizedToken, contractAddress, refreshTrigger, forceRefresh],
    queryFn: async (): Promise<SecurityData> => {
      if (!normalizedToken && !contractAddress) {
        throw new Error('Token identifier or contract address is required');
      }

      console.log(`Fetching security metrics for ${normalizedToken || contractAddress} (refresh: ${refreshTrigger}, force: ${forceRefresh})`);
      
      try {
        // First try to get data from security cache table
        const { data: securityData, error: securityError } = await supabase
          .from('token_security_cache')
          .select('*')
          .eq('token_address', contractAddress)
          .single();
        
        // If data exists and we're not forcing a refresh, return it
        if (!forceRefresh && securityData && !securityError) {
          console.log(`Found security cache for ${contractAddress}`);
          
          return {
            ownershipRenounced: securityData.ownership_renounced ? 'Yes' : 'No',
            ownershipRenouncedValue: !!securityData.ownership_renounced,
            freezeAuthority: securityData.freeze_authority ? 'Yes' : 'No',
            codeAudit: securityData.code_audit || 'Coming Soon',
            multiSigWallet: securityData.multi_sig_wallet || 'Coming Soon',
            bugBounty: securityData.bug_bounty || 'Coming Soon',
            securityScore: securityData.security_score || 50,
            fromCache: true
          };
        }

        // If we're forcing a refresh or no cache exists, fetch fresh data from API
        const blockchain = tokenInfo?.blockchain || 'eth';
        
        console.log(`Fetching fresh security data for ${normalizedToken || contractAddress}, contract=${contractAddress}, blockchain=${blockchain}`);
        
        // Fetch security data from our edge function
        const { data, error } = await supabase.functions.invoke('get-token-metrics', {
          body: { 
            token: normalizedToken,
            address: contractAddress,
            blockchain: blockchain,
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

        console.log(`Successfully fetched security for ${normalizedToken || contractAddress}`);
        
        // Extract security data
        const metrics = data.metrics || {};
        
        return {
          ownershipRenounced: metrics.ownershipRenounced || 'N/A',
          ownershipRenouncedValue: metrics.ownershipRenouncedValue || false,
          freezeAuthority: metrics.freezeAuthority || 'N/A',
          codeAudit: metrics.codeAudit || 'Coming Soon',
          multiSigWallet: metrics.multiSigWallet || 'Coming Soon',
          bugBounty: metrics.bugBounty || 'Coming Soon',
          securityScore: metrics.securityScore || 50,
          fromCache: false
        };
      } catch (error) {
        console.error('Exception fetching security data:', error);
        
        // Create fallback data
        const fallbackData: SecurityData = {
          ownershipRenounced: 'N/A',
          ownershipRenouncedValue: false,
          freezeAuthority: 'N/A',
          codeAudit: 'Coming Soon',
          multiSigWallet: 'Coming Soon',
          bugBounty: 'Coming Soon',
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
