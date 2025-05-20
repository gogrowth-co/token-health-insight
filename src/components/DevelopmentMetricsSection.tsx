
import { Code, GitCommit, GitFork, Clock } from "lucide-react";
import { formatTimeAgo } from "../utils/formatters";
import { TokenMetrics } from "@/hooks/useTokenMetrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { withFallback, isDataMissing, getTooltipText } from "@/utils/dataHelpers";
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
  const developmentScore = metrics?.developmentScore || 50;
  
  // Helper function to determine the development status icon and color
  const getDevelopmentStatus = (value?: string | number, type?: string) => {
    if (isDataMissing(value)) {
      return { icon: <Code className="h-5 w-5 text-gray-400" />, color: "text-gray-400 bg-gray-100" };
    }
    
    if (type === "commits") {
      const commits = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (commits > 100) {
        return { icon: <GitCommit className="h-5 w-5 text-green-500" />, color: "text-green-500 bg-green-50" };
      } else if (commits > 20) {
        return { icon: <GitCommit className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
      } else {
        return { icon: <GitCommit className="h-5 w-5 text-yellow-500" />, color: "text-yellow-500 bg-yellow-50" };
      }
    }
    
    if (type === "contributors") {
      const contributors = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (contributors > 10) {
        return { icon: <GitFork className="h-5 w-5 text-green-500" />, color: "text-green-500 bg-green-50" };
      } else if (contributors > 3) {
        return { icon: <GitFork className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
      } else {
        return { icon: <GitFork className="h-5 w-5 text-yellow-500" />, color: "text-yellow-500 bg-yellow-50" };
      }
    }
    
    if (type === "lastCommit") {
      try {
        const date = new Date(value as string);
        const daysSinceLastCommit = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastCommit <= 7) {
          return { icon: <Clock className="h-5 w-5 text-green-500" />, color: "text-green-500 bg-green-50" };
        } else if (daysSinceLastCommit <= 30) {
          return { icon: <Clock className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
        } else if (daysSinceLastCommit <= 90) {
          return { icon: <Clock className="h-5 w-5 text-yellow-500" />, color: "text-yellow-500 bg-yellow-50" };
        } else {
          return { icon: <Clock className="h-5 w-5 text-red-500" />, color: "text-red-500 bg-red-50" };
        }
      } catch (e) {
        return { icon: <Clock className="h-5 w-5 text-gray-500" />, color: "text-gray-500 bg-gray-100" };
      }
    }
    
    // Default
    return { icon: <Code className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
  };
  
  // Function to get color based on development score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Format last commit date
  const formatLastCommit = (dateString?: string) => {
    if (isDataMissing(dateString)) {
      return 'N/A';
    }
    
    try {
      return formatTimeAgo(String(dateString));
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (isDataMissing(dateString)) {
      return 'N/A';
    }
    
    try {
      return new Date(dateString as string).toLocaleDateString();
    } catch (e) {
      return 'N/A';
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
              <Code className="h-5 w-5 text-blue-500" />
              GitHub Activity
            </CardTitle>
            <CardDescription className="text-xs">
              Overall activity level on GitHub repository
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className="text-blue-500 bg-blue-50">
                    {withFallback(metrics?.githubActivity)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipText(metrics?.githubActivity)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isDataMissing(metrics?.githubActivity) && (
              <p className="text-xs mt-2 text-gray-500">
                Repository activity data currently unavailable.
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* GitHub Commits */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getDevelopmentStatus(metrics?.githubCommits, "commits").icon}
              GitHub Commits
            </CardTitle>
            <CardDescription className="text-xs">
              Number of commits in the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getDevelopmentStatus(metrics?.githubCommits, "commits").color}`}>
                    {withFallback(metrics?.githubCommits)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipText(metrics?.githubCommits)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {!isDataMissing(metrics?.githubCommits) && metrics?.githubCommits as number > 0 && (
              <p className="text-xs mt-2 text-gray-500">
                {(metrics?.githubCommits as number) > 100 ? "Very active development" : 
                 (metrics?.githubCommits as number) > 20 ? "Moderately active development" : 
                 "Lower activity level"}
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* GitHub Contributors */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getDevelopmentStatus(metrics?.githubContributors, "contributors").icon}
              GitHub Contributors
            </CardTitle>
            <CardDescription className="text-xs">
              Number of developers contributing to the project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getDevelopmentStatus(metrics?.githubContributors, "contributors").color}`}>
                    {withFallback(metrics?.githubContributors)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipText(metrics?.githubContributors)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {!isDataMissing(metrics?.githubContributors) && metrics?.githubContributors as number > 0 && (
              <p className="text-xs mt-2 text-gray-500">
                {(metrics?.githubContributors as number) > 10 ? "Large developer community" : 
                 (metrics?.githubContributors as number) > 3 ? "Growing developer community" : 
                 "Small development team"}
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Last Commit Date */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getDevelopmentStatus(metrics?.lastCommitDate, "lastCommit").icon}
              Last Commit
            </CardTitle>
            <CardDescription className="text-xs">
              Most recent code update on GitHub
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className={`${getDevelopmentStatus(metrics?.lastCommitDate, "lastCommit").color}`}>
                    {formatLastCommit(metrics?.lastCommitDate)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipText(metrics?.lastCommitDate)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {!isDataMissing(metrics?.lastCommitDate) && (
              <p className="text-xs mt-2 text-gray-500">
                Last update: {formatDate(metrics?.lastCommitDate)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
