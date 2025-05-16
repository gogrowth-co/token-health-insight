
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck, ShieldX, Info, AlertTriangle } from "lucide-react";
import { TokenSecurityData } from "@/hooks/useTokenSecurity";

interface SecurityCheckItemProps {
  name: string;
  status: 'passed' | 'failed' | 'warning' | 'neutral';
  description: string;
}

const SecurityCheckItem: React.FC<SecurityCheckItemProps> = ({ name, status, description }) => {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center">
        {status === 'passed' && <ShieldCheck className="h-5 w-5 text-green-500 mr-2" />}
        {status === 'failed' && <ShieldX className="h-5 w-5 text-red-500 mr-2" />}
        {status === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />}
        {status === 'neutral' && <Info className="h-5 w-5 text-blue-500 mr-2" />}
        <span className="text-sm font-medium">{name}</span>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex">
              <Badge variant={status === 'passed' ? 'success' : status === 'failed' ? 'destructive' : status === 'warning' ? 'warning' : 'outline'}>
                {status === 'passed' ? 'Secure' : status === 'failed' ? 'Risk' : status === 'warning' ? 'Caution' : 'Info'}
              </Badge>
              <Info className="h-4 w-4 ml-1 text-gray-400 cursor-help" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <p>{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

interface SecurityChecksCardProps {
  securityData: TokenSecurityData | null;
  isLoading?: boolean;
}

export const SecurityChecksCard: React.FC<SecurityChecksCardProps> = ({ securityData, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Contract Security Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!securityData) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Contract Security Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-amber-500" />
            <p>No security data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Contract Security Checks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <SecurityCheckItem
            name="Contract Verified"
            status={securityData.contractVerified ? 'passed' : 'warning'}
            description={securityData.contractVerified 
              ? "Contract code is verified on Etherscan and can be audited" 
              : "Contract code is not verified, making it difficult to audit for risks"}
          />
          <SecurityCheckItem
            name="Ownership Renounced"
            status={securityData.ownershipRenounced ? 'passed' : 'warning'}
            description={securityData.ownershipRenounced 
              ? "Contract ownership has been renounced, removing centralized control" 
              : "Contract still has an active owner who can make changes"}
          />
          <SecurityCheckItem
            name="Honeypot Risk"
            status={securityData.honeypotRisk === 'Low' ? 'passed' : 'failed'}
            description={securityData.honeypotRisk === 'Low' 
              ? "No honeypot indicators detected in the contract" 
              : "Contract may prevent selling tokens (honeypot risk)"}
          />
          {securityData.isMintable && (
            <SecurityCheckItem
              name="Token Mintable"
              status={'warning'}
              description="Contract owners can create new tokens, potentially diluting value"
            />
          )}
          {securityData.isBlacklisted && (
            <SecurityCheckItem
              name="Blacklist Function"
              status={'warning'}
              description="Contract has ability to block specific addresses from transacting"
            />
          )}
          {securityData.slippageModifiable && (
            <SecurityCheckItem
              name="Modifiable Slippage"
              status={'warning'}
              description="Contract can change slippage parameters, potentially affecting trades"
            />
          )}
          {securityData.tradingCooldown && (
            <SecurityCheckItem
              name="Trading Cooldown"
              status={'neutral'}
              description="Contract enforces waiting periods between trades"
            />
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
          <span>
            Data sources: {securityData.dataSource.etherscan ? 'Etherscan' : ''} 
            {securityData.dataSource.etherscan && securityData.dataSource.goPlus ? ' + ' : ''}
            {securityData.dataSource.goPlus ? 'GoPlus' : ''}
          </span>
          <span>Updated {new Date(securityData.scannedAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};
