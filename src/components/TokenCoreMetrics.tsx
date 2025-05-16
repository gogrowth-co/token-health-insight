
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTokenMetrics, formatTokenValue, TokenCoreMetrics } from "@/hooks/useTokenMetrics";
import { TrendingUp, TrendingDown, BarChart2, DollarSign, Database, Clock, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TokenCoreMetricsCardProps {
  contractAddress: string;
}

export const TokenCoreMetricsCard: React.FC<TokenCoreMetricsCardProps> = ({ contractAddress }) => {
  const { data, isLoading, error, refetch } = useTokenMetrics(contractAddress);
  
  if (isLoading) {
    return <TokenCoreMetricsLoading />;
  }
  
  if (error) {
    return <TokenCoreMetricsError error={error} onRetry={() => refetch()} />;
  }
  
  if (!data) {
    return <TokenCoreMetricsNotFound contractAddress={contractAddress} onRetry={() => refetch()} />;
  }
  
  return (
    <Card className="overflow-hidden bg-white">
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 border-b">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="text-xl font-bold">{data.name} ({data.symbol})</h3>
            <div className="text-sm text-gray-500 mt-1">
              {data.contractAddress.slice(0, 6)}...{data.contractAddress.slice(-4)}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <DataQualityBadge quality={data.dataQuality} />
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw size={14} className="mr-1" /> Refresh
            </Button>
          </div>
        </div>
      </div>
      
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <MetricItem
            icon={<DollarSign className="h-4 w-4 text-green-600" />}
            label="Price"
            value={formatTokenValue(data.price, 'price')}
            tooltip="Current token price in USD"
          />
          
          <MetricItem
            icon={<Database className="h-4 w-4 text-blue-600" />}
            label="Market Cap"
            value={formatTokenValue(data.marketCap, 'marketCap')}
            tooltip="Total market capitalization"
          />
          
          <MetricItem
            icon={<BarChart2 className="h-4 w-4 text-purple-600" />}
            label="24h Volume"
            value={formatTokenValue(data.volume24h, 'volume')}
            tooltip="Trading volume in the last 24 hours"
          />
          
          <MetricItem
            icon={<Database className="h-4 w-4 text-yellow-600" />}
            label="Supply"
            value={formatTokenValue(data.supply, 'supply')}
            tooltip="Circulating token supply"
          />
          
          <MetricItem
            icon={<Database className="h-4 w-4 text-cyan-600" />}
            label="Liquidity"
            value={formatTokenValue(data.liquidityUSD, 'marketCap')}
            tooltip="Total liquidity locked in pools"
          />
          
          <MetricItem
            icon={<BarChart2 className="h-4 w-4 text-indigo-600" />}
            label="DEX Volume"
            value={formatTokenValue(data.dexVolume24h, 'volume')}
            tooltip="DEX trading volume in the last 24 hours"
          />
        </div>
        
        {data.tvlSparkline && (
          <div className="mt-4 pt-2 border-t">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium text-gray-600">TVL Trend (30d)</div>
              <div className="flex items-center space-x-1">
                {data.tvlSparkline.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-xs font-medium ${
                  data.tvlSparkline.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatTokenValue(data.tvlSparkline.change, 'percent')}
                </span>
              </div>
            </div>
            
            <div className="h-12 w-full">
              <SparklineChart data={data.tvlSparkline.data} trend={data.tvlSparkline.trend} />
            </div>
          </div>
        )}
        
        <div className="mt-4 pt-2 border-t flex items-center justify-between">
          <div className="text-xs text-gray-500">
            <Clock size={12} className="inline mr-1" />
            Updated {new Date(data.scannedAt).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            Sources: {data.dataSources.join(', ')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  tooltip?: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ icon, label, value, tooltip }) => {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-sm font-medium text-gray-700">{label}</div>
      </div>
      <div className="flex items-center">
        <div className="text-sm font-bold">{value}</div>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={14} className="text-gray-400 ml-1 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

// Simplified sparkline chart component
const SparklineChart: React.FC<{ data: number[], trend: 'up' | 'down' }> = ({ data, trend }) => {
  const color = trend === 'up' ? '#10b981' : '#ef4444';
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = range === 0 ? 50 : 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

interface DataQualityBadgeProps {
  quality: "complete" | "partial" | "minimal";
}

const DataQualityBadge: React.FC<DataQualityBadgeProps> = ({ quality }) => {
  switch (quality) {
    case "complete":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Complete Data</Badge>;
    case "partial":
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Partial Data</Badge>;
    case "minimal":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Minimal Data</Badge>;
    default:
      return null;
  }
};

// Loading state component
const TokenCoreMetricsLoading = () => (
  <Card className="overflow-hidden bg-white">
    <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 border-b">
      <Skeleton className="h-6 w-1/3 mb-2" />
      <Skeleton className="h-4 w-1/4" />
    </div>
    
    <CardContent className="pt-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-md" />
        ))}
      </div>
      
      <div className="mt-4 pt-2 border-t">
        <Skeleton className="h-4 w-1/4 mb-2" />
        <Skeleton className="h-12 w-full" />
      </div>
      
      <div className="mt-4 pt-2 border-t">
        <Skeleton className="h-4 w-full" />
      </div>
    </CardContent>
  </Card>
);

// Error state component
interface TokenCoreMetricsErrorProps {
  error: string;
  onRetry: () => void;
}

const TokenCoreMetricsError: React.FC<TokenCoreMetricsErrorProps> = ({ error, onRetry }) => (
  <Card className="overflow-hidden bg-white">
    <div className="p-6 text-center">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Token Data</h3>
      <p className="text-sm text-gray-600 mb-4">{error}</p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw size={14} className="mr-2" /> Try Again
      </Button>
    </div>
  </Card>
);

// Not found state component
interface TokenCoreMetricsNotFoundProps {
  contractAddress: string;
  onRetry: () => void;
}

const TokenCoreMetricsNotFound: React.FC<TokenCoreMetricsNotFoundProps> = ({ contractAddress, onRetry }) => (
  <Card className="overflow-hidden bg-white">
    <div className="p-6 text-center">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
        <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Token Not Found</h3>
      <p className="text-sm text-gray-600 mb-2">
        We couldn't find data for the contract:
      </p>
      <code className="text-xs bg-gray-100 rounded px-2 py-1 mb-4 inline-block">
        {contractAddress}
      </code>
      <div>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw size={14} className="mr-2" /> Try Again
        </Button>
      </div>
    </div>
  </Card>
);

export default TokenCoreMetricsCard;
