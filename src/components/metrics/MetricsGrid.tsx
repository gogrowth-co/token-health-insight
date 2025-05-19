
import { useEffect, useState } from "react";
import { Info, Clock, Database, Twitter, ExternalLink, Shield, DollarSign, Percent, Users, Link, FileText } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { MetricTile, MetricTileSkeleton } from "./MetricTile";
import { ErrorState } from "./ErrorState";
import { RefreshButton } from "./RefreshButton";
import { TokenMetrics } from "@/hooks/useTokenMetrics";
import { TopHoldersList } from "./TopHoldersList";

interface MetricsGridProps {
  metrics?: TokenMetrics;
  showSkeletons: boolean;
  isError: boolean;
  connectionError: boolean;
  metricsError: Error | null;
  isRefreshing: boolean;
  handleRefresh: () => Promise<void>;
  refetch: () => Promise<void>;
  contractAddress?: string;
  blockchain?: string;
}

export const MetricsGrid = ({ 
  metrics,
  showSkeletons,
  isError,
  connectionError,
  metricsError,
  isRefreshing,
  handleRefresh,
  refetch,
  contractAddress,
  blockchain
}: MetricsGridProps) => {
  const [showTopHolders, setShowTopHolders] = useState(false);
  
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
  
  // Toggle holders display
  const toggleTopHolders = () => {
    setShowTopHolders(!showTopHolders);
  };

  const hasHolderData = metrics?.topHolders && metrics.topHolders.length > 0;

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
        {/* Market Cap - from CoinGecko */}
        {showSkeletons ? (
          <MetricTileSkeleton />
        ) : (
          <MetricTile 
            label="Market Cap" 
            value={metrics?.marketCap || "N/A"} 
            trend={metrics?.marketCapChange24h && metrics.marketCapChange24h > 0 ? "up" : metrics?.marketCapChange24h ? "down" : undefined} 
            change={metrics?.marketCapChange24h ? `${Math.abs(metrics.marketCapChange24h).toFixed(1)}%` : undefined}
            tooltip="Total market value of circulating supply (CoinGecko)" 
            error={isError}
            icon={<DollarSign size={14} className="text-green-500" />}
          />
        )}

        {/* TVL - from CoinGecko */}
        {showSkeletons ? (
          <MetricTileSkeleton />
        ) : (
          <MetricTile 
            label="TVL" 
            value={metrics?.tvl || "N/A"} 
            trend={metrics?.tvlChange24h && metrics.tvlChange24h > 0 ? "up" : metrics?.tvlChange24h ? "down" : undefined}
            change={metrics?.tvlChange24h ? `${Math.abs(metrics.tvlChange24h).toFixed(1)}%` : undefined}
            tooltip="Total Value Locked in protocol (CoinGecko)" 
            error={isError}
            icon={<DollarSign size={14} className="text-blue-500" />}
          />
        )}

        {/* Current Price - from CoinGecko */}
        {showSkeletons ? (
          <MetricTileSkeleton />
        ) : (
          <MetricTile 
            label="Current Price" 
            value={metrics?.currentPrice ? `$${metrics.currentPrice.toFixed(2)}` : "N/A"} 
            trend={metrics?.priceChange24h && metrics.priceChange24h > 0 ? "up" : metrics?.priceChange24h ? "down" : undefined}
            change={metrics?.priceChange24h ? `${Math.abs(metrics.priceChange24h).toFixed(1)}%` : undefined}
            tooltip="Current token price in USD (CoinGecko)" 
            error={isError}
            icon={<DollarSign size={14} className="text-purple-500" />}
          />
        )}

        {/* Audit Status - from Etherscan */}
        {showSkeletons ? (
          <MetricTileSkeleton />
        ) : (
          <MetricTile 
            label="Audit Status" 
            value={metrics?.auditStatus || "N/A"} 
            tooltip="Contract verification status (Etherscan)" 
            error={isError}
            icon={<Shield size={14} className="text-purple-500" />}
          />
        )}

        {/* Top Holders % - from GoPlus */}
        {showSkeletons ? (
          <MetricTileSkeleton />
        ) : (
          <MetricTile 
            label="Top 10 Holders" 
            value={metrics?.topHoldersPercentage || "N/A"} 
            trend={metrics?.topHoldersTrend || undefined}
            change={metrics?.topHoldersTrend === "down" ? "Low Risk" : metrics?.topHoldersTrend === "up" ? "High Risk" : undefined}
            tooltip="Percentage owned by top 10 addresses (GoPlus)"
            error={isError}
            icon={<Users size={14} className="text-orange-500" />}
            onClick={toggleTopHolders}
            clickable={hasHolderData}
          />
        )}

        {/* Liquidity Lock - from Etherscan */}
        {showSkeletons ? (
          <MetricTileSkeleton />
        ) : (
          <MetricTile 
            label="Liquidity Lock" 
            value={metrics?.liquidityLock || "N/A"} 
            tooltip="Duration that liquidity is locked for (Etherscan)"
            error={isError}
            icon={<Clock size={14} className="text-yellow-500" />}
          />
        )}

        {/* Ownership Renounced - from GoPlus */}
        {showSkeletons ? (
          <MetricTileSkeleton />
        ) : (
          <MetricTile 
            label="Ownership Renounced" 
            value={metrics?.ownershipRenounced || "N/A"} 
            trend={metrics?.ownershipRenounced === "Yes" ? "down" : metrics?.ownershipRenounced === "No" ? "up" : undefined}
            change={metrics?.ownershipRenounced === "Yes" ? "Low Risk" : metrics?.ownershipRenounced === "No" ? "High Risk" : undefined}
            tooltip="Whether contract ownership has been renounced (GoPlus)"
            error={isError}
            icon={<Link size={14} className="text-indigo-500" />}
          />
        )}

        {/* Freeze Authority - from GoPlus */}
        {showSkeletons ? (
          <MetricTileSkeleton />
        ) : (
          <MetricTile 
            label="Freeze Authority" 
            value={metrics?.freezeAuthority || "N/A"} 
            trend={metrics?.freezeAuthority === "No" ? "down" : metrics?.freezeAuthority === "Yes" ? "up" : undefined}
            change={metrics?.freezeAuthority === "No" ? "Low Risk" : metrics?.freezeAuthority === "Yes" ? "High Risk" : undefined}
            tooltip="Ability to freeze/blacklist wallets (GoPlus)"
            error={isError}
            icon={<FileText size={14} className="text-red-500" />}
          />
        )}

        {/* Social Followers - Coming Soon */}
        {showSkeletons ? (
          <MetricTileSkeleton />
        ) : (
          <MetricTile 
            label="Social Followers" 
            value="Coming Soon" 
            trend={undefined}
            change={undefined}
            tooltip="Twitter followers count - Coming Soon" 
            error={isError}
            icon={<Twitter size={14} className="text-blue-400" />}
            comingSoon={true}
          />
        )}
      </div>
      
      {/* Top Holders Detail Section */}
      {showTopHolders && metrics?.topHolders && metrics.topHolders.length > 0 && (
        <TopHoldersList 
          holders={metrics.topHolders}
          totalPercentage={metrics.topHoldersPercentage || "N/A"}
          fromCache={metrics.fromCache}
          isLoading={showSkeletons}
          contractAddress={contractAddress}
          blockchain={blockchain}
        />
      )}
      
      {/* Data source information */}
      {!showSkeletons && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
          <Info size={14} />
          <span>
            Data sources: CoinGecko, Etherscan, GoPlus Security API. "N/A" indicates data is not available.
            {metrics?.fromCache && <span className="ml-1"><Database size={14} className="inline mr-1" /> indicates data from cache.</span>}
          </span>
        </div>
      )}
    </div>
  );
};
