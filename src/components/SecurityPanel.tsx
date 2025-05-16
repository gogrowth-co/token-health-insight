
import React from "react";
import { ShieldCheck } from "lucide-react";
import { TokenSecurityData } from "@/hooks/useTokenSecurity";
import { SecurityChecksCard } from "./SecurityChecksCard";
import { RiskFactorsList } from "./RiskFactorsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";

interface SecurityPanelProps {
  securityData: TokenSecurityData | null;
  isLoading?: boolean;
  securityScore?: number;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = ({ 
  securityData, 
  isLoading = false,
  securityScore = 0
}) => {
  return (
    <div className="space-y-8">
      {/* Security Score */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2 text-indigo-500" />
                Security Score
              </CardTitle>
              <CardDescription>
                Based on contract verification, ownership, and risk factors
              </CardDescription>
            </div>
            <Badge 
              variant={securityScore >= 70 ? "success" : securityScore >= 40 ? "warning" : "destructive"}
              className="text-lg px-3 py-1"
            >
              {securityScore}/100
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress 
            value={securityScore} 
            className={`h-2 ${
              securityScore >= 70 ? 'bg-green-100' : 
              securityScore >= 40 ? 'bg-amber-100' : 
              'bg-red-100'
            }`}
          />
          <div className="mt-2 text-sm text-gray-500">
            {securityScore >= 70 ? 'Low risk - Good security practices detected' : 
             securityScore >= 40 ? 'Medium risk - Some security concerns detected' : 
             'High risk - Significant security issues detected'}
          </div>
        </CardContent>
      </Card>
      
      {/* Security Checks Card */}
      <SecurityChecksCard securityData={securityData} isLoading={isLoading} />
      
      {/* Risk Factors */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Risk Factors Detected</h3>
        <RiskFactorsList securityData={securityData} isLoading={isLoading} />
      </div>
    </div>
  );
};
