
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TokenCoreMetrics {
  name: string;
  symbol: string;
  price: number | null;
  marketCap: number | null;
  volume24h: number | null; 
  dexVolume24h: number | null;
  liquidityUSD: number | null;
  supply: number | null;
  contractAddress: string;
  dataQuality: "complete" | "partial" | "minimal";
  dataSources: string[];
  scannedAt: string;
  tvlSparkline?: {
    data: number[];
    trend: 'up' | 'down';
    change: number;
  };
  communityData?: {
    twitterFollowers?: number;
    telegramUsers?: number;
    redditSubscribers?: number;
  };
  developerData?: {
    forks?: number;
    stars?: number;
    commitCount?: number;
  };
}

export interface TokenMetricsResponse {
  data: TokenCoreMetrics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<TokenCoreMetrics | null>;
}

export function useTokenMetrics(contractAddress: string | null): TokenMetricsResponse {
  const [data, setData] = useState<TokenCoreMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMetrics = async (address: string): Promise<TokenCoreMetrics | null> => {
    if (!address || !address.trim()) {
      setError("Contract address is required");
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Call our edge function to fetch metrics
      const { data: metricsData, error: metricsError } = await supabase.functions.invoke(
        'fetch-token-core-metrics',
        {
          body: { contractAddress: address },
        }
      );
      
      if (metricsError) {
        throw new Error(metricsError.message);
      }
      
      if (!metricsData) {
        throw new Error("No data returned for this token");
      }
      
      const metricsResult = metricsData as TokenCoreMetrics;
      setData(metricsResult);
      return metricsResult;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch token metrics";
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to refetch data
  const refetch = async (): Promise<TokenCoreMetrics | null> => {
    if (!contractAddress) return null;
    return fetchMetrics(contractAddress);
  };
  
  // Initial fetch if contract address is provided
  useState(() => {
    if (contractAddress) {
      fetchMetrics(contractAddress);
    }
  });
  
  return { data, isLoading, error, refetch };
}

// Helper function to format values for display
export function formatTokenValue(value: number | null | undefined, type: 'price' | 'marketCap' | 'volume' | 'supply' | 'percent'): string {
  if (value === null || value === undefined) return 'N/A';
  
  switch (type) {
    case 'price':
      if (value < 0.01) {
        return `$${value.toFixed(6)}`;
      }
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      
    case 'marketCap':
    case 'volume':
      if (value >= 1_000_000_000) {
        return `$${(value / 1_000_000_000).toFixed(2)}B`;
      } else if (value >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(2)}M`;
      } else if (value >= 1_000) {
        return `$${(value / 1_000).toFixed(2)}K`;
      }
      return `$${value.toLocaleString()}`;
      
    case 'supply':
      if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(2)}B`;
      } else if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(2)}M`;
      } else if (value >= 1_000) {
        return `${(value / 1_000).toFixed(2)}K`;
      }
      return value.toLocaleString();
      
    case 'percent':
      return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
      
    default:
      return value.toString();
  }
}
