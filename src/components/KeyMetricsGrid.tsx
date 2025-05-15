
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Clock, CircleDollarSign, Users, ShieldCheck } from "lucide-react";
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
    etherscan?: {
      securityAnalysis?: {
        ownershipRenounced: boolean;
        canMint: boolean;
        canBurn: boolean;
        hasFreeze: boolean;
        isMultiSig: boolean;
      };
    };
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
            socialFollowers: updatedData.socialFollowers,
            etherscan: updatedData.etherscan
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

  // Get security metrics from Etherscan data
  const securityAnalysis = metrics.etherscan?.securityAnalysis;
  
  // Get ownership status for tooltip
  const getOwnershipStatus = () => {
    if (!securityAnalysis) return "Unknown";
    return securityAnalysis.ownershipRenounced ? "Yes" : "No";
  };
  
  // Get ownership tooltip
  const getOwnershipTooltip = () => {
    if (!securityAnalysis) return "No contract data available";
    return securityAnalysis.ownershipRenounced 
      ? "Contract ownership has been renounced, reducing centralization risk" 
      : "Contract ownership has not been renounced, deployer still has control";
  };
  
  // Get wallet type
  const getWalletType = () => {
    if (!securityAnalysis) return "Unknown";
    return securityAnalysis.isMultiSig ? "Multi-sig" : "EOA";
  };

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
        trend={parseFloat(metrics.topHoldersPercentage) > 70 ? "down" : "up"}
        change={parseFloat(metrics.topHoldersPercentage) > 70 ? "-3.1%" : "+2.4%"}
        tooltip="Percentage owned by top 10 addresses"
        loading={loading}
        icon={<Users size={14} />}
        status={parseFloat(metrics.topHoldersPercentage) > 70 ? "warning" : "default"}
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

      {/* Ownership Status */}
      <MetricTile 
        label="Ownership Renounced" 
        value={getOwnershipStatus()} 
        tooltip={getOwnershipTooltip()}
        loading={loading}
        icon={<ShieldCheck size={14} />}
        status={securityAnalysis?.ownershipRenounced ? "success" : "warning"}
      />

      {/* Wallet Type */}
      <MetricTile 
        label="Wallet Type" 
        value={getWalletType()} 
        tooltip="Multi-signature wallet or standard externally owned account"
        loading={loading}
        status={securityAnalysis?.isMultiSig ? "success" : "default"}
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
