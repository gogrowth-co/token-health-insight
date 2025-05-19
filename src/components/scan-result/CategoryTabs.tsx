
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SecurityMetricsSection } from "@/components/SecurityMetricsSection";
import { LiquidityMetricsSection } from "@/components/LiquidityMetricsSection";
import { TokenomicsMetricsSection } from "@/components/TokenomicsMetricsSection";
import { CommunityMetricsSection } from "@/components/CommunityMetricsSection";
import { DevelopmentMetricsSection } from "@/components/DevelopmentMetricsSection";
import { CategoriesOverview } from "@/components/scan-result/CategoriesOverview";
import { ProUpgradeCTA } from "@/components/scan-result/ProUpgradeCTA";
import { TokenInfo } from "@/hooks/useTokenInfo";
import { TokenMetrics } from "@/hooks/useTokenMetrics";
import { useRef, useEffect } from "react";

interface TokenMetadataUI {
  id: string;
  name?: string;
  symbol?: string;
  logo?: string;
  blockchain?: string;
  twitter?: string;
  github?: string;
  contract_address?: string;
}

interface CategoryTabsProps {
  activeTab: string;
  onValueChange: (value: string) => void;
  token: TokenInfo | null;
  tokenId: string;
  tokenMetadata: TokenMetadataUI;
  tokenMetrics?: TokenMetrics;
  tokenLoading: boolean;
  tokenError: Error | null;
  metricsLoading: boolean;
  metricsError: Error | null;
}

export const CategoryTabs = ({
  activeTab,
  onValueChange,
  token,
  tokenId,
  tokenMetadata,
  tokenMetrics,
  tokenLoading,
  tokenError,
  metricsLoading,
  metricsError
}: CategoryTabsProps) => {
  const tabsContentRef = useRef<HTMLDivElement>(null);

  // Handle view details action from category cards
  const handleViewDetails = (tab: string) => {
    onValueChange(tab);
    
    // Smooth scroll to tab content after a brief delay to allow tab change
    setTimeout(() => {
      if (tabsContentRef.current) {
        tabsContentRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <Tabs value={activeTab} onValueChange={onValueChange} className="mb-8">
      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-8">
        {/* Categories Overview Section - Moved up */}
        <CategoriesOverview 
          tokenMetrics={tokenMetrics} 
          onViewDetails={handleViewDetails}
        />
        
        {/* Pro CTA */}
        <ProUpgradeCTA />
      </TabsContent>
      
      {/* Tab content container with ref for scrolling */}
      <div ref={tabsContentRef}>
        {/* Security Tab */}
        <TabsContent value="security">
          <SecurityMetricsSection
            metrics={tokenMetrics}
            isLoading={metricsLoading}
            error={metricsError as Error | null}
          />
        </TabsContent>
        
        {/* Liquidity Tab */}
        <TabsContent value="liquidity">
          <LiquidityMetricsSection
            metrics={tokenMetrics}
            isLoading={metricsLoading}
            error={metricsError as Error | null}
          />
        </TabsContent>
        
        {/* Tokenomics Tab */}
        <TabsContent value="tokenomics">
          <TokenomicsMetricsSection
            metrics={tokenMetrics}
            isLoading={metricsLoading}
            error={metricsError as Error | null}
          />
        </TabsContent>
        
        {/* Community Tab */}
        <TabsContent value="community">
          <CommunityMetricsSection
            metrics={tokenMetrics}
            isLoading={metricsLoading}
            error={metricsError as Error | null}
          />
        </TabsContent>
        
        {/* Development Tab */}
        <TabsContent value="development">
          <DevelopmentMetricsSection
            metrics={tokenMetrics}
            isLoading={metricsLoading}
            error={metricsError as Error | null}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
};
