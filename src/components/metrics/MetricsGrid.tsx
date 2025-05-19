
import { useEffect } from "react";
import { Info, Clock, Database, Twitter } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { MetricTile, MetricTileSkeleton } from "./MetricTile";
import { ErrorState } from "./ErrorState";
import { RefreshButton } from "./RefreshButton";
import { TokenMetrics } from "@/hooks/useTokenMetrics";

interface MetricsGridProps {
  metrics?: TokenMetrics;
  showSkeletons: boolean;
  isError: boolean;
  connectionError: boolean;
  metricsError: Error | null;
  isRefreshing: boolean;
  handleRefresh: () => Promise<void>;
  refetch: () => Promise<void>;
}

export const MetricsGrid = ({ 
  metrics,
  showSkeletons,
  isError,
  connectionError,
  metricsError,
  isRefreshing,
  handleRefresh,
  refetch
}: MetricsGridProps) => {
  // Show error toast once when an error occurs
  useEffect(() => {
    if (isError && metricsError) {
      const errorMessage = metricsError instanceof Error ? metricsError.message : 'Unknown error';
      
      toast({
        title: connectionError ? "Connection error" : "Error loading token metrics",
        description: connectionError 
          ? "We're having trouble connecting to our servers. Please check your internet connection and try again."
          : "We're having trouble fetching the latest data. Some metrics may be unavailable.",
        variant: "destructive",
      });
      console.error("Token metrics error:", metricsError);
    }
  }, [isError, metricsError, connectionError]);

  // Format the last update timestamp for social followers tooltip
  const getSocialFollowersTooltip = () => {
    return "Twitter followers count - Coming Soon";
  };
  
  // Format the top holders tooltip
  const getTopHoldersTooltip = () => {
    const baseTooltip = "Percentage owned by top 10 addresses";
    
    if (metrics?.topHoldersPercentage === "N/A") {
      return `${baseTooltip} - Data currently unavailable`;
    }
    
    if (metrics?.fromCache) {
      return `${baseTooltip} - Data from cache`;
    }
    
    return baseTooltip;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Key Metrics</h2>
        <RefreshButton 
          isRefreshing={isRefreshing}
          isLoading={showSkeletons}
          onRefresh={handleRefresh}
        />
      </div>

      {isError && (
        <ErrorState connectionError={connectionError} onRetry={refetch} />
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
            tooltip={getTopHoldersTooltip()}
            error={isError}
            icon={metrics?.fromCache ? <Database size={14} className="text-gray-400" /> : undefined}
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

        {/* Social Followers - Modified to show Coming Soon */}
        {showSkeletons ? (
          <MetricTileSkeleton />
        ) : (
          <MetricTile 
            label="Social Followers" 
            value="Coming Soon" 
            trend={undefined}
            change={undefined}
            tooltip={getSocialFollowersTooltip()} 
            error={isError}
            icon={<Twitter size={14} className="text-blue-400" />}
            comingSoon={true}
          />
        )}
      </div>
      
      {/* N/A fields explanation */}
      {!showSkeletons && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
          <Info size={14} />
          <span>
            "N/A" indicates data is not available or not applicable for this token.
            {metrics?.socialFollowersFromCache && <span className="ml-1"><Clock size={14} className="inline mr-1" />indicates data from cache.</span>}
          </span>
        </div>
      )}
    </div>
  );
};
