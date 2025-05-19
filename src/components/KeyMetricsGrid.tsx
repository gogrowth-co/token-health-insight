
import { TrendingUp, TrendingDown, Loader2, AlertCircle, RefreshCw, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TokenInfo } from "@/hooks/useTokenInfo";
import { useTokenMetrics, TokenMetadata } from "@/hooks/useTokenMetrics";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast";

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);
  
  // Use the token ID passed in as tokenId prop first, fallback to token.id from API
  const effectiveTokenId = tokenId || token?.id || '';
  
  console.log(`Fetching token metrics for ${effectiveTokenId} (refresh: ${refreshTrigger}, force: ${forceRefresh})`);
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

  // Check if we're loading or have an error
  const showSkeletons = isLoading || metricsLoading;
  
  // Check if we have no data
  const noData = !metrics && !isLoading && !metricsLoading;

  // Show error toast once when an error occurs
  useEffect(() => {
    if (isError && metricsError) {
      toast({
        title: "Error loading token metrics",
        description: "We're having trouble fetching the latest data. Some metrics may be unavailable.",
        variant: "destructive",
      });
      console.error("Token metrics error:", metricsError);
    }
  }, [isError, metricsError]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setForceRefresh(true);
    try {
      await refetch();
      setRefreshTrigger(prev => prev + 1);
      toast({
        title: "Metrics refreshed",
        description: "The latest token metrics have been loaded.",
      });
    } catch (error) {
      console.error("Error refreshing metrics:", error);
      toast({
        title: "Refresh failed",
        description: "Unable to refresh metrics. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
      // Reset force refresh after a delay to prevent repeated forced refreshes
      setTimeout(() => {
        setForceRefresh(false);
      }, 1000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Key Metrics</h2>
        <Button 
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading || isRefetching}
          className="flex items-center gap-1"
        >
          {(isRefreshing || isRefetching) ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </>
          )}
        </Button>
      </div>

      {isError && (
        <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-2">
          <AlertCircle className="text-red-500" size={20} />
          <div className="text-sm text-red-700">
            Error loading metrics. 
            <button 
              onClick={() => refetch()} 
              className="ml-2 underline text-indigo-600 hover:text-indigo-800"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Market Cap */}
        {showSkeletons ? (
          <MetricTileSkeleton />
        ) : (
          <MetricTile 
            label="Market Cap" 
            value={metrics?.marketCap || "N/A"} 
            trend={metrics?.marketCapChange24h && metrics.marketCapChange24h > 0 ? "up" : metrics?.marketCapChange24h ? "down" : undefined} 
            change={metrics?.marketCapChange24h ? `${Math.abs(metrics.marketCapChange24h).toFixed(1)}%` : undefined}
            tooltip="Total market value of circulating supply" 
            error={isError}
          />
        )}

        {/* Liquidity Lock */}
        {showSkeletons ? (
          <MetricTileSkeleton />
        ) : (
          <MetricTile 
            label="Liquidity Lock" 
            value={metrics?.liquidityLock || "N/A"} 
            tooltip="Duration that liquidity is locked for"
            error={isError} 
          />
        )}

        {/* Top Holders % */}
        {showSkeletons ? (
          <MetricTileSkeleton />
        ) : (
          <MetricTile 
            label="Top 10 Holders" 
            value={metrics?.topHoldersPercentage || "N/A"} 
            trend={metrics?.topHoldersTrend || undefined}
            change={metrics?.topHoldersTrend === "down" ? "Low Risk" : metrics?.topHoldersTrend === "up" ? "High Risk" : undefined}
            tooltip="Percentage owned by top 10 addresses" 
            error={isError}
          />
        )}

        {/* TVL */}
        {showSkeletons ? (
          <MetricTileSkeleton />
        ) : (
          <MetricTile 
            label="TVL" 
            value={metrics?.tvl || "N/A"} 
            trend={metrics?.tvlChange24h && metrics.tvlChange24h > 0 ? "up" : metrics?.tvlChange24h ? "down" : undefined}
            change={metrics?.tvlChange24h ? `${Math.abs(metrics.tvlChange24h).toFixed(1)}%` : undefined}
            tooltip="Total Value Locked in protocol" 
            error={isError}
          />
        )}

        {/* Audit Status */}
        {showSkeletons ? (
          <MetricTileSkeleton />
        ) : (
          <MetricTile 
            label="Audit Status" 
            value={metrics?.auditStatus || "N/A"} 
            tooltip="Contract verification status" 
            error={isError}
          />
        )}

        {/* Social Followers */}
        {showSkeletons ? (
          <MetricTileSkeleton />
        ) : (
          <MetricTile 
            label="Social Followers" 
            value={metrics?.socialFollowers || "N/A"} 
            trend={metrics?.socialFollowersChange && metrics.socialFollowersChange > 0 ? "up" : metrics?.socialFollowersChange ? "down" : undefined}
            change={metrics?.socialFollowersChange ? `${Math.abs(metrics.socialFollowersChange).toFixed(1)}%` : undefined}
            tooltip="Twitter followers - Data updated every 24h" 
            error={isError}
          />
        )}
      </div>
      
      {/* N/A fields explanation */}
      {!showSkeletons && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
          <Info size={14} />
          <span>
            "N/A" indicates data is not available or not applicable for this token.
          </span>
        </div>
      )}
    </div>
  );
};

interface MetricTileProps {
  label: string;
  value: string;
  trend?: "up" | "down";
  change?: string;
  tooltip: string;
  error?: boolean;
}

const MetricTile = ({ label, value, trend, change, tooltip, error = false }: MetricTileProps) => {
  return (
    <Card className={`overflow-hidden ${error ? 'border-red-200 bg-red-50/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-sm text-gray-500 cursor-help">{label}</p>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {trend && change && (
            <div className={`flex items-center text-xs ${trend === "up" ? (label === "Top 10 Holders" ? "text-red-500" : "text-green-500") : (label === "Top 10 Holders" ? "text-green-500" : "text-red-500")}`}>
              {trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="ml-1">{change}</span>
            </div>
          )}
        </div>
        
        <h3 className={`text-2xl font-bold mt-1 ${value === "N/A" ? "text-gray-400" : ""}`}>
          {value}
        </h3>
      </CardContent>
    </Card>
  );
};

const MetricTileSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-10" />
      </div>
      <Skeleton className="h-8 w-32 mt-2" />
    </CardContent>
  </Card>
);
