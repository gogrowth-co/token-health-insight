
import { ShieldCheck, ShieldX, Shield, ShieldOff } from "lucide-react";
import { TokenMetrics } from "@/hooks/useTokenMetrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface SecurityMetricsSectionProps {
  metrics: TokenMetrics | undefined;
  isLoading: boolean;
  error: Error | null;
}

export const SecurityMetricsSection = ({
  metrics,
  isLoading,
  error
}: SecurityMetricsSectionProps) => {
  // Security score calculation
  const securityScore = metrics?.securityScore || 50;
  
  // Helper function to determine the security status icon and color
  const getSecurityStatus = (value?: string) => {
    if (!value || value === "N/A" || value === "Unknown") {
      return { icon: <Shield className="h-5 w-5 text-gray-400" />, color: "text-gray-400 bg-gray-100" };
    }
    
    if (value === "Yes") {
      return { icon: <ShieldCheck className="h-5 w-5 text-green-500" />, color: "text-green-500 bg-green-50" };
    }
    
    if (value === "No") {
      return { icon: <ShieldX className="h-5 w-5 text-red-500" />, color: "text-red-500 bg-red-50" };
    }
    
    if (value === "Coming Soon") {
      return { icon: <Shield className="h-5 w-5 text-blue-500" />, color: "text-blue-500 bg-blue-50" };
    }
    
    if (value === "Possible") {
      return { icon: <ShieldOff className="h-5 w-5 text-yellow-500" />, color: "text-yellow-500 bg-yellow-50" };
    }
    
    return { icon: <Shield className="h-5 w-5 text-gray-500" />, color: "text-gray-500 bg-gray-100" };
  };
  
  // Function to get color based on security score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
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
        <p className="text-red-600">Error loading security data: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <h2 className="text-xl font-semibold">Security Analysis</h2>
        
        <div className="flex flex-col items-center">
          <div className="text-sm text-gray-500 mb-1">Security Score</div>
          <div className="w-full max-w-xs">
            <Progress value={securityScore} className={`h-2 ${getScoreColor(securityScore)}`} />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">0</span>
              <span className="text-xs font-medium">{securityScore}/100</span>
              <span className="text-xs text-gray-500">100</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Ownership Renounced */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getSecurityStatus(metrics?.ownershipRenounced).icon}
              Ownership Renounced
            </CardTitle>
            <CardDescription className="text-xs">
              Contract ownership status (renounced = more secure)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className={`${getSecurityStatus(metrics?.ownershipRenounced).color}`}>
              {metrics?.ownershipRenounced || "N/A"}
            </Badge>
            {metrics?.ownershipRenounced === "Unknown" && (
              <p className="text-xs mt-2 text-gray-500">
                Cannot verify ownership status due to closed source contract.
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Freeze Authority */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getSecurityStatus(metrics?.freezeAuthority === "No" ? "Yes" : "No").icon}
              Freeze Authority
            </CardTitle>
            <CardDescription className="text-xs">
              Contract can freeze or blacklist addresses (No = more secure)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className={`${getSecurityStatus(metrics?.freezeAuthority === "No" ? "Yes" : "No").color}`}>
              {metrics?.freezeAuthority || "N/A"}
            </Badge>
          </CardContent>
        </Card>
        
        {/* Code Audit */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getSecurityStatus(metrics?.codeAudit).icon}
              Code Audit
            </CardTitle>
            <CardDescription className="text-xs">
              Contract audited by a reputable security firm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className={`${getSecurityStatus(metrics?.codeAudit).color}`}>
              {metrics?.codeAudit || "Coming Soon"}
            </Badge>
          </CardContent>
        </Card>
        
        {/* Multi-Sig Wallet */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getSecurityStatus(metrics?.multiSigWallet).icon}
              Multi-Sig Wallet
            </CardTitle>
            <CardDescription className="text-xs">
              Treasury/operations require multiple signatures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className={`${getSecurityStatus(metrics?.multiSigWallet).color}`}>
              {metrics?.multiSigWallet || "Coming Soon"}
            </Badge>
          </CardContent>
        </Card>
        
        {/* Bug Bounty */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {getSecurityStatus(metrics?.bugBounty).icon}
              Bug Bounty
            </CardTitle>
            <CardDescription className="text-xs">
              Bug bounty program to find vulnerabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className={`${getSecurityStatus(metrics?.bugBounty).color}`}>
              {metrics?.bugBounty || "Coming Soon"}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
