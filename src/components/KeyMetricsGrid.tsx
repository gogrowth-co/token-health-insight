
import { useEffect, useState } from "react";
import { TokenInfo } from "@/hooks/useTokenInfo";
import { useTokenMetrics, TokenMetadata } from "@/hooks/useTokenMetrics";
import { MetricsGrid } from "./metrics/MetricsGrid";
import { useMetricsRefresh } from "@/hooks/useMetricsRefresh";

interface TokenMetadataUI {
  id: string;
  name?: string;
  symbol?: string;
  logo?: string;
  blockchain?: string;
  twitter?: string;
  github?: string;
  contract_address?: string;
}

interface KeyMetricsGridProps {
  token: TokenInfo | null;
  tokenId: string;
  tokenMetadata?: TokenMetadataUI;
  isLoading?: boolean;
}

export const KeyMetricsGrid = ({ 
  token, 
  tokenId, 
  tokenMetadata,
  isLoading = false 
}: KeyMetricsGridProps) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [connectionError, setConnectionError] = useState(false);
  
  // Use the token ID passed in as tokenId prop first, fallback to token.id from API
  const effectiveTokenId = tokenId || token?.id || '';
  
  console.log(`Fetching token metrics for ${effectiveTokenId} (refresh: ${refreshTrigger})`);
  console.log('Token metadata:', tokenMetadata);
  
  // Convert tokenMetadata to the format expected by useTokenMetrics
  const tokenMetadataForHook: TokenMetadata = {
    name: tokenMetadata?.name,
    symbol: tokenMetadata?.symbol,
    logo: tokenMetadata?.logo,
    contract_address: tokenMetadata?.contract_address,
    blockchain: tokenMetadata?.blockchain,
    twitter: tokenMetadata?.twitter,
    github: tokenMetadata?.github
  };
  
  // Initialize forceRefresh state variable before using it
  const [forceRefresh, setForceRefresh] = useState(false);
  
  const { 
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    isError,
    refetch,
    isRefetching
  } = useTokenMetrics(
    effectiveTokenId, 
    token, 
    refreshTrigger, 
    forceRefresh, 
    tokenMetadataForHook
  );

  // Use our custom hook for refresh functionality
  const { isRefreshing, handleRefresh } = useMetricsRefresh(
    () => refetch().then(() => {}), // Convert refetch to return Promise<void>
    setRefreshTrigger
  );

  // Check if we're loading or have an error
  const showSkeletons = isLoading || metricsLoading;

  // Check if we have a connection error
  useEffect(() => {
    if (isError) {
      const errorMessage = metricsError instanceof Error ? metricsError.message : 'Unknown error';
      setConnectionError(errorMessage.includes('Failed to fetch') || errorMessage.includes('connect to our servers'));
    } else {
      setConnectionError(false);
    }
  }, [isError, metricsError]);

  // Properly type the refetch function to match what MetricsGrid expects
  const handleRefetchWrapper = async () => {
    await refetch();
  };

  return (
    <MetricsGrid
      metrics={metrics}
      showSkeletons={showSkeletons}
      isError={isError}
      connectionError={connectionError}
      metricsError={metricsError as Error | null}
      isRefreshing={isRefreshing || isRefetching}
      handleRefresh={handleRefresh}
      refetch={handleRefetchWrapper}
    />
  );
};
