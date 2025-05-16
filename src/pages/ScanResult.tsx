
import { useState } from "react";
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
import { TokenInfoCard } from "@/components/TokenInfoCard";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { toast } from "@/components/ui/use-toast";

import { 
  ShieldCheck, 
  CircleCheck, 
  CircleDot, 
  CircleX, 
  CircleHelp,
  TrendingUp,
  FileCode,
  Users,
  Calendar
} from "lucide-react";

const ScanResult = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { tokenId } = useParams();
  const [searchParams] = useSearchParams();
  const tokenFromQuery = searchParams.get("token");
  const token = tokenId || tokenFromQuery || "";
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch token info
  const { 
    data: tokenInfo, 
    isLoading: tokenLoading, 
    error: tokenError 
  } = useTokenInfo(token);

  // Show toast for errors
  if (tokenError && !tokenLoading) {
    toast({
      title: "Error loading token data",
      description: "We couldn't fetch information for this token. Please check the token symbol and try again.",
      variant: "destructive",
    });
  }

  // Redirect to auth page if not authenticated
  if (!authLoading && !user) {
    return <Navigate to={`/auth?token=${encodeURIComponent(token)}`} />;
  }

  // Sample project data (in a real app this would come from an API)
  const projectData = {
    name: tokenInfo?.name || "Unknown Token",
    symbol: tokenInfo?.symbol?.toUpperCase() || token.replace(/^\$/, '').toUpperCase(),
    address: tokenInfo?.contract_address || "0x0000000000000000000000000000000000000000",
    description: tokenInfo?.description || "No description available.",
    website: tokenInfo?.links?.homepage?.[0] || "",
    twitter: tokenInfo?.links?.twitter_screen_name || "",
    github: tokenInfo?.links?.github || "",
    logoUrl: tokenInfo?.image || "",
    healthScore: 78, // This would be calculated based on various metrics
    marketCap: tokenInfo?.market_cap ? `$${(tokenInfo.market_cap / 1000000).toFixed(2)}M` : "Unknown",
    liquidityLock: "365 days", // Not available from CoinGecko
    topHoldersPercentage: "42%", // Not available from CoinGecko
    tvl: "$1.2M", // Not available from CoinGecko
    auditStatus: "Verified", // Not available from CoinGecko
    socialFollowers: tokenInfo?.links?.twitter_screen_name ? "12.4K" : "Unknown", // Would need Twitter API for this
    categories: {
      security: { score: 72 },
      liquidity: { score: 82 },
      tokenomics: { score: 65 },
      community: { score: 85 },
      development: { score: 70 }
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
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
            
            {/* Token Info Card */}
            <TokenInfoCard 
              token={tokenInfo}
              isLoading={tokenLoading}
              error={tokenError as Error}
            />
            
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
                <KeyMetricsGrid projectData={projectData} />
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
                      "Ownership Renounced: Yes",
                      "Can Mint: No",
                      "Code Audit: Yes",
                      "Multi-Sig Wallet: Partial"
                    ]}
                    color="bg-green-500"
                    score={projectData.categories.security.score}
                  />
                  
                  <CategoryCard
                    title="Liquidity"
                    icon={<TrendingUp className="text-white" />}
                    description="Market depth and trading analysis"
                    metrics={[
                      "Liquidity Lock: 365 days",
                      "CEX Listings: 2",
                      "DEX Depth: Good",
                      "Holder Distribution: Moderate"
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
                      "Token Distribution: Good",
                      "Treasury Size: $500K",
                      "Burn Mechanism: Yes"
                    ]}
                    color="bg-purple-500"
                    score={projectData.categories.tokenomics.score}
                  />
                  
                  <CategoryCard
                    title="Community"
                    icon={<Users className="text-white" />}
                    description="Social and community engagement"
                    metrics={[
                      "Twitter Followers: 12.4K",
                      "Verified Account: Yes",
                      "Growth Rate (30d): +18%",
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
                      "GitHub Repo: Public",
                      "Last Commit: 3 days ago",
                      "Commit Frequency: High",
                      "Contributors: 8"
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
            
            {/* Other Tabs */}
            <TabsContent value="security">
              <CategorySection 
                title="Security Analysis" 
                icon={<ShieldCheck />} 
                description="In-depth security audit of smart contracts and protocols"
                score={projectData.categories.security.score}
                items={[
                  { name: "Ownership Renounced", status: "Yes", tooltip: "Contract ownership has been renounced, reducing centralization risk" },
                  { name: "Can Mint", status: "No", tooltip: "Contract cannot mint new tokens" },
                  { name: "Code Audit", status: "Yes", tooltip: "Smart contract audited by reputable firm" },
                  { name: "Freeze / Blacklist Authority", status: "No", tooltip: "No ability to freeze or blacklist accounts" },
                  { name: "Multi-Sig Wallet", status: "Partial", tooltip: "Some functions require multiple signatures, but not all" },
                  { name: "Insurance", status: "No", tooltip: "No insurance coverage for smart contract risks" },
                  { name: "Bug Bounty", status: "Yes", tooltip: "Active bug bounty program to identify vulnerabilities" }
                ]}
              />
            </TabsContent>
            
            <TabsContent value="liquidity">
              <CategorySection 
                title="Liquidity Analysis" 
                icon={<TrendingUp />} 
                description="Assessment of market depth, trading volume, and holder distribution"
                score={projectData.categories.liquidity.score}
                items={[
                  { name: "Liquidity Lock", status: "Yes (365 days)", tooltip: "LP tokens are locked for 1 year" },
                  { name: "CEX Listings", status: "2", tooltip: "Listed on 2 centralized exchanges" },
                  { name: "DEX Depth", status: "Good", tooltip: "Sufficient liquidity depth on decentralized exchanges" },
                  { name: "Holder Distribution", status: "Moderate", tooltip: "Some concentration among top holders but not concerning" },
                  { name: "Trading Volume", status: "$243K/24h", tooltip: "24-hour trading volume across all exchanges" }
                ]}
              />
            </TabsContent>
            
            <TabsContent value="tokenomics">
              <CategorySection 
                title="Tokenomics Analysis" 
                icon={<CircleDot />} 
                description="Token supply, distribution, and monetary policy"
                score={projectData.categories.tokenomics.score}
                items={[
                  { name: "Supply Cap", status: "Yes (100M)", tooltip: "Maximum supply is capped at 100 million tokens" },
                  { name: "Token Distribution", status: "Good", tooltip: "Well-distributed allocation across stakeholders" },
                  { name: "Treasury Size", status: "$500K", tooltip: "Project treasury holds $500,000 in assets" },
                  { name: "Vesting Schedule", status: "Yes", tooltip: "Team and investor tokens subject to vesting" },
                  { name: "Burn Mechanism", status: "Yes", tooltip: "Regular token burns from transaction fees" }
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
                  { name: "Twitter Followers", status: "12.4K", tooltip: "Total Twitter/X followers" },
                  { name: "Verified Account", status: "Yes", tooltip: "Official account is verified" },
                  { name: "Growth Rate (30d)", status: "+18%", tooltip: "Follower growth in the last 30 days" },
                  { name: "Active Channels", status: "4", tooltip: "Number of active community channels" },
                  { name: "Team Visibility", status: "High", tooltip: "Team regularly engages with community" },
                  { name: "Weekly Updates", status: "Yes", tooltip: "Regular weekly updates published" }
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
                  { name: "GitHub Repo", status: "Public", tooltip: "Code repository is publicly accessible" },
                  { name: "Last Commit Date", status: "3 days ago", tooltip: "Most recent code commit" },
                  { name: "Commit Frequency", status: "High", tooltip: "Regular code contributions" },
                  { name: "Roadmap Progress", status: "On Track", tooltip: "Development follows published roadmap" },
                  { name: "Contributors Count", status: "8", tooltip: "Number of active code contributors" },
                  { name: "License Type", status: "MIT", tooltip: "Open source under MIT license" },
                  { name: "Open Source", status: "Yes", tooltip: "Codebase is open source" }
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
