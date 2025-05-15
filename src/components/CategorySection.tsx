
import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleHelp, CircleCheck, CircleX, CircleDot, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SparklineChart } from "./SparklineChart";

interface CategorySectionProps {
  title: string;
  icon: ReactNode;
  description: string;
  score: number;
  items: {
    name: string;
    status: string;
    tooltip: string;
    sparklineData?: number[];
    change?: number;
    trend?: 'up' | 'down' | 'neutral'; // Added trend property
  }[];
}

export const CategorySection = ({ 
  title, 
  icon, 
  description, 
  score, 
  items 
}: CategorySectionProps) => {
  // Get status color
  const getStatusColor = (status: string) => {
    if (status.toLowerCase().includes("yes") || status.toLowerCase().includes("good") || status.toLowerCase().includes("high")) {
      return "bg-green-100 text-green-800 border-green-200";
    }
    if (status.toLowerCase().includes("no") || status.toLowerCase().includes("risk") || status.toLowerCase().includes("low")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (status.toLowerCase().includes("partial") || status.toLowerCase().includes("moderate")) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
    return "bg-blue-100 text-blue-800 border-blue-200";
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    if (status.toLowerCase().includes("yes") || status.toLowerCase().includes("good") || status.toLowerCase().includes("high")) {
      return <CircleCheck className="h-4 w-4" />;
    }
    if (status.toLowerCase().includes("no") || status.toLowerCase().includes("risk") || status.toLowerCase().includes("low")) {
      return <CircleX className="h-4 w-4" />;
    }
    if (status.toLowerCase().includes("partial") || status.toLowerCase().includes("moderate")) {
      return <CircleDot className="h-4 w-4" />;
    }
    return null;
  };

  // Format change percentage
  const formatChange = (change?: number): string => {
    if (change === undefined) return "";
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };
  
  // Get trend icon based on trend property
  const getTrendIcon = (item: CategorySectionProps['items'][0]) => {
    // If trend is explicitly defined, use it
    if (item.trend === 'up') {
      return <TrendingUp size={12} className="inline mr-1" />;
    } else if (item.trend === 'down') {
      return <TrendingDown size={12} className="inline mr-1" />;
    } 
    // Fall back to using change value if trend isn't specified
    else if (item.change !== undefined) {
      return item.change >= 0 ? 
        <TrendingUp size={12} className="inline mr-1" /> : 
        <TrendingDown size={12} className="inline mr-1" />;
    }
    
    return null;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-brand-purple/10 text-brand-purple">
            {icon}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-gray-500">{description}</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-gray-100 rounded-full font-medium">
          Score: {score}/100
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <Card key={index} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded-full ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)}
                  </div>
                  <span className="font-medium">{item.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {item.sparklineData && item.sparklineData.length > 1 && (
                      <SparklineChart 
                        data={item.sparklineData}
                        color={item.change && item.change >= 0 ? "#22c55e" : "#ef4444"}
                        height={16}
                        width={40}
                      />
                    )}
                    
                    {(item.change !== undefined || item.trend) && (
                      <span className={`text-xs ml-1 ${
                        item.trend === 'down' ? "text-red-500" : 
                        item.trend === 'up' ? "text-green-500" : 
                        item.change !== undefined ? (item.change >= 0 ? "text-green-500" : "text-red-500") : 
                        "text-gray-500"
                      }`}>
                        {getTrendIcon(item)}
                        {formatChange(item.change)}
                      </span>
                    )}
                  </div>
                  
                  <Badge variant="outline" className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-gray-400 hover:text-gray-600">
                          <CircleHelp size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">{item.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Pro CTA specific to the section */}
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Unlock additional {title.toLowerCase()} insights with Pro
          </p>
          <Badge variant="outline" className="cursor-pointer bg-brand-purple text-white hover:bg-brand-purple/90">
            Upgrade
          </Badge>
        </div>
      </div>
    </div>
  );
};
