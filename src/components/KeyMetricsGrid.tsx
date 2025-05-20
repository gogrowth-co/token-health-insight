
import { useEffect, useState } from "react";
import { TokenInfo } from "@/hooks/useTokenInfo";
import { useTokenMetrics, TokenMetadata } from "@/hooks/useTokenMetrics";
import { useTokenomics } from "@/hooks/useTokenonomics";
import { useSecurityMetrics } from "@/hooks/useSecurityMetrics";
import { useLiquidityMetrics } from "@/hooks/useLiquidityMetrics";
import { useCommunityMetrics } from "@/hooks/useCommunityMetrics";
import { useDevelopmentMetrics } from "@/hooks/useDevelopmentMetrics";
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
  error?: Error | null;
}

export const KeyMetricsGrid = ({ 
  token, 
  tokenId, 
  tokenMetadata,
  isLoading = false,
  error = null
}: KeyMetricsGridProps) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [connectionError, setConnectionError] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);
  
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

  // Fetch tokenomics data
  const {
    data: tokenomicsData,
    isLoading: tokenomicsLoading,
    error: tokenomicsError,
    refetch: refetchTokenomics
  } = useTokenomics(
    effectiveTokenId,
    token,
    refreshTrigger,
    forceRefresh
  );

  // Fetch security data
  const {
    data: securityData,
    isLoading: securityLoading,
    error: securityError,
    refetch: refetchSecurity
  } = useSecurityMetrics(
    effectiveTokenId,
    token,
    refreshTrigger,
    forceRefresh
  );

  // Fetch liquidity data
  const {
    data: liquidityData,
    isLoading: liquidityLoading,
    error: liquidityError,
    refetch: refetchLiquidity
  } = useLiquidityMetrics(
    effectiveTokenId,
    token,
    refreshTrigger,
    forceRefresh
  );

  // Fetch community data
  const {
    data: communityData,
    isLoading: communityLoading,
    error: communityError,
    refetch: refetchCommunity
  } = useCommunityMetrics(
    effectiveTokenId,
    token,
    refreshTrigger,
    forceRefresh
  );

  // Fetch development data
  const {
    data: developmentData,
    isLoading: developmentLoading,
    error: developmentError,
    refetch: refetchDevelopment
  } = useDevelopmentMetrics(
    effectiveTokenId,
    token,
    refreshTrigger,
    forceRefresh
  );

  // Use our custom hook for refresh functionality
  const { 
    isRefreshing, 
    handleRefresh, 
    refreshTrigger: hookRefreshTrigger, 
    setRefreshTrigger: hookSetRefreshTrigger 
  } = useMetricsRefresh(
    async () => {
      setForceRefresh(true);
      try {
        // Refetch all data in parallel
        await Promise.all([
          refetch(),
          refetchTokenomics(),
          refetchSecurity(),
          refetchLiquidity(),
          refetchCommunity(),
          refetchDevelopment()
        ]);
      } finally {
        setForceRefresh(false);
      }
    },
    setRefreshTrigger
  );

  // Check if we're loading or have an error
  const showSkeletons = isLoading || metricsLoading || tokenomicsLoading || 
    securityLoading || liquidityLoading || communityLoading || developmentLoading;

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
    setForceRefresh(true);
    try {
      // Refetch all data in parallel
      await Promise.all([
        refetch(),
        refetchTokenomics(),
        refetchSecurity(),
        refetchLiquidity(),
        refetchCommunity(),
        refetchDevelopment()
      ]);
    } finally {
      setForceRefresh(false);
    }
  };

  // Combine all metrics into one object for MetricsGrid
  const combinedMetrics = {
    ...metrics,
    tokenomics: tokenomicsData,
    security: securityData,
    liquidity: liquidityData,
    community: communityData,
    development: developmentData
  };

  return (
    <MetricsGrid
      metrics={combinedMetrics}
      showSkeletons={showSkeletons}
      isError={isError}
      connectionError={connectionError}
      metricsError={metricsError as Error | null}
      isRefreshing={isRefreshing || isRefetching}
      handleRefresh={handleRefresh}
      refetch={handleRefetchWrapper}
      contractAddress={tokenMetadata?.contract_address || token?.contract_address}
      blockchain={tokenMetadata?.blockchain || token?.blockchain}
    />
  );
};
