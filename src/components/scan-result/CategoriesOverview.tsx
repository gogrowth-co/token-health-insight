
import { CategoryCard } from "@/components/CategoryCard";
import { ShieldCheck, TrendingUp, CircleDot, Users, FileCode } from "lucide-react";
import { TokenMetrics } from "@/hooks/useTokenMetrics";

interface CategoriesOverviewProps {
  tokenMetrics?: TokenMetrics;
  onViewDetails: (tab: string) => void;
}

export const CategoriesOverview = ({ tokenMetrics, onViewDetails }: CategoriesOverviewProps) => {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Categories Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CategoryCard 
          title="Security" 
          icon={<ShieldCheck className="text-white" />} 
          description="Contract and protocol security analysis" 
          metrics={[
            `Ownership Renounced: ${tokenMetrics?.ownershipRenounced || "N/A"}`,
            `Freeze Authority: ${tokenMetrics?.freezeAuthority || "N/A"}`,
            "Code Audit: Coming Soon", 
            "Multi-Sig Wallet: Coming Soon"
          ]} 
          color="bg-green-500" 
          score={tokenMetrics?.securityScore || 50} 
          onViewDetails={() => onViewDetails("security")}
        />
        
        <CategoryCard 
          title="Liquidity" 
          icon={<TrendingUp className="text-white" />} 
          description="Market depth and trading analysis" 
          metrics={[
            `Liquidity Lock: ${tokenMetrics?.liquidityLock || "N/A"}`,
            `Market Cap: ${tokenMetrics?.marketCap || "N/A"}`,
            `Top Holders: ${tokenMetrics?.topHoldersPercentage || "N/A"}`,
            "DEX Depth: Coming Soon"
          ]} 
          color="bg-blue-500" 
          score={75} 
          onViewDetails={() => onViewDetails("liquidity")}
        />
        
        <CategoryCard 
          title="Tokenomics" 
          icon={<CircleDot className="text-white" />} 
          description="Supply and distribution analysis" 
          metrics={[
            `TVL: ${tokenMetrics?.tvl || "N/A"}`,
            "Supply Cap: Coming Soon",
            "Token Distribution: Coming Soon",
            "Burn Mechanism: Coming Soon"
          ]} 
          color="bg-purple-500" 
          score={65} 
          onViewDetails={() => onViewDetails("tokenomics")}
        />
        
        <CategoryCard 
          title="Community" 
          icon={<Users className="text-white" />} 
          description="Social and community engagement" 
          metrics={[
            "Social Followers: Coming Soon",
            "Verified Account: Coming Soon",
            "Growth Rate: Coming Soon",
            "Active Channels: Coming Soon"
          ]} 
          color="bg-orange-500" 
          score={70} 
          onViewDetails={() => onViewDetails("community")}
        />
        
        <CategoryCard 
          title="Development" 
          icon={<FileCode className="text-white" />} 
          description="Development activity and roadmap progress" 
          metrics={[
            "GitHub Activity: Coming Soon",
            "Last Commit: Coming Soon",
            "Commit Frequency: Coming Soon",
            "Contributors: Coming Soon"
          ]} 
          color="bg-teal-500" 
          score={60} 
          onViewDetails={() => onViewDetails("development")}
        />
      </div>
    </section>
  );
};
