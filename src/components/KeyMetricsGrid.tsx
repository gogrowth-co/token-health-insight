
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
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

interface KeyMetricsGridProps {
  token: TokenInfo | null;
  tokenId: string;
  isLoading?: boolean;
}

export const KeyMetricsGrid = ({ token, tokenId, isLoading = false }: KeyMetricsGridProps) => {
  const { 
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError
  } = useTokenMetrics(tokenId, token);

  // Check if we're loading or have an error
  const showSkeletons = isLoading || metricsLoading;
  const hasError = metricsError ? true : false;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          error={hasError}
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
          error={hasError} 
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
          error={hasError}
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
          error={hasError}
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
          error={hasError}
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
          error={hasError}
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
        
        <h3 className="text-2xl font-bold mt-1">{error ? "Error loading" : value}</h3>
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
