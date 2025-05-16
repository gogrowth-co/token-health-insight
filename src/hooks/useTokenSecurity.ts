
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TokenSecurityData {
  contractAddress: string;
  contractVerified: boolean;
  ownershipRenounced: boolean;
  honeypotRisk: 'High' | 'Low' | 'Unknown';
  isMintable: boolean;
  isBlacklisted: boolean;
  canTakeBackOwnership: boolean;
  hiddenOwner: boolean;
  slippageModifiable: boolean;
  tradingCooldown: boolean;
  riskFactors: string[];
  scannedAt: string;
  dataSource: {
    etherscan: boolean;
    goPlus: boolean;
  }
}

export interface TokenSecurityResponse {
  data: TokenSecurityData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<TokenSecurityData | null>;
}

export function useTokenSecurity(contractAddress: string | null): TokenSecurityResponse {
  const [data, setData] = useState<TokenSecurityData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSecurityData = async (address: string): Promise<TokenSecurityData | null> => {
    if (!address || !address.trim()) {
      setError("Contract address is required");
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Call our edge function to fetch security data
      const { data: securityData, error: securityError } = await supabase.functions.invoke(
        'fetch-token-security-data',
        {
          body: { contractAddress: address },
        }
      );
      
      if (securityError) {
        throw new Error(securityError.message);
      }
      
      if (!securityData) {
        throw new Error("No security data returned for this token");
      }
      
      const securityResult = securityData as TokenSecurityData;
      setData(securityResult);
      return securityResult;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch security data";
      setError(errorMessage);
      
      toast({
        title: "Security Data Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to refetch data
  const refetch = async (): Promise<TokenSecurityData | null> => {
    if (!contractAddress) return null;
    return fetchSecurityData(contractAddress);
  };
  
  // Initial fetch if contract address is provided
  useEffect(() => {
    if (contractAddress) {
      fetchSecurityData(contractAddress);
    }
  }, [contractAddress]);
  
  return { data, isLoading, error, refetch };
}
