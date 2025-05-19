
import { useState, useEffect } from "react";
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
import { ShieldCheck, CircleCheck, CircleDot, CircleX, CircleHelp, TrendingUp, FileCode, Users, Calendar } from "lucide-react";

const ScanResult = () => {
  const {
    user,
    isLoading: authLoading
  } = useAuth();
  
  const { tokenId } = useParams();
  const [searchParams] = useSearchParams();
  // Get token from URL params - use exactly as provided without normalization
  const tokenFromQuery = searchParams.get("token");
  const token = tokenId || tokenFromQuery || "";
  const [activeTab, setActiveTab] = useState("overview");

  // Log the token being used for this scan
  useEffect(() => {
    console.log(`[ScanResult] Viewing results for token: ${token}`);
  }, [token]);

  // Fetch token info - pass token directly without client-side normalization
  const {
    data: tokenInfo,
    isLoading: tokenLoading,
    error: tokenError
  } = useTokenInfo(token);

  // Log what we got back from the API
  useEffect(() => {
    if (tokenInfo) {
      console.log(`[ScanResult] Received token info: ${tokenInfo.name} (${tokenInfo.symbol}) with id: ${tokenInfo.id}`);
    }
    if (tokenError) {
      console.error(`[ScanResult] Token info error:`, tokenError);
    }
  }, [tokenInfo, tokenError]);

  // Show toast for errors
  if (tokenError && !tokenLoading) {
    toast({
      title: "Error loading token data",
      description: "We couldn't fetch information for this token. Please check the token symbol and try again.",
      variant: "destructive"
    });
  }

  // Redirect to auth page if not authenticated
  if (!authLoading && !user) {
    return <Navigate to={`/auth?token=${encodeURIComponent(token)}`} />;
  }

  // Function to calculate health score based on actual token metrics
  const calculateHealthScore = (tokenInfo: any) => {
    // This is a placeholder for a more complex calculation
    // In a full implementation, this would use metrics from various categories
    
    // Default to moderate score if no data
    if (!tokenInfo) return 65;
    
    let score = 65; // Base score
    
    // Adjust score based on available metrics
    if (tokenInfo.market_cap_rank && tokenInfo.market_cap_rank < 100) {
      score += 15; // Bonus for top 100 tokens
    } else if (tokenInfo.market_cap_rank && tokenInfo.market_cap_rank < 500) {
      score += 10; // Bonus for top 500 tokens
    }
    
    // Penalize if price is dropping significantly
    if (tokenInfo.price_change_percentage_24h && tokenInfo.price_change_percentage_24h < -10) {
      score -= 5;
    }
    
    // Cap score between 0-100
    return Math.max(0, Math.min(100, score));
  };
  
  const healthScore = calculateHealthScore(tokenInfo);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Display name and symbol information
  const tokenName = tokenInfo?.name || "Loading...";
  const tokenSymbol = tokenInfo?.symbol?.toUpperCase() || token.replace(/^\$/, '').toUpperCase();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        {/* Project Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{tokenName}</h1>
                <Badge variant="outline" className="text-sm font-medium">
                  ${tokenSymbol}
                </Badge>
              </div>
              <HealthScoreCard score={healthScore} />
            </div>
            
            {/* Token Info Card */}
            <TokenInfoCard token={tokenInfo} isLoading={tokenLoading} error={tokenError as Error} />
            
            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
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
                <KeyMetricsGrid token={tokenInfo} tokenId={token} isLoading={tokenLoading} />
              </section>
              
              {/* Categories Overview Section */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Categories Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <CategoryCard 
                    title="Security" 
                    icon={<ShieldCheck className="text-white" />} 
                    description="Contract and protocol security analysis" 
                    metrics={["Ownership Renounced: Yes", "Can Mint: No", "Code Audit: Yes", "Multi-Sig Wallet: Partial"]} 
                    color="bg-green-500" 
                    score={72} 
                  />
                  
                  <CategoryCard 
                    title="Liquidity" 
                    icon={<TrendingUp className="text-white" />} 
                    description="Market depth and trading analysis" 
                    metrics={["Liquidity Lock: 365 days", "CEX Listings: 2", "DEX Depth: Good", "Holder Distribution: Moderate"]} 
                    color="bg-blue-500" 
                    score={82} 
                  />
                  
                  <CategoryCard 
                    title="Tokenomics" 
                    icon={<CircleDot className="text-white" />} 
                    description="Supply and distribution analysis" 
                    metrics={["Supply Cap: Yes (100M)", "Token Distribution: Good", "Treasury Size: $500K", "Burn Mechanism: Yes"]} 
                    color="bg-purple-500" 
                    score={65} 
                  />
                  
                  <CategoryCard 
                    title="Community" 
                    icon={<Users className="text-white" />} 
                    description="Social and community engagement" 
                    metrics={["Twitter Followers: 12.4K", "Verified Account: Yes", "Growth Rate (30d): +18%", "Active Channels: 4"]} 
                    color="bg-orange-500" 
                    score={85} 
                  />
                  
                  <CategoryCard 
                    title="Development" 
                    icon={<FileCode className="text-white" />} 
                    description="Development activity and roadmap progress" 
                    metrics={["GitHub Repo: Public", "Last Commit: 3 days ago", "Commit Frequency: High", "Contributors: 8"]} 
                    color="bg-teal-500" 
                    score={70} 
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
                score={72} 
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
                score={82} 
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
                score={65} 
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
                score={85} 
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
                score={70} 
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
