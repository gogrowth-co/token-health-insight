
import { CircleDot } from "lucide-react";
import { TokenMetrics } from "@/hooks/useTokenMetrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { withFallback, isDataMissing, getTooltipText } from "@/utils/dataHelpers";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TokenomicsMetricsSectionProps {
  metrics: TokenMetrics | undefined;
  isLoading: boolean;
  error: Error | null;
}

export const TokenomicsMetricsSection = ({
  metrics,
  isLoading,
  error
}: TokenomicsMetricsSectionProps) => {
  // Tokenomics score calculation
  const tokenomicsScore = metrics?.tokenomicsScore || 65;
  
  // Helper function to determine the metric status icon and color
  const getMetricStatus = (value?: string) => {
    if (isDataMissing(value)) {
      return "text-gray-400 bg-gray-100";
    }
    
    return "text-blue-500 bg-blue-50";
  };
  
  // Function to get color based on tokenomics score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
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
        {/* TVL (Total Value Locked) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CircleDot className="h-5 w-5 text-blue-500" />
              TVL (Total Value Locked)
            </CardTitle>
            <CardDescription className="text-xs">
              Total value locked in the token's ecosystem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getMetricStatus(metrics?.tvl)}`}>
                    {withFallback(metrics?.tvl)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipText(metrics?.tvl)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {!isDataMissing(metrics?.tvl) && (
              <p className="text-xs mt-2 text-gray-500">
                {metrics?.tvlChange24h && (
                  <span>
                    {metrics.tvlChange24h > 0 ? "Up" : "Down"} {Math.abs(metrics.tvlChange24h)}% in the last 24h
                  </span>
                )}
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Supply Cap */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CircleDot className="h-5 w-5 text-blue-500" />
              Supply Cap
            </CardTitle>
            <CardDescription className="text-xs">
              Maximum token supply limit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getMetricStatus(metrics?.supplyCap)}`}>
                    {withFallback(metrics?.supplyCap)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipText(metrics?.supplyCap)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {!isDataMissing(metrics?.supplyCap) && (
              <p className="text-xs mt-2 text-gray-500">
                {metrics?.supplyCapExists ? "Capped supply" : "Uncapped supply"}
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Token Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CircleDot className="h-5 w-5 text-blue-500" />
              Token Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of tokens among holders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getMetricStatus(metrics?.tokenDistributionRating)}`}>
                    {withFallback(metrics?.tokenDistributionRating)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipText(metrics?.tokenDistribution)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {!isDataMissing(metrics?.tokenDistribution) && (
              <p className="text-xs mt-2 text-gray-500">
                {metrics?.tokenDistributionValue && (
                  <span>
                    {metrics.tokenDistributionValue > 0.5 ? "Good distribution" : "Concentrated holdings"}
                  </span>
                )}
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Burn Mechanism */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CircleDot className="h-5 w-5 text-blue-500" />
              Burn Mechanism
            </CardTitle>
            <CardDescription className="text-xs">
              Token burning or deflationary mechanisms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getMetricStatus(metrics?.burnMechanism)}`}>
                    {metrics?.burnMechanism || "N/A"}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipText(metrics?.burnMechanism)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {metrics?.burnMechanism === "Yes" && (
              <p className="text-xs mt-2 text-gray-500">
                Token burning mechanism in place.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Treasury Size */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CircleDot className="h-5 w-5 text-blue-500" />
              Treasury Size
            </CardTitle>
            <CardDescription className="text-xs">
              Size of the project's treasury
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getMetricStatus(metrics?.treasurySize)}`}>
                    {metrics?.treasurySizeFormatted || withFallback(metrics?.treasurySize)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipText(metrics?.treasurySize)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {!isDataMissing(metrics?.treasurySize) && (
              <p className="text-xs mt-2 text-gray-500">
                {metrics?.treasurySizeValue && (
                  <span>
                    Treasury holds significant assets.
                  </span>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
