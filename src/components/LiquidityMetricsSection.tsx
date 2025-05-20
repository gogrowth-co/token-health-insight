
import { TrendingUp, AlertCircle, DollarSign, Building, Users } from "lucide-react";
import { TokenMetrics } from "@/hooks/useTokenMetrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LiquidityMetricsSectionProps {
  metrics: TokenMetrics | undefined;
  isLoading: boolean;
  error: Error | null;
}

export const LiquidityMetricsSection = ({
  metrics,
  isLoading,
  error
}: LiquidityMetricsSectionProps) => {
  // Liquidity score calculation (basic implementation)
  const liquidityScore = metrics?.liquidityScore || 65;
  
  // Helper function to determine the status icon and color
  const getStatusInfo = (value?: string, type?: string) => {
    if (!value || value === "N/A" || value === "Unknown") {
      return { icon: <AlertCircle className="h-5 w-5 text-gray-400" />, color: "text-gray-400 bg-gray-100" };
    }
    
    // Market cap status
    if (type === "marketCap") {
      return { icon: <DollarSign className="h-5 w-5 text-green-500" />, color: "text-green-500 bg-green-50" };
    }
    
    // Liquidity lock status
    if (type === "liquidityLock") {
      if (value.includes("Yes") || value.includes("days")) {
        return { icon: <TrendingUp className="h-5 w-5 text-green-500" />, color: "text-green-500 bg-green-50" };
      }
      if (value === "Unlocked") {
        return { icon: <AlertCircle className="h-5 w-5 text-red-500" />, color: "text-red-500 bg-red-50" };
      }
      return { icon: <TrendingUp className="h-5 w-5 text-yellow-500" />, color: "text-yellow-500 bg-yellow-50" };
    }
    
    // DEX Depth status
    if (type === "dexDepth") {
      if (value === "Good") {
        return { icon: <TrendingUp className="h-5 w-5 text-green-500" />, color: "text-green-500 bg-green-50" };
      }
      if (value === "Moderate") {
        return { icon: <TrendingUp className="h-5 w-5 text-yellow-500" />, color: "text-yellow-500 bg-yellow-50" };
      }
      if (value === "Low") {
        return { icon: <AlertCircle className="h-5 w-5 text-red-500" />, color: "text-red-500 bg-red-50" };
      }
    }
    
    // CEX listings status
    if (type === "cexListings") {
      if (value === "Coming Soon") {
        return { icon: <Building className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
      }
    }
    
    // Holder distribution status
    if (type === "holderDistribution") {
      if (value === "Distributed") {
        return { icon: <Users className="h-5 w-5 text-green-500" />, color: "text-green-500 bg-green-50" };
      }
      if (value === "Moderate") {
        return { icon: <Users className="h-5 w-5 text-yellow-500" />, color: "text-yellow-500 bg-yellow-50" };
      }
      if (value === "Concentrated") {
        return { icon: <Users className="h-5 w-5 text-red-500" />, color: "text-red-500 bg-red-50" };
      }
    }
    
    // Default return for "Coming Soon" or other values
    return { icon: <TrendingUp className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
  };
  
  // Function to get color based on liquidity score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  // Format market cap with change percentage
  const getMarketCapWithChange = () => {
    if (!metrics?.marketCap || metrics.marketCap === "N/A") {
      return "N/A";
    }
    
    if (metrics.marketCapChange24h !== undefined) {
      const changeClass = metrics.marketCapChange24h > 0 ? "text-green-500" : "text-red-500";
      const changePrefix = metrics.marketCapChange24h > 0 ? "+" : "";
      return (
        <div className="flex items-center gap-2">
          <span>{metrics.marketCap}</span>
          <span className={`text-xs ${changeClass}`}>
            {changePrefix}{metrics.marketCapChange24h.toFixed(2)}%
          </span>
        </div>
      );
    }
    
    return metrics.marketCap;
  };
  
  // Format holder distribution based on percentage
  const getHolderDistributionStatus = () => {
    if (!metrics?.topHoldersValue || metrics.topHoldersValue === 0) {
      return "N/A";
    }
    
    if (metrics.topHoldersValue > 80) {
      return "Concentrated";
    } else if (metrics.topHoldersValue > 40) {
      return "Moderate";
    } else {
      return "Distributed";
    }
  };
  
  // Get DEX depth based on metrics (this would ideally come from the API)
  const getDexDepthStatus = () => {
    // This is a placeholder until we integrate with GeckoTerminal
    // In real implementation, we would calculate this from pool liquidity data
    return "Coming Soon";
  };
  
  // Format liquidity lock status
  const getLiquidityLockStatus = () => {
    if (!metrics?.liquidityLock || metrics.liquidityLock === "N/A") {
      return "N/A";
    }
    
    if (metrics.liquidityLockDays && metrics.liquidityLockDays > 0) {
      return `Yes (${metrics.liquidityLockDays} days)`;
    }
    
    if (metrics.liquidityLock === "Not Found") {
      return "Unlocked";
    }
    
    return metrics.liquidityLock;
  };
  
  // Helper for tooltip content
  const getTooltipContent = (type: string) => {
    switch (type) {
      case "marketCap":
        return "Total market capitalization of the token";
      case "liquidityLock":
        return "LP tokens lock status";
      case "dexDepth":
        return "Liquidity depth on decentralized exchanges";
      case "cexListings":
        return "Listed on centralized exchanges";
      case "holderDistribution":
        return "Distribution pattern of top holders";
      default:
        return "No information available";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <p className="text-red-600">Error loading liquidity data: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <h2 className="text-xl font-semibold">Liquidity Analysis</h2>
        
        <div className="flex flex-col items-center">
          <div className="text-sm text-gray-500 mb-1">Liquidity Score</div>
          <div className="w-full max-w-xs">
            <Progress value={liquidityScore} className={`h-2 ${getScoreColor(liquidityScore)}`} />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">0</span>
              <span className="text-xs font-medium">{liquidityScore}/100</span>
              <span className="text-xs text-gray-500">100</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Market Cap */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo(metrics?.marketCap, "marketCap").icon}
              Market Cap
            </CardTitle>
            <CardDescription className="text-xs">
              Total market capitalization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo(metrics?.marketCap, "marketCap").color}`}>
                    {getMarketCapWithChange()}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("marketCap")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
        
        {/* Liquidity Lock */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo(getLiquidityLockStatus(), "liquidityLock").icon}
              Liquidity Lock
            </CardTitle>
            <CardDescription className="text-xs">
              LP tokens lock status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo(getLiquidityLockStatus(), "liquidityLock").color}`}>
                    {getLiquidityLockStatus()}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("liquidityLock")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {metrics?.liquidityLock === "N/A" && (
              <p className="text-xs mt-2 text-gray-500">
                Liquidity lock information not available for this token or network.
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* DEX Depth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo(getDexDepthStatus(), "dexDepth").icon}
              DEX Depth
            </CardTitle>
            <CardDescription className="text-xs">
              Liquidity depth on decentralized exchanges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo(getDexDepthStatus(), "dexDepth").color}`}>
                    {getDexDepthStatus()}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("dexDepth")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {getDexDepthStatus() === "Coming Soon" && (
              <p className="text-xs mt-2 text-gray-500">
                DEX depth data will be available in a future update.
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* CEX Listings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo("Coming Soon", "cexListings").icon}
              CEX Listings
            </CardTitle>
            <CardDescription className="text-xs">
              Listed on centralized exchanges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo("Coming Soon", "cexListings").color}`}>
                    Coming Soon
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>CEX listing data will be integrated in a future update.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="text-xs mt-2 text-gray-500">
              CEX listing data will be integrated in a future update.
            </p>
          </CardContent>
        </Card>
        
        {/* Holder Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo(getHolderDistributionStatus(), "holderDistribution").icon}
              Holder Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of top token holders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo(getHolderDistributionStatus(), "holderDistribution").color}`}>
                    {metrics?.topHoldersPercentage || "N/A"}
                    {getHolderDistributionStatus() !== "N/A" && ` (${getHolderDistributionStatus()})`}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("holderDistribution")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {metrics?.topHoldersPercentage === "N/A" && (
              <p className="text-xs mt-2 text-gray-500">
                Holder distribution data not available for this token or network.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
