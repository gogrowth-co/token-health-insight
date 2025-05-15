
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Clock, CircleDollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TokenMetrics } from "@/api/types";
import { scanToken } from "@/api/tokenScanner";

interface KeyMetricsGridProps {
  projectData: {
    marketCap: string;
    liquidityLock: string;
    topHoldersPercentage: string;
    tvl: string;
    auditStatus: string;
    socialFollowers: string;
  };
  tokenId?: string;
}

export const KeyMetricsGrid = ({ projectData, tokenId }: KeyMetricsGridProps) => {
  const [metrics, setMetrics] = useState(projectData);
  const [loading, setLoading] = useState(false);

  // Auto refresh data every 60 seconds if a tokenId is provided
  useEffect(() => {
    if (!tokenId) return;

    const refreshData = async () => {
      try {
        setLoading(true);
        const updatedData = await scanToken(tokenId);
        if (updatedData) {
          setMetrics({
            marketCap: updatedData.marketCap,
            liquidityLock: updatedData.liquidityLock,
            topHoldersPercentage: updatedData.topHoldersPercentage,
            tvl: updatedData.tvl,
            auditStatus: updatedData.auditStatus,
            socialFollowers: updatedData.socialFollowers
          });
        }
      } catch (error) {
        console.error("Error refreshing metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    // Initial refresh
    refreshData();

    // Set up interval for auto-refresh (60 seconds)
    const intervalId = setInterval(refreshData, 60000);

    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [tokenId]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Market Cap */}
      <MetricTile 
        label="Market Cap" 
        value={metrics.marketCap} 
        trend="up" 
        change="+5.2%"
        tooltip="Total market value of circulating supply"
        loading={loading}
      />

      {/* Liquidity Lock */}
      <MetricTile 
        label="Liquidity Lock" 
        value={metrics.liquidityLock}
        tooltip="Duration that liquidity is locked for"
        loading={loading}
        icon={<Clock size={14} />}
        status={metrics.liquidityLock === "Not locked" ? "warning" : "default"}
      />

      {/* Top Holders % */}
      <MetricTile 
        label="Top 10 Holders" 
        value={metrics.topHoldersPercentage} 
        trend="down" 
        change="-3.1%"
        tooltip="Percentage owned by top 10 addresses"
        loading={loading}
      />

      {/* TVL */}
      <MetricTile 
        label="TVL" 
        value={metrics.tvl} 
        trend="up" 
        change="+1.8%"
        tooltip="Total Value Locked in protocol"
        loading={loading}
        icon={<CircleDollarSign size={14} />}
      />

      {/* Audit Status */}
      <MetricTile 
        label="Audit Status" 
        value={metrics.auditStatus} 
        tooltip="Contract verification status"
        loading={loading}
        status={metrics.auditStatus === "Verified" ? "success" : 
               metrics.auditStatus === "Partial" ? "warning" : "error"}
      />

      {/* Social Followers */}
      <MetricTile 
        label="Social Followers" 
        value={metrics.socialFollowers} 
        trend="up" 
        change="+12%"
        tooltip="Total followers across social platforms"
        loading={loading}
      />
    </div>
  );
};

interface MetricTileProps {
  label: string;
  value: string;
  trend?: "up" | "down";
  change?: string;
  tooltip: string;
  loading?: boolean;
  icon?: React.ReactNode;
  status?: "default" | "success" | "warning" | "error";
}

const MetricTile = ({ label, value, trend, change, tooltip, loading, icon, status = "default" }: MetricTileProps) => {
  // Status color mapping
  const statusColors: Record<string, string> = {
    default: "",
    success: "text-green-500",
    warning: "text-yellow-500",
    error: "text-red-500"
  };

  return (
    <Card className={`overflow-hidden ${loading ? 'opacity-70' : ''}`}>
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
          
          {icon && <span className={statusColors[status]}>{icon}</span>}
          
          {trend && change && (
            <div className={`flex items-center text-xs ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
              {trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="ml-1">{change}</span>
            </div>
          )}
        </div>
        
        <h3 className={`text-2xl font-bold mt-1 ${statusColors[status]}`}>{value}</h3>
        
        {loading && (
          <div className="mt-2">
            <div className="h-1 bg-gray-200 rounded overflow-hidden">
              <div className="h-1 bg-blue-500 animate-pulse rounded" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
