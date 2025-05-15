
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { CircleHelp, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MetricQualityBadge } from "@/components/MetricQualityBadge";

export const KeyMetricsGrid = ({ 
  projectData, 
  tokenId, 
  onDataUpdate 
}: { 
  projectData: any, 
  tokenId: string,
  onDataUpdate?: (updatedData: any) => void
}) => {
  const [refreshingData, setRefreshingData] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  
  const formatValue = (value: string | number | undefined) => {
    if (value === undefined) return "N/A";
    return typeof value === 'number' ? value.toLocaleString() : value;
  };
  
  const handleRefresh = async () => {
    setRefreshingData(true);
    setRefreshError(null);
    
    try {
      const { data } = await supabase.functions.invoke('scan-token', {
        body: { tokenId },
      });
      
      if (data && onDataUpdate) {
        setRefreshError(null);
        setRefreshingData(false);
        const updatedData = data as any; // Type assertion here
        
        // Update the metrics with the latest data using the callback
        onDataUpdate({
          ...projectData,
          marketCap: updatedData.marketCap,
          topHoldersPercentage: updatedData.topHoldersPercentage,
          tvl: updatedData.tvl,
          auditStatus: updatedData.auditStatus,
          categories: updatedData.categories,
          healthScore: updatedData.healthScore,
          socialFollowers: updatedData.socialFollowers,
          tvlSparkline: updatedData.tvlSparkline,
          defiLlama: updatedData.defiLlama,
          etherscan: updatedData.etherscan,
          twitter: updatedData.twitter,
          goPlus: updatedData.goPlus,
          dataQuality: updatedData.dataQuality
        });
      }
    } catch (error) {
      setRefreshingData(false);
      setRefreshError("Failed to refresh data. Please try again.");
      console.error("Error refreshing data:", error);
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    tooltip,
    isHighValue = false
  }: { 
    title: string; 
    value: string | number | undefined;
    tooltip: string;
    isHighValue?: boolean;
  }) => {
    const formattedValue = formatValue(value);
    
    return (
      <Card className="border border-gray-200 h-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm text-gray-600">{title}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-gray-400 hover:text-gray-600">
                    <CircleHelp size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className={`font-bold mt-2 ${isHighValue ? 'text-xl' : 'text-lg'}`}>
            {formattedValue}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Key Metrics</h3>
          <MetricQualityBadge quality={projectData.dataQuality || "partial"} />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshingData}
        >
          {refreshingData ? (
            <>Updating<span className="loading">...</span></>
          ) : (
            <>Update Metrics <RefreshCw size={14} className="ml-1" /></>
          )}
        </Button>
      </div>
      
      {refreshError && (
        <div className="bg-red-50 text-red-700 px-3 py-2 rounded mb-3 text-sm">
          {refreshError}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Market Cap */}
        <MetricCard 
          title="Market Cap" 
          value={projectData.marketCap} 
          tooltip="Total market value of the token in circulation."
          isHighValue={true}
        />
        
        {/* Liquidity Lock */}
        <MetricCard 
          title="Liquidity Lock" 
          value={projectData.liquidityLock} 
          tooltip="Duration for which the token's liquidity is locked in a pool."
        />
        
        {/* Top Holders */}
        <MetricCard 
          title="Top Holders" 
          value={projectData.topHoldersPercentage} 
          tooltip="Percentage of tokens held by the top wallet holders."
        />
        
        {/* TVL */}
        <MetricCard 
          title="TVL" 
          value={projectData.tvl} 
          tooltip="Total Value Locked in the protocol."
          isHighValue={true}
        />
        
        {/* Audit Status */}
        <div className="border border-gray-200 rounded-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-gray-600">Audit Status</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-gray-400 hover:text-gray-600">
                      <CircleHelp size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      Status of the security audit for the token's smart contract.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-sm font-medium">
                {projectData.auditStatus || 'Unknown'}
              </Badge>
            </div>
          </CardContent>
        </div>
        
        {/* Social Followers */}
        <MetricCard 
          title="Social Followers" 
          value={projectData.socialFollowers} 
          tooltip="Number of followers across social media platforms."
        />
      </div>
    </div>
  );
};
