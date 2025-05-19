import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SecurityMetricsSection } from "@/components/SecurityMetricsSection";
import { CategorySection } from "@/components/CategorySection";
import { KeyMetricsGrid } from "@/components/KeyMetricsGrid";
import { CategoriesOverview } from "@/components/scan-result/CategoriesOverview";
import { ProUpgradeCTA } from "@/components/scan-result/ProUpgradeCTA";
import { TokenInfo } from "@/hooks/useTokenInfo";
import { TokenMetrics } from "@/hooks/useTokenMetrics";
import { TrendingUp, CircleDot, Users, FileCode } from "lucide-react";

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
  return (
    <Tabs value={activeTab} onValueChange={onValueChange} className="mb-8">
      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-8">
        {/* Key Metrics Section */}
        <section>
          <KeyMetricsGrid 
            token={token} 
            tokenId={tokenId} 
            isLoading={tokenLoading || metricsLoading}
            error={tokenError || metricsError}
            tokenMetadata={{
              id: tokenId,
              name: tokenMetadata.name,
              symbol: tokenMetadata.symbol,
              logo: tokenMetadata.logo,
              blockchain: tokenMetadata.blockchain,
              twitter: tokenMetadata.twitter,
              github: tokenMetadata.github,
              contract_address: tokenMetadata.contract_address
            }}
          />
        </section>
        
        {/* Categories Overview Section */}
        <CategoriesOverview tokenMetrics={tokenMetrics} />
        
        {/* Pro CTA */}
        <ProUpgradeCTA />
      </TabsContent>
      
      {/* Security Tab */}
      <TabsContent value="security">
        <SecurityMetricsSection
          metrics={tokenMetrics}
          isLoading={metricsLoading}
          error={metricsError as Error | null}
        />
      </TabsContent>
      
      {/* Other Tabs */}
      <TabsContent value="liquidity">
        <CategorySection 
          title="Liquidity Analysis" 
          icon={<TrendingUp />} 
          description="Assessment of market depth, trading volume, and holder distribution" 
          score={82} 
          items={[
            { name: "Liquidity Lock", status: tokenMetrics?.liquidityLock || "N/A", tooltip: "LP tokens lock status" },
            { name: "Market Cap", status: tokenMetrics?.marketCap || "N/A", tooltip: "Total market capitalization" },
            { name: "CEX Listings", status: "Coming Soon", tooltip: "Listed on centralized exchanges" },
            { name: "DEX Depth", status: "Coming Soon", tooltip: "Liquidity depth on decentralized exchanges" },
            { name: "Holder Distribution", status: tokenMetrics?.topHoldersPercentage || "N/A", tooltip: "Top holders percentage" }
          ]} 
        />
      </TabsContent>
      
      <TabsContent value="tokenomics">
        <CategorySection 
          title="Tokenomics Analysis" 
          icon={<CircleDot />} 
          description="Token supply, distribution, and monetary policy" 
          score={65} 
          items={[
            { name: "TVL", status: tokenMetrics?.tvl || "N/A", tooltip: "Total Value Locked" },
            { name: "Supply Cap", status: "Coming Soon", tooltip: "Maximum supply cap" },
            { name: "Token Distribution", status: "Coming Soon", tooltip: "Token distribution across stakeholders" },
            { name: "Treasury Size", status: "Coming Soon", tooltip: "Project treasury holdings" },
            { name: "Burn Mechanism", status: "Coming Soon", tooltip: "Token burn mechanism" }
          ]} 
        />
      </TabsContent>
      
      <TabsContent value="community">
        <CategorySection 
          title="Community Analysis" 
          icon={<Users />} 
          description="Social engagement and growth metrics" 
          score={85} 
          items={[
            { name: "Social Followers", status: "Coming Soon", tooltip: "Total social media followers" },
            { name: "Verified Account", status: "Coming Soon", tooltip: "Official account verification" },
            { name: "Growth Rate", status: "Coming Soon", tooltip: "Follower growth rate" },
            { name: "Active Channels", status: "Coming Soon", tooltip: "Number of active community channels" },
            { name: "Team Visibility", status: "Coming Soon", tooltip: "Team engagement with community" }
          ]} 
        />
      </TabsContent>
      
      <TabsContent value="development">
        <CategorySection 
          title="Development Analysis" 
          icon={<FileCode />} 
          description="Code activity and technical progress" 
          score={70} 
          items={[
            { name: "GitHub Activity", status: "Coming Soon", tooltip: "Code repository activity" },
            { name: "Last Commit Date", status: "Coming Soon", tooltip: "Most recent code commit" },
            { name: "Commit Frequency", status: "Coming Soon", tooltip: "Regular code contributions" },
            { name: "Roadmap Progress", status: "Coming Soon", tooltip: "Development progress on roadmap" },
            { name: "Contributors Count", status: "Coming Soon", tooltip: "Number of active code contributors" },
            { name: "Open Source", status: "Coming Soon", tooltip: "Open source status" }
          ]} 
        />
      </TabsContent>
    </Tabs>
  );
};
