
import { TrendingUp, TrendingDown, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenInfo } from "@/hooks/useTokenInfo";
import { useTokenMetrics } from "@/hooks/useTokenMetrics";
import { useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

interface KeyMetricsGridProps {
  token: TokenInfo | null;
  tokenId: string;
  isLoading?: boolean;
}

export const KeyMetricsGrid = ({ token, tokenId, isLoading = false }: KeyMetricsGridProps) => {
  const { 
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    isError,
    refetch
  } = useTokenMetrics(tokenId, token);

  // Check if we're loading or have an error
  const showSkeletons = isLoading || metricsLoading;

  // Show error toast once when an error occurs
  useEffect(() => {
    if (isError && metricsError) {
      toast({
        title: "Error loading token metrics",
        description: "We're having trouble fetching the latest data. Some metrics may be unavailable.",
        variant: "destructive",
      });
    }
  }, [isError, metricsError]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Market Cap */}
      {showSkeletons ? (
        <MetricTileSkeleton />
      ) : (
        <MetricTile 
          label="Market Cap" 
          value={metrics?.marketCap || "Unknown"} 
          trend={metrics?.marketCapChange24h && metrics.marketCapChange24h > 0 ? "up" : "down"} 
          change={metrics?.marketCapChange24h ? `${metrics.marketCapChange24h.toFixed(1)}%` : undefined}
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
          value={metrics?.liquidityLock || "Unknown"} 
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
          value={metrics?.topHoldersPercentage || "Unknown"} 
          trend={metrics?.topHoldersTrend || undefined}
          change={metrics?.topHoldersTrend === "down" ? "Risk" : metrics?.topHoldersTrend === "up" ? "Good" : undefined}
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
          value={metrics?.tvl || "Unknown"} 
          trend={metrics?.tvlChange24h && metrics.tvlChange24h > 0 ? "up" : "down"}
          change={metrics?.tvlChange24h ? `${metrics.tvlChange24h.toFixed(1)}%` : undefined}
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
          value={metrics?.auditStatus || "Unknown"} 
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
          value={metrics?.socialFollowers || "Unknown"} 
          trend={metrics?.socialFollowersChange && metrics.socialFollowersChange > 0 ? "up" : "down"}
          change={metrics?.socialFollowersChange ? `${metrics.socialFollowersChange.toFixed(1)}%` : undefined}
          tooltip="Total followers across social platforms" 
          error={isError}
        />
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
    <Card className={`overflow-hidden ${error ? 'border-red-200' : ''}`}>
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
            <div className={`flex items-center text-xs ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
              {trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="ml-1">{change}</span>
            </div>
          )}
        </div>
        
        <h3 className="text-2xl font-bold mt-1">{error && value === "Unknown" ? "Error loading" : value}</h3>
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
