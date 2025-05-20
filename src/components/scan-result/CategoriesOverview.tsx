
import { CategoryCard } from "@/components/CategoryCard";
import { ShieldCheck, TrendingUp, CircleDot, Users, FileCode } from "lucide-react";
import { TokenMetrics } from "@/hooks/useTokenMetrics";
import { withFallback } from "@/utils/dataHelpers";

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
            `Ownership Renounced: ${withFallback(tokenMetrics?.ownershipRenounced)}`,
            `Freeze Authority: ${withFallback(tokenMetrics?.freezeAuthority)}`,
            `Code Audit: ${withFallback(tokenMetrics?.codeAudit)}`, 
            `Multi-Sig Wallet: ${withFallback(tokenMetrics?.multiSigWallet)}`
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
            `Liquidity Lock: ${withFallback(tokenMetrics?.liquidityLock)}`,
            `Market Cap: ${withFallback(tokenMetrics?.marketCapFormatted)}`,
            `Top Holders: ${withFallback(tokenMetrics?.topHoldersPercentage)}`,
            `DEX Depth: ${withFallback(tokenMetrics?.dexDepth)}`
          ]} 
          color="bg-blue-500" 
          score={tokenMetrics?.liquidityScore || 65} 
          onViewDetails={() => onViewDetails("liquidity")}
        />
        
        <CategoryCard 
          title="Tokenomics" 
          icon={<CircleDot className="text-white" />} 
          description="Supply and distribution analysis" 
          metrics={[
            `TVL: ${withFallback(tokenMetrics?.tvl)}`,
            `Supply Cap: ${withFallback(tokenMetrics?.supplyCap)}`,
            `Token Distribution: ${withFallback(tokenMetrics?.tokenDistributionRating)}`,
            `Burn Mechanism: ${withFallback(tokenMetrics?.burnMechanism)}`
          ]} 
          color="bg-purple-500" 
          score={tokenMetrics?.tokenomicsScore || 65} 
          onViewDetails={() => onViewDetails("tokenomics")}
        />
        
        <CategoryCard 
          title="Community" 
          icon={<Users className="text-white" />} 
          description="Social and community engagement" 
          metrics={[
            `Social Followers: ${withFallback(tokenMetrics?.socialFollowers)}`,
            `Verified Account: ${withFallback(tokenMetrics?.verifiedAccount)}`,
            `Growth Rate: ${withFallback(tokenMetrics?.growthRate)}`,
            `Active Channels: ${withFallback(tokenMetrics?.activeChannels)}`
          ]} 
          color="bg-orange-500" 
          score={tokenMetrics?.communityScore || 70} 
          onViewDetails={() => onViewDetails("community")}
        />
        
        <CategoryCard 
          title="Development" 
          icon={<FileCode className="text-white" />} 
          description="Development activity and roadmap progress" 
          metrics={[
            `GitHub Activity: ${withFallback(tokenMetrics?.githubActivity)}`,
            `Last Commit: ${withFallback(tokenMetrics?.lastCommitDate)}`,
            `Commits: ${withFallback(tokenMetrics?.githubCommits)}`,
            `Contributors: ${withFallback(tokenMetrics?.githubContributors)}`
          ]} 
          color="bg-teal-500" 
          score={tokenMetrics?.developmentScore || 60} 
          onViewDetails={() => onViewDetails("development")}
        />
      </div>
    </section>
  );
};
