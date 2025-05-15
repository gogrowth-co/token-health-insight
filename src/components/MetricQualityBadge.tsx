
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface MetricQualityBadgeProps {
  quality: 'complete' | 'partial';
  className?: string;
}

export const MetricQualityBadge = ({ quality, className = "" }: MetricQualityBadgeProps) => {
  if (quality === 'complete') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge className={`bg-green-100 hover:bg-green-200 text-green-800 flex items-center gap-1 ${className}`}>
              <CheckCircle2 className="h-3 w-3" />
              <span>Verified Data</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>This analysis is based on verified on-chain data.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge className={`bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center gap-1 ${className}`}>
            <AlertCircle className="h-3 w-3" />
            <span>Partial Data</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Some metrics are estimations due to limited on-chain data availability.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
