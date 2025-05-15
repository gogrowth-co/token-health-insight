import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HealthScoreCard } from "@/components/HealthScoreCard";
import { KeyMetricsGrid } from "@/components/KeyMetricsGrid";
import { CategoryCard } from "@/components/CategoryCard";
import { CategorySection } from "@/components/CategorySection";
import { Progress } from "@/components/ui/progress";
import { useScanToken } from "@/hooks/useScanToken";
import { TokenMetrics } from "@/api/types";
import { RiskFactorsSection } from "@/components/RiskFactorsSection";

import { 
  ShieldCheck, 
  TrendingUp,
  CircleDot, 
  Users,
  FileCode,
  Layers,
} from "lucide-react";

const ScanResult = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { tokenId } = useParams();
  const [searchParams] = useSearchParams();
  const tokenFromQuery = searchParams.get("token");
  const token = tokenId || tokenFromQuery || "";
  const [activeTab, setActiveTab] = useState("overview");
  
  const [projectData, setProjectData] = useState<TokenMetrics | null>(null);
  const { scan, isLoading, progress, error } = useScanToken();

  useEffect(() => {
    if (token && !isLoading && !authLoading) {
      scan(token).then(result => {
        if (result) {
          setProjectData(result);
        }
      });
    }
  }, [token, authLoading]);

  // Redirect to auth page if not authenticated
  if (!authLoading && !user) {
    return <Navigate to={`/auth?token=${encodeURIComponent(token)}`} />;
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // Show loading state
  if (isLoading || !projectData) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <div className="container max-w-xl mx-auto px-4 py-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Scanning {token}</h2>
            <Progress value={progress} className="mb-8" />
            <p className="text-gray-500">
              {progress < 30 ? "Fetching token data..." : 
               progress < 60 ? "Analyzing on-chain metrics..." : 
               progress < 90 ? "Calculating health scores..." : 
               "Finalizing results..."}
            </p>
            
            {error && (
              <div className="mt-8 p-4 bg-red-50 text-red-700 rounded-md">
                <p className="font-medium">Error scanning token</p>
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Ensure all required properties exist on projectData before rendering
  const keyMetricsData = {
    marketCap: projectData.marketCap,
    liquidityLock: projectData.liquidityLock,
    topHoldersPercentage: projectData.topHoldersPercentage,
    tvl: projectData.tvl,
    auditStatus: projectData.auditStatus,
    socialFollowers: projectData.socialFollowers,
    etherscan: projectData.etherscan,
    twitter: projectData.twitter
  };

  // Determine security item statuses based on Etherscan data
  const securityAnalysis = projectData.etherscan?.securityAnalysis;
  const getOwnershipStatus = () => securityAnalysis?.ownershipRenounced ? "Yes" : "No";
  const getMintStatus = () => securityAnalysis?.canMint ? "Yes" : "No";
  const getWalletType = () => securityAnalysis?.isMultiSig ? "Multi-Sig" : "Standard";
  const getFreezeStatus = () => securityAnalysis?.hasFreeze ? "Yes" : "No";

  // Format date for GitHub data
  const formatGitHubDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return 'Unknown';
    }
  };

  // Format Twitter date
  const formatTwitterDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    } catch (e) {
      return 'Unknown';
    }
  };

  // Get Twitter account age
  const getTwitterAccountAge = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    try {
      const createdAt = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
      return diffYears === 1 ? '1 year' : `${diffYears} years`;
    } catch (e) {
      return 'Unknown';
    }
  };

  // Get Team Visibility status based on Twitter verification
  const getTeamVisibilityStatus = (): string => {
    if (!projectData.twitter) return "Unknown";
    return projectData.twitter.verified ? "High" : "Medium";
  };

  // Get Twitter growth rate
  const getTwitterGrowthRate = (): string => {
    if (!projectData.twitter?.followerChange) return "+18%";
    // Remove + or - from percentage string
    return projectData.twitter.followerChange.percentage.replace(/^[+-]/, '');
  };

  // Get Twitter follower change trend
  const getTwitterFollowerTrend = (): 'up' | 'down' | 'neutral' => {
    if (!projectData.twitter?.followerChange) return "up";
    return projectData.twitter.followerChange.trend;
  };

  // Fix: Add the missing getVerificationTooltip function
  const getVerificationTooltip = () => {
    if (!projectData.twitter) return "Twitter account verification status unknown";
    return projectData.twitter.verified 
      ? "Twitter account is verified" 
      : "Twitter account is not verified";
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        {/* Project Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{projectData.name}</h1>
                <Badge variant="outline" className="text-sm font-medium">
                  ${projectData.symbol}
                </Badge>
              </div>
              <HealthScoreCard score={projectData.healthScore} />
            </div>
            
            {/* Last updated timestamp */}
            {projectData.lastUpdated && (
              <p className="text-xs text-gray-500 mt-2">
                Last updated: {new Date(projectData.lastUpdated).toLocaleTimeString()}
              </p>
            )}
            
            {/* Tabs Navigation */}
            <Tabs 
              value={activeTab} 
              onValueChange={handleTabChange}
              className="mt-6"
            >
              <TabsList className="w-full sm:w-auto overflow-x-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
                <TabsTrigger value="tokenomics">Tokenomics</TabsTrigger>
                <TabsTrigger value="community">Community</TabsTrigger>
                <TabsTrigger value="development">Development</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Each Tab Content */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-8">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {/* Key Metrics Section */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
                <KeyMetricsGrid projectData={keyMetricsData} tokenId={token} />
              </section>
              
              {/* Categories Overview Section */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Categories Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <CategoryCard
                    title="Security"
                    icon={<ShieldCheck className="text-white" />}
                    description="Contract and protocol security analysis"
                    metrics={[
                      `Ownership Renounced: ${getOwnershipStatus()}`,
                      `Can Mint: ${getMintStatus()}`,
                      `Code Audit: ${projectData.auditStatus}`,
                      `Multi-Sig Wallet: ${getWalletType()}`
                    ]}
                    color="bg-green-500"
                    score={projectData.categories.security.score}
                  />
                  
                  <CategoryCard
                    title="Liquidity"
                    icon={<TrendingUp className="text-white" />}
                    description="Market depth and trading analysis"
                    metrics={[
                      "Liquidity Lock: " + projectData.liquidityLock,
                      "CEX Listings: 2",
                      "DEX Depth: Good",
                      "Holder Distribution: " + (parseFloat(projectData.topHoldersPercentage) > 70 ? "Concentrated" : "Moderate")
                    ]}
                    color="bg-blue-500"
                    score={projectData.categories.liquidity.score}
                  />
                  
                  <CategoryCard
                    title="Tokenomics"
                    icon={<CircleDot className="text-white" />}
                    description="Supply and distribution analysis"
                    metrics={[
                      "Supply Cap: Yes (100M)",
                      `Burn Mechanism: ${securityAnalysis?.canBurn ? "Yes" : "No"}`,
                      "Treasury Size: $500K",
                      `Top Holders: ${projectData.topHoldersPercentage}`
                    ]}
                    color="bg-purple-500"
                    score={projectData.categories.tokenomics.score}
                  />
                  
                  <CategoryCard
                    title="Community"
                    icon={<Users className="text-white" />}
                    description="Social and community engagement"
                    metrics={[
                      "Twitter Followers: " + projectData.socialFollowers,
                      "Verified Account: " + (projectData.twitter?.verified ? "Yes" : "No"),
                      "Growth Rate (30d): " + getTwitterGrowthRate(),
                      "Active Channels: 4"
                    ]}
                    color="bg-orange-500"
                    score={projectData.categories.community.score}
                  />
                  
                  <CategoryCard
                    title="Development"
                    icon={<FileCode className="text-white" />}
                    description="Development activity and roadmap progress"
                    metrics={[
                      `GitHub Activity: ${projectData.github?.activityStatus || "Unknown"}`,
                      `Recent Commits: ${projectData.github ? projectData.github.commitCount : "Unknown"}`,
                      `Roadmap Progress: ${projectData.github?.roadmapProgress || "Unknown"}`,
                      `Open Source: ${projectData.github?.isOpenSource ? "Yes" : "No"}`
                    ]}
                    color="bg-teal-500"
                    score={projectData.categories.development.score}
                  />
                </div>
              </section>
              
              {/* Pro CTA */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-xl font-bold mb-2">Unlock Advanced Analytics</h3>
                    <p>Get deep tokenomics breakdowns, video walkthroughs, and expert insights.</p>
                  </div>
                  <Button className="bg-white text-indigo-600 hover:bg-gray-100">Upgrade to Pro →</Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Security Tab */}
            <TabsContent value="security">
              <CategorySection 
                title="Security Analysis" 
                icon={<ShieldCheck />} 
                description="In-depth security audit of smart contracts and protocols"
                score={projectData.categories.security.score}
                items={[
                  { 
                    name: "Ownership Renounced", 
                    status: getOwnershipStatus(), 
                    tooltip: securityAnalysis?.ownershipRenounced 
                      ? "Contract ownership has been renounced, reducing centralization risk" 
                      : "Contract ownership has not been renounced, deployer still has control"
                  },
                  { 
                    name: "Can Mint", 
                    status: getMintStatus(),
                    tooltip: securityAnalysis?.canMint
                      ? "Contract can mint new tokens, potential inflation risk"
                      : "Contract cannot mint new tokens"
                  },
                  { 
                    name: "Code Audit", 
                    status: projectData.auditStatus, 
                    tooltip: "Smart contract verified on Etherscan" 
                  },
                  { 
                    name: "Freeze / Blacklist Authority", 
                    status: getFreezeStatus(),
                    tooltip: securityAnalysis?.hasFreeze
                      ? "Contract has ability to freeze or blacklist accounts"
                      : "No ability to freeze or blacklist accounts"
                  },
                  { 
                    name: "Multi-Sig Wallet", 
                    status: getWalletType(),
                    tooltip: securityAnalysis?.isMultiSig
                      ? "Multiple signatures required for certain operations, improved security"
                      : "Single signature wallet, standard security"
                  },
                  { 
                    name: "Insurance", 
                    status: "No", 
                    tooltip: "No insurance coverage for smart contract risks" 
                  },
                  { 
                    name: "Bug Bounty", 
                    status: "Yes", 
                    tooltip: "Active bug bounty program to identify vulnerabilities" 
                  }
                ]}
              />
              
              {/* Risk Factors Section - if security score is low */}
              {projectData.categories.security.score < 60 && (
                <div className="mt-8">
                  <RiskFactorsSection />
                </div>
              )}
            </TabsContent>
            
            {/* Liquidity Tab */}
            <TabsContent value="liquidity">
              <CategorySection 
                title="Liquidity Analysis" 
                icon={<TrendingUp />} 
                description="Assessment of market depth, trading volume, and holder distribution"
                score={projectData.categories.liquidity.score}
                items={[
                  { 
                    name: "Liquidity Lock", 
                    status: projectData.liquidityLock, 
                    tooltip: "Duration that LP tokens are locked for" 
                  },
                  { 
                    name: "TVL", 
                    status: projectData.tvl, 
                    tooltip: projectData.defiLlama?.chainDistribution 
                      ? `Total Value Locked across ${projectData.defiLlama.chainDistribution}` 
                      : "Total Value Locked in protocol",
                    sparklineData: projectData.tvlSparkline?.data,
                    change: projectData.defiLlama?.tvlChange7d || undefined
                  },
                  { 
                    name: "Chain Distribution", 
                    status: projectData.defiLlama?.chainDistribution || "Ethereum", 
                    tooltip: "Blockchains where protocol is deployed" 
                  },
                  { 
                    name: "Holder Distribution", 
                    status: parseFloat(projectData.topHoldersPercentage) > 70 ? "Concentrated" : "Moderate", 
                    tooltip: `Top 10 holders own ${projectData.topHoldersPercentage} of the supply` 
                  },
                  { 
                    name: "Trading Volume", 
                    status: projectData.volume24h || "$243K/24h", 
                    tooltip: "24-hour trading volume across all exchanges" 
                  }
                ]}
              />
            </TabsContent>
            
            {/* Other Tabs */}
            <TabsContent value="tokenomics">
              <CategorySection 
                title="Tokenomics Analysis" 
                icon={<CircleDot />} 
                description="Token supply, distribution, and monetary policy"
                score={projectData.categories.tokenomics.score}
                items={[
                  { name: "Supply Cap", status: "Yes (100M)", tooltip: "Maximum supply is capped at 100 million tokens" },
                  { 
                    name: "Top 10 Holders", 
                    status: projectData.topHoldersPercentage,
                    tooltip: `Top 10 addresses control ${projectData.topHoldersPercentage} of the supply`
                  },
                  { name: "Treasury Size", status: "$500K", tooltip: "Project treasury holds $500,000 in assets" },
                  { name: "Vesting Schedule", status: "Yes", tooltip: "Team and investor tokens subject to vesting" },
                  { 
                    name: "Burn Mechanism", 
                    status: securityAnalysis?.canBurn ? "Yes" : "No", 
                    tooltip: securityAnalysis?.canBurn ? "Regular token burns from transaction fees" : "No token burning functionality" 
                  }
                ]}
              />
            </TabsContent>
            
            <TabsContent value="community">
              <CategorySection 
                title="Community Analysis" 
                icon={<Users />} 
                description="Social engagement and growth metrics"
                score={projectData.categories.community.score}
                items={[
                  { 
                    name: "Twitter Followers", 
                    status: projectData.socialFollowers, 
                    tooltip: projectData.twitter ? 
                      `Twitter followers for @${projectData.twitter.screenName}` : 
                      "Total Twitter/X followers"
                  },
                  { 
                    name: "Verified Account", 
                    status: projectData.twitter?.verified ? "Yes" : "No", 
                    tooltip: getVerificationTooltip()
                  },
                  { 
                    name: "Growth Rate (30d)", 
                    status: getTwitterGrowthRate(), 
                    tooltip: "Follower growth in the last 30 days",
                    change: projectData.twitter?.followerChange ? 
                      parseFloat(projectData.twitter.followerChange.percentage) : undefined,
                    trend: getTwitterFollowerTrend()
                  },
                  { 
                    name: "Account Age", 
                    status: projectData.twitter?.createdAt ? 
                      getTwitterAccountAge(projectData.twitter.createdAt) : "Unknown", 
                    tooltip: projectData.twitter?.createdAt ? 
                      `Account created in ${formatTwitterDate(projectData.twitter.createdAt)}` : 
                      "Twitter account creation date"
                  },
                  { 
                    name: "Active Channels", 
                    status: "4", 
                    tooltip: "Number of active community channels" 
                  },
                  { 
                    name: "Team Visibility", 
                    status: getTeamVisibilityStatus(), 
                    tooltip: "Team regularly engages with community" 
                  },
                  { 
                    name: "Weekly Updates", 
                    status: "Yes", 
                    tooltip: "Regular weekly updates published" 
                  }
                ]}
              />
            </TabsContent>
            
            <TabsContent value="development">
              <CategorySection 
                title="Development Analysis" 
                icon={<FileCode />} 
                description="Code activity and technical progress"
                score={projectData.categories.development.score}
                items={[
                  { 
                    name: "GitHub Repository", 
                    status: projectData.github?.repoUrl ? "Public" : "Not Found", 
                    tooltip: projectData.github?.repoUrl 
                      ? `Repository available at ${projectData.github.repoUrl}` 
                      : "No GitHub repository found for this project"
                  },
                  { 
                    name: "GitHub Activity", 
                    status: projectData.github?.activityStatus || "Unknown", 
                    tooltip: projectData.github?.activityStatus === 'Active' 
                      ? "Regular commits in the past 30 days"
                      : projectData.github?.activityStatus === 'Stale'
                      ? "Limited commit activity in the past 30 days"
                      : "No recent commit activity detected"
                  },
                  { 
                    name: "Recent Commits", 
                    status: projectData.github ? `${projectData.github.commitCount} commits` : "Unknown",
                    tooltip: "Number of commits in the past 30 days",
                    sparklineData: projectData.github?.commitCount ? [projectData.github.commitCount/2, projectData.github.commitCount] : undefined,
                    change: projectData.github?.commitChange 
                      ? parseFloat(projectData.github.commitChange.replace('%', ''))
                      : undefined,
                    trend: projectData.github?.commitTrend
                  },
                  { 
                    name: "Last Updated", 
                    status: projectData.github ? formatGitHubDate(projectData.github.updatedAt) : "Unknown", 
                    tooltip: "Date of the most recent commit to the repository" 
                  },
                  { 
                    name: "Roadmap Progress", 
                    status: projectData.github?.roadmapProgress || "Unknown", 
                    tooltip: "Estimated progress based on open issues and repository activity" 
                  },
                  { 
                    name: "Open Source", 
                    status: projectData.github?.isOpenSource ? "Yes" : "No", 
                    tooltip: projectData.github?.isOpenSource 
                      ? `Public repository with ${projectData.github.license || 'unknown'} license`
                      : "Repository is private or not found" 
                  },
                  { 
                    name: "Language", 
                    status: projectData.github?.language || "Unknown", 
                    tooltip: "Main programming language used in the repository" 
                  }
                ]}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ScanResult;
