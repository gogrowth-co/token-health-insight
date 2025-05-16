
import React from "react";
import { RiskFactorsList } from "./RiskFactorsList";
import { TokenSecurityData } from "@/hooks/useTokenSecurity";

interface RiskFactorsSectionProps {
  securityData?: TokenSecurityData | null;
  isLoading?: boolean;
  showHeader?: boolean;
}

export const RiskFactorsSection: React.FC<RiskFactorsSectionProps> = ({ 
  securityData, 
  isLoading = false,
  showHeader = true 
}) => {
  return (
    <section className="py-16 px-4 bg-gray-50" id="risk-factors">
      <div className="container mx-auto max-w-6xl">
        {showHeader && (
          <>
            <h2 className="text-3xl font-bold text-center mb-4">Risk Factors Detected</h2>
            <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
              Critical issues that may impact your investment
            </p>
          </>
        )}
        
        <RiskFactorsList securityData={securityData} isLoading={isLoading} />
      </div>
    </section>
  );
};
