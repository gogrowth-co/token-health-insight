
import { useEffect, useState } from "react";
import { TokenMetrics } from "@/hooks/useTokenMetrics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertCircle } from "lucide-react";
import { ErrorState } from "./ErrorState";
import { withFallback } from "@/utils/dataHelpers";

interface MetricsGridProps {
  metrics?: TokenMetrics;
  showSkeletons?: boolean;
  isError?: boolean;
  connectionError?: boolean;
  metricsError?: Error | null;
  isRefreshing?: boolean;
  handleRefresh: () => Promise<void>;
  refetch: () => Promise<void>;
  contractAddress?: string;
  blockchain?: string;
}

export const MetricsGrid = ({
  metrics,
  showSkeletons = false,
  isError = false,
  connectionError = false,
  metricsError = null,
  isRefreshing = false,
  handleRefresh,
  refetch,
  contractAddress = "",
  blockchain = "ethereum"
}: MetricsGridProps) => {
  const [showHolders, setShowHolders] = useState(false);
  
  // Don't have access to topHolders if no metrics
  const hasTopHoldersData = metrics?.topHolders && metrics.topHolders.length > 0;

  // Reset holders state when metrics change
  useEffect(() => {
    if (!hasTopHoldersData) {
      setShowHolders(false);
    }
  }, [hasTopHoldersData]);
  
  // If there's an error, show error state
  if (isError && metricsError) {
    return (
      <ErrorState 
        title="Failed to load metrics" 
        error={metricsError}
        isConnectionError={connectionError}
        refetch={refetch}
      />
    );
  }
  
  // If we are loading, show skeleton UI
  if (showSkeletons) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-14 bg-gray-100 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Token Metrics</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Market Cap */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Market Cap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-xl">{withFallback(metrics?.marketCapFormatted)}</div>
            {!isNaN(Number(metrics?.marketCapChange24h)) && metrics?.marketCapChange24h !== 0 && (
              <div className={`text-sm ${Number(metrics?.marketCapChange24h) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Number(metrics?.marketCapChange24h) > 0 ? '↑' : '↓'} {Math.abs(Number(metrics?.marketCapChange24h)).toFixed(2)}% (24h)
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Total Value Locked */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Value Locked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-xl">{withFallback(metrics?.tvl)}</div>
          </CardContent>
        </Card>
        
        {/* Security Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Security Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="font-semibold text-xl">{withFallback(metrics?.securityScore)}/100</div>
              <Badge 
                variant="outline" 
                className={`ml-2 ${metrics?.securityScore && metrics.securityScore > 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
              >
                {metrics?.securityScore && metrics.securityScore > 70 ? 'Secure' : 'Moderate'}
              </Badge>
            </div>
            <div className="text-sm mt-1">
              Audit: {withFallback(metrics?.auditStatus)}
            </div>
          </CardContent>
        </Card>
        
        {/* Top Holders */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Holders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-xl">{withFallback(metrics?.topHoldersPercentage)}</div>
            {withFallback(metrics?.topHoldersTrend) !== "N/A" && (
              <div className={`text-sm ${metrics?.topHoldersTrend === "down" ? 'text-green-500' : 'text-yellow-500'}`}>
                {metrics?.topHoldersTrend === "down" ? '↓ Decreasing' : '↑ Increasing'} concentration
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Liquidity Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Liquidity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-xl">{withFallback(metrics?.liquidityScore)}/100</div>
            <div className="text-sm mt-1">
              {withFallback(metrics?.liquidityLock)}
              {metrics?.liquidityLockDays === 0 && (
                <Badge variant="outline" className="ml-2 bg-red-100 text-red-800">
                  Not locked
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Development Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Development</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-xl">{withFallback(metrics?.developmentScore)}/100</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {metrics?.githubCommits !== undefined && metrics.githubCommits > 0 ? (
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {metrics.githubCommits} commits
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-100 text-gray-500">
                  No GitHub data
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Warning if no metrics received */}
      {(!metrics || Object.keys(metrics).length === 0) && (
        <div className="flex items-center justify-center p-4 bg-yellow-50 border border-yellow-100 rounded-md text-yellow-800 mb-4">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p>No token metrics available. Try refreshing or check the token address.</p>
        </div>
      )}
    </div>
  );
};
