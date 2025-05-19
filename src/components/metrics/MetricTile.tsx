
import { ReactNode } from "react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { ArrowDownIcon, ArrowUpIcon, HelpCircleIcon } from "lucide-react";

interface MetricTileProps {
  label: string;
  value: string;
  trend?: "up" | "down";
  change?: string;
  tooltip?: string;
  error?: boolean;
  icon?: ReactNode;
  comingSoon?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}

export function MetricTile({
  label,
  value,
  trend,
  change,
  tooltip,
  error = false,
  icon,
  comingSoon = false,
  onClick,
  clickable = false
}: MetricTileProps) {
  const getValueColor = () => {
    if (error) return "text-gray-500";
    if (comingSoon) return "text-gray-500";
    if (value === "N/A") return "text-gray-500";
    return "text-gray-900";
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-green-600 bg-green-50";
    if (trend === "down") return "text-red-600 bg-red-50";
    return "text-gray-600 bg-gray-50";
  };

  const renderTrendIcon = () => {
    if (trend === "up") return <ArrowUpIcon className="h-3 w-3" />;
    if (trend === "down") return <ArrowDownIcon className="h-3 w-3" />;
    return null;
  };

  return (
    <div 
      className={`p-4 bg-white border rounded-md ${clickable ? 'cursor-pointer hover:border-blue-300 transition-colors' : ''}`}
      onClick={clickable ? onClick : undefined}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="ml-1.5">
                  <HelpCircleIcon className="h-3.5 w-3.5 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {icon && <div>{icon}</div>}
      </div>
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <span className={`text-lg font-semibold ${getValueColor()}`}>
            {value}
          </span>
        </div>
        {trend && change && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTrendColor()}`}>
            {renderTrendIcon()}
            <span>{change}</span>
          </div>
        )}
      </div>
      {clickable && (
        <div className="mt-1 text-xs text-blue-600">Click for details</div>
      )}
    </div>
  );
}

export function MetricTileSkeleton() {
  return (
    <div className="p-4 bg-white border rounded-md">
      <div className="mb-1 h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-7 w-28 mt-2 bg-gray-200 rounded animate-pulse"></div>
    </div>
  );
}
