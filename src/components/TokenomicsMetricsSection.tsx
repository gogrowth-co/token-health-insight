
import { CircleDot, AlertCircle, DollarSign, BarChart, Infinity, PieChart, TrendingUp } from "lucide-react";
import { TokenMetrics } from "@/hooks/useTokenMetrics";
import { TokenomicsData } from "@/hooks/useTokenonomics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TokenomicsMetricsSectionProps {
  metrics?: TokenomicsData | TokenMetrics;
  isLoading: boolean;
  error: Error | null;
}

export const TokenomicsMetricsSection = ({
  metrics,
  isLoading,
  error
}: TokenomicsMetricsSectionProps) => {
  // Tokenomics score calculation
  const tokenomicsScore = metrics?.tokenomicsScore ?? 65;
  
  // Helper function to determine the status icon and color
  const getStatusInfo = (value?: string, type?: string) => {
    if (!value || value === "N/A" || value === "Unknown") {
      return { icon: <AlertCircle className="h-5 w-5 text-gray-400" />, color: "text-gray-400 bg-gray-100" };
    }
    
    // TVL status
    if (type === "tvl") {
      return { icon: <DollarSign className="h-5 w-5 text-green-500" />, color: "text-green-500 bg-green-50" };
    }
    
    // Supply Cap status
    if (type === "supplyCap") {
      return { icon: <Infinity className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
    }

    // Token Distribution status
    if (type === "tokenDistribution") {
      const rating = 'tokenDistributionRating' in metrics ? metrics.tokenDistributionRating : undefined;
      if (rating === "Good") {
        return { icon: <PieChart className="h-5 w-5 text-green-500" />, color: "text-green-500 bg-green-50" };
      } else if (rating === "Moderate") {
        return { icon: <PieChart className="h-5 w-5 text-yellow-500" />, color: "text-yellow-500 bg-yellow-50" };
      } else if (rating === "Poor") {
        return { icon: <PieChart className="h-5 w-5 text-red-500" />, color: "text-red-500 bg-red-50" };
      }
      return { icon: <PieChart className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
    }
    
    // Treasury Size status
    if (type === "treasurySize") {
      return { icon: <TrendingUp className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
    }

    // Burn Mechanism status
    if (type === "burnMechanism") {
      if (value === "Yes") {
        return { icon: <CircleDot className="h-5 w-5 text-green-500" />, color: "text-green-500 bg-green-50" };
      } else if (value === "No") {
        return { icon: <CircleDot className="h-5 w-5 text-red-500" />, color: "text-red-500 bg-red-50" };
      }
      return { icon: <CircleDot className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
    }
    
    // Other tokenomics metrics
    return { icon: <CircleDot className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
  };
  
  // Function to get color based on tokenomics score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  // Helper for tooltip content
  const getTooltipContent = (type: string) => {
    switch (type) {
      case "tvl":
        return "Total Value Locked in the protocol";
      case "supplyCap":
        return "Maximum possible token supply";
      case "tokenDistribution":
        return "How tokens are distributed across stakeholders";
      case "treasurySize":
        return "Size of the project's treasury holdings";
      case "burnMechanism":
        return "Token burn mechanism details";
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
        <p className="text-red-600">Error loading tokenomics data: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <h2 className="text-xl font-semibold">Tokenomics Analysis</h2>
        
        <div className="flex flex-col items-center">
          <div className="text-sm text-gray-500 mb-1">Tokenomics Score</div>
          <div className="w-full max-w-xs">
            <Progress value={tokenomicsScore} className={`h-2 ${getScoreColor(tokenomicsScore)}`} />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">0</span>
              <span className="text-xs font-medium">{tokenomicsScore}/100</span>
              <span className="text-xs text-gray-500">100</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* TVL */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo(metrics?.tvl, "tvl").icon}
              TVL
            </CardTitle>
            <CardDescription className="text-xs">
              Total Value Locked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo(metrics?.tvl, "tvl").color}`}>
                    {metrics?.tvl || "N/A"}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("tvl")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {'tvlChange24h' in metrics && metrics.tvlChange24h ? (
              <div className="mt-2">
                <span className={`text-xs ${metrics.tvlChange24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metrics.tvlChange24h > 0 ? '+' : ''}{metrics.tvlChange24h.toFixed(2)}% (24h)
                </span>
              </div>
            ) : null}
          </CardContent>
        </Card>
        
        {/* Supply Cap */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo(metrics?.supplyCap, "supplyCap").icon}
              Supply Cap
            </CardTitle>
            <CardDescription className="text-xs">
              Maximum supply cap
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo("Coming Soon", "supplyCap").color}`}>
                    Coming Soon
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("supplyCap")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {'supplyCapExists' in metrics && metrics.supplyCapExists === false && (
              <p className="text-xs mt-2 text-gray-500">
                No supply cap found for this token.
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Token Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo(metrics?.tokenDistribution, "tokenDistribution").icon}
              Token Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Top holder concentration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo("Coming Soon", "tokenDistribution").color}`}>
                    Coming Soon
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("tokenDistribution")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {'tokenDistributionRating' in metrics && metrics.tokenDistributionRating !== "N/A" && (
              <p className="text-xs mt-2 text-gray-500">
                {metrics.tokenDistributionRating === "Good" ? "Well distributed among holders" : 
                 metrics.tokenDistributionRating === "Poor" ? "Highly concentrated among top holders" :
                 "Moderately distributed among holders"}
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Treasury Size */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo(metrics?.treasurySize, "treasurySize").icon}
              Treasury Size
            </CardTitle>
            <CardDescription className="text-xs">
              Project treasury holdings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo("Coming Soon", "treasurySize").color}`}>
                    Coming Soon
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("treasurySize")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="text-xs mt-2 text-gray-500">
              Data currently unavailable from direct API sources.
            </p>
          </CardContent>
        </Card>
        
        {/* Burn Mechanism */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo(metrics?.burnMechanism, "burnMechanism").icon}
              Burn Mechanism
            </CardTitle>
            <CardDescription className="text-xs">
              Token burn mechanism
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo("Coming Soon", "burnMechanism").color}`}>
                    Coming Soon
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("burnMechanism")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {'burnMechanism' in metrics && metrics.burnMechanism === "Yes" && (
              <p className="text-xs mt-2 text-gray-500">
                This token has a verifiable burn mechanism.
              </p>
            )}
            {'burnMechanism' in metrics && metrics.burnMechanism === "No" && (
              <p className="text-xs mt-2 text-gray-500">
                No burn mechanism detected in contract.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
