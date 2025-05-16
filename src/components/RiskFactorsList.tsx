
import React from "react";
import { ShieldAlert, Users, FileX, Info, Share2, AlertCircle, Zap, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TokenSecurityData } from "@/hooks/useTokenSecurity";

interface RiskFactorProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  tooltipText: string;
}

const RiskFactor = ({ icon, title, description, tooltipText }: RiskFactorProps) => (
  <TooltipProvider>
    <div className="p-6 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="p-2 bg-red-50 text-red-500 rounded-lg">{icon}</div>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-1">{title}</h3>
          <p className="text-gray-600 text-sm">{description}</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="inline-flex items-center mt-2 text-xs text-gray-500 hover:text-gray-700">
                <Info className="h-3 w-3 mr-1" /> Learn more
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  </TooltipProvider>
);

interface RiskFactorsListProps {
  securityData?: TokenSecurityData | null;
  isLoading?: boolean;
  limit?: number;
}

export const RiskFactorsList: React.FC<RiskFactorsListProps> = ({ 
  securityData,
  isLoading = false,
  limit
}) => {
  // Default risk factors
  const defaultRiskFactors = [
    {
      icon: <ShieldAlert className="h-6 w-6" />,
      title: "Ownership not renounced",
      description: "Team can rug",
      tooltipText: "When contract ownership isn't renounced, the team can make changes that might harm investors, including stealing all funds."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Top 10 wallets hold 90%",
      description: "High manipulation risk",
      tooltipText: "Concentration of tokens in few wallets means those holders can coordinate to manipulate prices and dump on smaller investors."
    },
    {
      icon: <Info className="h-6 w-6" />,
      title: "Token launched yesterday",
      description: "No history",
      tooltipText: "New tokens with minimal history are higher risk since there isn't enough data to establish patterns or trustworthiness."
    },
    {
      icon: <FileX className="h-6 w-6" />,
      title: "No GitHub commits",
      description: "Dead project",
      tooltipText: "Lack of active development suggests the project may be abandoned or was never intended for long-term growth."
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-6 bg-white rounded-lg border border-gray-100 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Generate risk factors based on security data if available
  const generateRiskFactors = () => {
    if (!securityData) return defaultRiskFactors;
    
    const riskFactors = [];
    
    // Check for ownership risks
    if (!securityData.ownershipRenounced) {
      riskFactors.push({
        icon: <ShieldAlert className="h-6 w-6" />,
        title: "Ownership not renounced",
        description: "Centralization risk",
        tooltipText: "When contract ownership isn't renounced, the team can make changes that might harm investors, including stealing all funds."
      });
    }
    
    // Check for honeypot risks
    if (securityData.honeypotRisk === 'High') {
      riskFactors.push({
        icon: <Lock className="h-6 w-6" />,
        title: "Honeypot detected",
        description: "Selling restriction",
        tooltipText: "The contract may prevent users from selling their tokens, trapping investments."
      });
    }
    
    // Check for minting risks
    if (securityData.isMintable) {
      riskFactors.push({
        icon: <Zap className="h-6 w-6" />,
        title: "Token is mintable",
        description: "Supply inflation risk",
        tooltipText: "When a contract can mint new tokens, it creates inflation risk as supply can be arbitrarily increased, potentially diluting holder value."
      });
    }
    
    // Check for blacklist function
    if (securityData.isBlacklisted) {
      riskFactors.push({
        icon: <AlertCircle className="h-6 w-6" />,
        title: "Blacklist function",
        description: "Address blocking",
        tooltipText: "Contract has ability to block specific addresses from transacting with the token."
      });
    }
    
    // Check for ownership take-back
    if (securityData.canTakeBackOwnership) {
      riskFactors.push({
        icon: <Share2 className="h-6 w-6" />,
        title: "Ownership recovery enabled",
        description: "Control risk",
        tooltipText: "Contract has functionality that allows regaining ownership even if previously renounced."
      });
    }
    
    // Check for slippage modification
    if (securityData.slippageModifiable) {
      riskFactors.push({
        icon: <AlertCircle className="h-6 w-6" />,
        title: "Modifiable slippage",
        description: "Trading risk",
        tooltipText: "Contract owner can modify slippage parameters, potentially affecting trade execution and pricing."
      });
    }
    
    // Use default if no specific risks found
    return riskFactors.length > 0 ? riskFactors : defaultRiskFactors;
  };
  
  const riskFactors = generateRiskFactors();
  const displayFactors = limit ? riskFactors.slice(0, limit) : riskFactors;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {displayFactors.map((factor, index) => (
        <RiskFactor
          key={index}
          icon={factor.icon}
          title={factor.title}
          description={factor.description}
          tooltipText={factor.tooltipText}
        />
      ))}
    </div>
  );
};
