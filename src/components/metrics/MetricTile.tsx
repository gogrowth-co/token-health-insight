
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricTileProps {
  label: string;
  value: string;
  trend?: "up" | "down";
  change?: string;
  tooltip: string;
  error?: boolean;
  icon?: React.ReactNode;
}

export const MetricTile = ({ label, value, trend, change, tooltip, error = false, icon }: MetricTileProps) => {
  return (
    <Card className={`overflow-hidden ${error ? 'border-red-200 bg-red-50/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <p className="text-sm text-gray-500">{label}</p>
                  {icon && icon}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {trend && change && (
            <div className={`flex items-center text-xs ${trend === "up" ? (label === "Top 10 Holders" ? "text-red-500" : "text-green-500") : (label === "Top 10 Holders" ? "text-green-500" : "text-red-500")}`}>
              {trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="ml-1">{change}</span>
            </div>
          )}
        </div>
        
        <h3 className={`text-2xl font-bold mt-1 ${value === "N/A" ? "text-gray-400" : ""}`}>
          {value}
        </h3>
      </CardContent>
    </Card>
  );
};

export const MetricTileSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-10" />
      </div>
      <Skeleton className="h-8 w-32 mt-2" />
    </CardContent>
  </Card>
);
