
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleHelp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
          goPlus: updatedData.goPlus
        });
      }
    } catch (error) {
      setRefreshingData(false);
      setRefreshError("Failed to refresh data. Please try again.");
      console.error("Error refreshing data:", error);
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Market Cap */}
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Market Cap</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-gray-400 hover:text-gray-600">
                    <CircleHelp size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Total market value of the token in circulation.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-2xl font-bold mt-2">{formatValue(projectData.marketCap)}</div>
        </CardContent>
      </Card>
      
      {/* Liquidity Lock */}
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Liquidity Lock</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-gray-400 hover:text-gray-600">
                    <CircleHelp size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Duration for which the token's liquidity is locked in a pool.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-2xl font-bold mt-2">{formatValue(projectData.liquidityLock)}</div>
        </CardContent>
      </Card>
      
      {/* Top Holders */}
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Top Holders</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-gray-400 hover:text-gray-600">
                    <CircleHelp size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Percentage of tokens held by the top holders.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-2xl font-bold mt-2">{formatValue(projectData.topHoldersPercentage)}</div>
        </CardContent>
      </Card>
      
      {/* TVL */}
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">TVL</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-gray-400 hover:text-gray-600">
                    <CircleHelp size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Total Value Locked in the protocol.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-2xl font-bold mt-2">{formatValue(projectData.tvl)}</div>
        </CardContent>
      </Card>
      
      {/* Audit Status */}
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Audit Status</span>
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
              {projectData.auditStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      {/* Social Followers */}
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Social Followers</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-gray-400 hover:text-gray-600">
                    <CircleHelp size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Number of followers across social media platforms.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-2xl font-bold mt-2">{formatValue(projectData.socialFollowers)}</div>
        </CardContent>
      </Card>
    </div>
  );
};

