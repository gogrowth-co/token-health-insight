import { FileCode, AlertCircle, Github, Calendar, Info, Code, Users } from "lucide-react";
import { TokenMetrics } from "@/hooks/useTokenMetrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DevelopmentMetricsSectionProps {
  metrics: TokenMetrics | undefined;
  isLoading: boolean;
  error: Error | null;
}

export const DevelopmentMetricsSection = ({
  metrics,
  isLoading,
  error
}: DevelopmentMetricsSectionProps) => {
  // Development score calculation
  const developmentScore = metrics?.developmentScore ?? 70;
  
  // Helper function to determine the status icon and color
  const getStatusInfo = (value?: string, type?: string) => {
    if (!value || value === "N/A" || value === "Unknown") {
      return { icon: <AlertCircle className="h-5 w-5 text-gray-400" />, color: "text-gray-400 bg-gray-100" };
    }
    
    // GitHub activity status
    if (type === "githubActivity") {
      return { icon: <Github className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
    }
    
    // Last commit date status
    if (type === "lastCommitDate") {
      return { icon: <Calendar className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
    }
    
    // Commit frequency status
    if (type === "commitFrequency") {
      return { icon: <FileCode className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
    }
    
    // Roadmap progress status
    if (type === "roadmapProgress") {
      return { icon: <Info className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
    }
    
    // Contributors count status
    if (type === "contributorsCount") {
      return { icon: <Users className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
    }
    
    // Open source status
    if (type === "openSource") {
      return { icon: <Code className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
    }
    
    // Default return for "Coming Soon" or other values
    return { icon: <FileCode className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
  };
  
  // Function to get color based on development score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  // Helper for tooltip content
  const getTooltipContent = (type: string) => {
    switch (type) {
      case "githubActivity":
        return "Code repository activity";
      case "lastCommitDate":
        return "Most recent code commit";
      case "commitFrequency":
        return "Regular code contributions";
      case "roadmapProgress":
        return "Development progress on roadmap";
      case "contributorsCount":
        return "Number of active code contributors";
      case "openSource":
        return "Open source status";
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
        <p className="text-red-600">Error loading development data: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <h2 className="text-xl font-semibold">Development Analysis</h2>
        
        <div className="flex flex-col items-center">
          <div className="text-sm text-gray-500 mb-1">Development Score</div>
          <div className="w-full max-w-xs">
            <Progress value={developmentScore} className={`h-2 ${getScoreColor(developmentScore)}`} />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">0</span>
              <span className="text-xs font-medium">{developmentScore}/100</span>
              <span className="text-xs text-gray-500">100</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* GitHub Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo("Coming Soon", "githubActivity").icon}
              GitHub Activity
            </CardTitle>
            <CardDescription className="text-xs">
              Code repository activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo("Coming Soon", "githubActivity").color}`}>
                    Coming Soon
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("githubActivity")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="text-xs mt-2 text-gray-500">
              GitHub activity data will be available in a future update.
            </p>
          </CardContent>
        </Card>
        
        {/* Last Commit Date */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo("Coming Soon", "lastCommitDate").icon}
              Last Commit Date
            </CardTitle>
            <CardDescription className="text-xs">
              Most recent code commit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo("Coming Soon", "lastCommitDate").color}`}>
                    Coming Soon
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("lastCommitDate")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
        
        {/* Commit Frequency */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo("Coming Soon", "commitFrequency").icon}
              Commit Frequency
            </CardTitle>
            <CardDescription className="text-xs">
              Regular code contributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo("Coming Soon", "commitFrequency").color}`}>
                    Coming Soon
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("commitFrequency")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
        
        {/* Roadmap Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo("Coming Soon", "roadmapProgress").icon}
              Roadmap Progress
            </CardTitle>
            <CardDescription className="text-xs">
              Development progress on roadmap
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo("Coming Soon", "roadmapProgress").color}`}>
                    Coming Soon
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("roadmapProgress")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
        
        {/* Contributors Count */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo("Coming Soon", "contributorsCount").icon}
              Contributors Count
            </CardTitle>
            <CardDescription className="text-xs">
              Number of active code contributors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo("Coming Soon", "contributorsCount").color}`}>
                    Coming Soon
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("contributorsCount")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
        
        {/* Open Source */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getStatusInfo("Coming Soon", "openSource").icon}
              Open Source
            </CardTitle>
            <CardDescription className="text-xs">
              Open source status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getStatusInfo("Coming Soon", "openSource").color}`}>
                    Coming Soon
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent("openSource")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
