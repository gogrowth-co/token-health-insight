
import React from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TokenSecurityData } from "@/hooks/useTokenSecurity";
import { TokenTokenomicsData } from "@/hooks/useTokenTokenomics";

interface RiskFactorsListProps {
  securityData?: TokenSecurityData | null;
  tokenomicsData?: TokenTokenomicsData | null;
  isLoading?: boolean;
}

export const RiskFactorsList: React.FC<RiskFactorsListProps> = ({ 
  securityData, 
  tokenomicsData,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  
  if (!securityData && !tokenomicsData) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>No data available</AlertTitle>
        <AlertDescription>
          Security and tokenomics analysis data is not available for this token.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Collect all risk factors
  const riskFactors = [];
  
  // Security risk factors
  if (securityData) {
    if (!securityData.ownershipRenounced) {
      riskFactors.push({
        title: "Ownership Not Renounced",
        description: "The contract owner can modify the contract's behavior, posing a centralization risk.",
        severity: "high"
      });
    }
    
    if (securityData.isHoneypot) {
      riskFactors.push({
        title: "Potential Honeypot",
        description: "This contract may prevent selling tokens under certain conditions.",
        severity: "critical"
      });
    }
    
    if (securityData.canMint) {
      riskFactors.push({
        title: "Mintable Token",
        description: "The contract owner can create new tokens, potentially diluting value.",
        severity: "high"
      });
    }
    
    if (securityData.hasBlacklist) {
      riskFactors.push({
        title: "Address Blacklisting",
        description: "The contract can block specific addresses from transacting.",
        severity: "medium"
      });
    }
    
    if (securityData.slippageModifiable) {
      riskFactors.push({
        title: "Modifiable Slippage",
        description: "Transaction fees or slippage can be modified by the contract owner.",
        severity: "medium"
      });
    }
    
    if (securityData.ownerCanChangeBalance) {
      riskFactors.push({
        title: "Owner Can Change Balances",
        description: "The contract owner can modify token balances without user consent.",
        severity: "critical" 
      });
    }
    
    if (securityData.transferPausable) {
      riskFactors.push({
        title: "Pausable Transfers",
        description: "Token transfers can be paused by the contract owner.",
        severity: "medium"
      });
    }
    
    if (securityData.isSelfdestructable) {
      riskFactors.push({
        title: "Self-Destructable Contract",
        description: "The contract can be destroyed, potentially locking all funds.",
        severity: "critical"
      });
    }
    
    if (!securityData.isOpenSource) {
      riskFactors.push({
        title: "Contract Not Open Source",
        description: "The contract code is not verified and publicly available for audit.",
        severity: "high"
      });
    }
    
    const buyTaxNum = parseFloat(securityData.buyTax?.replace('%', '') || '0');
    const sellTaxNum = parseFloat(securityData.sellTax?.replace('%', '') || '0');
    
    if (buyTaxNum > 10 || sellTaxNum > 10) {
      riskFactors.push({
        title: "Excessive Tax",
        description: `High transaction taxes (Buy: ${securityData.buyTax}, Sell: ${securityData.sellTax})`,
        severity: "high"
      });
    } else if (buyTaxNum > 5 || sellTaxNum > 5) {
      riskFactors.push({
        title: "High Tax",
        description: `Elevated transaction taxes (Buy: ${securityData.buyTax}, Sell: ${securityData.sellTax})`,
        severity: "medium"
      });
    }
  }
  
  // Tokenomics risk factors
  if (tokenomicsData) {
    if (tokenomicsData.isMintable) {
      riskFactors.push({
        title: "Unlimited Supply",
        description: "The token contract allows minting new tokens, which can lead to inflation.",
        severity: "high"
      });
    }
    
    if (tokenomicsData.topHolderPct && tokenomicsData.topHolderPct > 20) {
      riskFactors.push({
        title: "High Whale Concentration",
        description: `The largest wallet holds ${tokenomicsData.topHolderPct.toFixed(2)}% of total supply.`,
        severity: "high"
      });
    } else if (tokenomicsData.topHolderPct && tokenomicsData.topHolderPct > 10) {
      riskFactors.push({
        title: "Significant Whale Presence",
        description: `The largest wallet holds ${tokenomicsData.topHolderPct.toFixed(2)}% of total supply.`,
        severity: "medium"
      });
    }
    
    if (tokenomicsData.top5HoldersPct && tokenomicsData.top5HoldersPct > 50) {
      riskFactors.push({
        title: "Centralized Token Distribution",
        description: `Top 5 wallets hold ${tokenomicsData.top5HoldersPct.toFixed(2)}% of total supply.`,
        severity: "high"
      });
    } else if (tokenomicsData.top5HoldersPct && tokenomicsData.top5HoldersPct > 30) {
      riskFactors.push({
        title: "Concentrated Token Distribution",
        description: `Top 5 wallets hold ${tokenomicsData.top5HoldersPct.toFixed(2)}% of total supply.`,
        severity: "medium"
      });
    }
    
    if (tokenomicsData.buyTax > 5 || tokenomicsData.sellTax > 5) {
      riskFactors.push({
        title: "High Transaction Taxes",
        description: `Transaction taxes may impact trading (Buy: ${tokenomicsData.buyTax}%, Sell: ${tokenomicsData.sellTax}%)`,
        severity: tokenomicsData.buyTax > 10 || tokenomicsData.sellTax > 10 ? "high" : "medium"
      });
    }
    
    if (tokenomicsData.holdersCount < 100) {
      riskFactors.push({
        title: "Small Holder Base",
        description: `Only ${tokenomicsData.holdersCount} different addresses hold this token.`,
        severity: "medium"
      });
    }
  }
  
  // Deduplicate risk factors
  const uniqueRiskFactors = [];
  const titles = new Set();
  
  for (const risk of riskFactors) {
    if (!titles.has(risk.title)) {
      titles.add(risk.title);
      uniqueRiskFactors.push(risk);
    }
  }
  
  // Sort by severity
  const sortedRiskFactors = uniqueRiskFactors.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
  
  if (sortedRiskFactors.length === 0) {
    return (
      <Alert className="bg-green-50 text-green-900 border-green-200">
        <Info className="h-4 w-4 text-green-600" />
        <AlertTitle>No Critical Risk Factors Detected</AlertTitle>
        <AlertDescription>
          Based on our analysis, no significant risk factors were found for this token.
          However, always do your own research before investing.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      {sortedRiskFactors.map((risk, index) => (
        <Alert 
          key={index} 
          variant={
            risk.severity === "critical" ? "destructive" : 
            risk.severity === "high" ? "destructive" : 
            risk.severity === "medium" ? "default" : "outline"
          }
          className={
            risk.severity === "critical" ? "bg-red-50 text-red-900 border-red-200" : 
            risk.severity === "high" ? "bg-red-50 text-red-900 border-red-200" : 
            risk.severity === "medium" ? "bg-amber-50 text-amber-900 border-amber-200" : 
            "bg-gray-50 text-gray-900 border-gray-200"
          }
        >
          <AlertTriangle className={
            risk.severity === "critical" || risk.severity === "high" ? "h-4 w-4 text-red-600" : 
            risk.severity === "medium" ? "h-4 w-4 text-amber-600" : 
            "h-4 w-4 text-gray-600"
          } />
          <AlertTitle className="font-semibold">
            {risk.title}
            {risk.severity === "critical" && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">Critical</span>
            )}
          </AlertTitle>
          <AlertDescription>{risk.description}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
};
