import { Users, AlertCircle, MessageSquare, TrendingUp, Info } from "lucide-react";
import { TokenMetrics } from "@/hooks/useTokenMetrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CommunityMetricsSectionProps {
  metrics: TokenMetrics | undefined;
  isLoading: boolean;
  error: Error | null;
}

export const CommunityMetricsSection = ({
  metrics,
  isLoading,
  error
}: CommunityMetricsSectionProps) => {
  // Community score calculation
  const communityScore = metrics?.communityScore ?? 85;
  
  // Helper function to determine the status icon and color
  const getStatusInfo = (value?: string, type?: string) => {
    if (!value || value === "N/A" || value === "Unknown") {
      return { icon: <AlertCircle className="h-5 w-5 text-gray-400" />, color: "text-gray-400 bg-gray-100" };
    }
    
    // Social followers status
    if (type === "socialFollowers") {
      return { icon: <Users className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
    }
    
    // Verified account status
    if (type === "verifiedAccount") {
      return { icon: <Info className="h-5 w-5 text-green-500" />, color: "text-green-500 bg-green-50" };
    }
    
    // Growth rate status
    if (type === "growthRate") {
      return { icon: <TrendingUp className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
    }
    
    // Active channels status
    if (type === "activeChannels") {
      return { icon: <MessageSquare className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
    }
    
    // Team visibility status
    if (type === "teamVisibility") {
      return { icon: <Users className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
    }
    
    // Default return for "Coming Soon" or other values
    return { icon: <Users className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
  };
  
  // Function to get color based on community score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  // Helper for tooltip content
  const getTooltipContent = (type: string) => {
    switch (type) {
      case "socialFollowers":
        return "Total social media followers across platforms";
      case "verifiedAccount":
        return "Official verification status";
      case "growthRate":
        return "Rate of community growth";
      case "activeChannels":
        return "Number of active community channels";
      case "teamVisibility":
        return "Team engagement with community";
      default:
        return "No information available";
    }
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
        <p className="text-red-600">Error loading community data: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <h2 className="text-xl font-semibold">Community Analysis</h2>
        
        <div className="flex flex-col items-center">
          <div className="text-sm text-gray-500 mb-1">Community Score</div>
          <div className="w-full max-w-xs">
            <Progress value={communityScore} className={`h-2 ${getScoreColor(communityScore)}`} />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">0</span>
              <span className="text-xs font-medium">{communityScore}/100</span>
              <span className="text-xs text-gray-500">100</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Social Followers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo("Coming Soon", "socialFollowers").icon}
              Social Followers
            </CardTitle>
            <CardDescription className="text-xs">
              Total social media followers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo("Coming Soon", "socialFollowers").color}`}>
                    Coming Soon
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("socialFollowers")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="text-xs mt-2 text-gray-500">
              Social media analytics will be available in a future update.
            </p>
          </CardContent>
        </Card>
        
        {/* Verified Account */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo("Coming Soon", "verifiedAccount").icon}
              Verified Account
            </CardTitle>
            <CardDescription className="text-xs">
              Official account verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo("Coming Soon", "verifiedAccount").color}`}>
                    Coming Soon
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("verifiedAccount")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
        
        {/* Growth Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo("Coming Soon", "growthRate").icon}
              Growth Rate
            </CardTitle>
            <CardDescription className="text-xs">
              Follower growth rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo("Coming Soon", "growthRate").color}`}>
                    Coming Soon
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("growthRate")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
        
        {/* Active Channels */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo("Coming Soon", "activeChannels").icon}
              Active Channels
            </CardTitle>
            <CardDescription className="text-xs">
              Number of active community channels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo("Coming Soon", "activeChannels").color}`}>
                    Coming Soon
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("activeChannels")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
        
        {/* Team Visibility */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo("Coming Soon", "teamVisibility").icon}
              Team Visibility
            </CardTitle>
            <CardDescription className="text-xs">
              Team engagement with community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo("Coming Soon", "teamVisibility").color}`}>
                    Coming Soon
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("teamVisibility")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
