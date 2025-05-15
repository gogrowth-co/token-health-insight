
import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleHelp, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { MetricQualityBadge } from "@/components/MetricQualityBadge";

interface CategoryItem {
  name: string;
  status: string | number;
  tooltip?: string;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
}

interface CategorySectionProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  score: number;
  items: CategoryItem[];
  fullWidth?: boolean;
}

export const CategorySection = ({ 
  title, 
  icon, 
  description, 
  score,
  items = [],
  fullWidth = false,
}: CategorySectionProps) => {
  const getScoreColor = () => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === 'up') {
      return <TrendingUp size={16} className="text-green-600" />;
    } else if (trend === 'down') {
      return <TrendingDown size={16} className="text-red-600" />;
    } else {
      return <Minus size={16} className="text-gray-600" />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6 px-6">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-slate-100 rounded-md">
            {icon}
          </div>
          <div>
            <h3 className="font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`rounded-full px-3 py-1 text-sm font-semibold ${getScoreColor()}`}>
            {score}/100
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className={`grid ${fullWidth ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
          {items.map((item, index) => (
            <div key={index} className="flex items-start justify-between py-2 border-t border-gray-100">
              <div className="flex flex-col">
                <div className="flex items-center space-x-1">
                  <span className="font-medium">{item.name}</span>
                  {item.tooltip && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-gray-400 hover:text-gray-600">
                            <CircleHelp size={12} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs">
                            {item.tooltip}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <span className="text-sm text-gray-600">{item.status}</span>
              </div>
              {item.trend && (
                <div className="ml-auto">
                  {getTrendIcon(item.trend)}
                </div>
              )}
              {item.change !== undefined && (
                <div className={`ml-auto text-sm font-medium ${Number(item.change) > 0 ? 'text-green-600' : Number(item.change) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {Number(item.change) > 0 && '+'}
                  {item.change.toString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
