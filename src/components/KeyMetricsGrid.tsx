
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KeyMetricsGridProps {
  projectData: {
    marketCap: string;
    liquidityLock: string;
    topHoldersPercentage: string;
    tvl: string;
    auditStatus: string;
    socialFollowers: string;
  };
}

export const KeyMetricsGrid = ({ projectData }: KeyMetricsGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Market Cap */}
      <MetricTile 
        label="Market Cap" 
        value={projectData.marketCap} 
        trend="up" 
        change="+5.2%"
        tooltip="Total market value of circulating supply" 
      />

      {/* Liquidity Lock */}
      <MetricTile 
        label="Liquidity Lock" 
        value={projectData.liquidityLock} 
        tooltip="Duration that liquidity is locked for" 
      />

      {/* Top Holders % */}
      <MetricTile 
        label="Top 10 Holders" 
        value={projectData.topHoldersPercentage} 
        trend="down" 
        change="-3.1%"
        tooltip="Percentage owned by top 10 addresses" 
      />

      {/* TVL */}
      <MetricTile 
        label="TVL" 
        value={projectData.tvl} 
        trend="up" 
        change="+1.8%"
        tooltip="Total Value Locked in protocol" 
      />

      {/* Audit Status */}
      <MetricTile 
        label="Audit Status" 
        value={projectData.auditStatus} 
        tooltip="Contract verification status" 
      />

      {/* Social Followers */}
      <MetricTile 
        label="Social Followers" 
        value={projectData.socialFollowers} 
        trend="up" 
        change="+12%"
        tooltip="Total followers across social platforms" 
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
}

const MetricTile = ({ label, value, trend, change, tooltip }: MetricTileProps) => {
  return (
    <Card className="overflow-hidden">
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
        
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
      </CardContent>
    </Card>
  );
};
