import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useParams, useSearchParams, useNavigate } from "react-router-dom";
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
import { useTokenMetrics } from "@/hooks/useTokenMetrics";
import { SecurityMetricsSection } from "@/components/SecurityMetricsSection";

interface TokenMetadata {
  id: string;
  name?: string;
  symbol?: string;
  logo?: string;
  marketCap?: string;
  price?: string;
  contract_address?: string;
  blockchain?: string;
  twitter?: string;
  github?: string;
}

const ScanResult = () => {
  const {
    user,
    isLoading: authLoading
  } = useAuth();
  
  const navigate = useNavigate();
  const { tokenId } = useParams();
  const [searchParams] = useSearchParams();
  
  // Get token from URL params - use exactly as provided without normalization
  const tokenFromQuery = searchParams.get("token");
  const token = tokenId || tokenFromQuery || "";
  
  // Get all metadata passed in query params
  const tokenNameFromQuery = searchParams.get("name");
  const tokenSymbolFromQuery = searchParams.get("symbol");
  const tokenLogoFromQuery = searchParams.get("logo");
  const marketCapFromQuery = searchParams.get("market_cap");
  const priceFromQuery = searchParams.get("price");
  const contractAddressFromQuery = searchParams.get("contract_address");
  const blockchainFromQuery = searchParams.get("blockchain");
  const twitterFromQuery = searchParams.get("twitter");
  const githubFromQuery = searchParams.get("github");
  
  // Keep track of token metadata from various sources
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata>({
    id: token,
    name: tokenNameFromQuery || undefined,
    symbol: tokenSymbolFromQuery || undefined,
    logo: tokenLogoFromQuery || undefined,
    marketCap: marketCapFromQuery || undefined,
    price: priceFromQuery || undefined,
    contract_address: contractAddressFromQuery || undefined,
    blockchain: blockchainFromQuery || undefined,
    twitter: twitterFromQuery || undefined,
    github: githubFromQuery || undefined
  });
  
  const [activeTab, setActiveTab] = useState("overview");
  
  // Refresh state
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Log the token being used for this scan
  useEffect(() => {
    console.log(`[ScanResult] Viewing results for token: ${token}`);
    console.log(`[ScanResult] Initial metadata:`, tokenMetadata);
    
    // Verify we have a token
    if (!token) {
      console.warn("[ScanResult] No token ID provided");
      toast({
        title: "Missing token",
        description: "Please select a token to scan",
        variant: "destructive"
      });
      navigate("/");
      return;
    }
    
    // Update metadata from URL params if available
    if (tokenNameFromQuery || tokenSymbolFromQuery || tokenLogoFromQuery) {
      console.log(`[ScanResult] Using metadata from URL: ${tokenNameFromQuery || 'N/A'} (${tokenSymbolFromQuery || 'N/A'})`);
    }
    
    if (twitterFromQuery) {
      console.log(`[ScanResult] Twitter handle from URL: ${twitterFromQuery}`);
    }
    
    if (githubFromQuery) {
      console.log(`[ScanResult] GitHub repo from URL: ${githubFromQuery}`);
    }
  }, [token, tokenNameFromQuery, tokenSymbolFromQuery, tokenLogoFromQuery, navigate, tokenMetadata, twitterFromQuery, githubFromQuery]);

  // Fetch token info - pass token directly without client-side normalization
  const {
    data: tokenInfo,
    isLoading: tokenLoading,
    error: tokenError
  } = useTokenInfo(token);

  // Fetch token metrics
  const {
    data: tokenMetrics,
    isLoading: metricsLoading,
    error: metricsError
  } = useTokenMetrics(
    token,
    tokenInfo,
    refreshTrigger,
    false, // forceRefresh
    {
      name: tokenMetadata.name,
      symbol: tokenMetadata.symbol,
      logo: tokenMetadata.logo,
      contract_address: tokenMetadata.contract_address,
      blockchain: tokenMetadata.blockchain,
      twitter: tokenMetadata.twitter,
      github: tokenMetadata.github
    }
  );

  // Update metadata when tokenInfo is loaded
  useEffect(() => {
    if (tokenInfo && !tokenLoading) {
      console.log(`[ScanResult] Received token info: ${tokenInfo.name || 'Unknown'} (${tokenInfo.symbol || '--'}) with id: ${tokenInfo.id || token}`);
      console.log(`[ScanResult] Contract address: ${tokenInfo.contract_address || 'Not available'}`);
      console.log(`[ScanResult] Social links:`, tokenInfo.links);
      console.log(`[ScanResult] Blockchain: ${tokenInfo.blockchain || 'Not specified'}`);
      console.log(`[ScanResult] Launch date: ${tokenInfo.genesis_date || 'Not available'}`);
      
      // Only update fields that aren't already set from URL params
      setTokenMetadata(prev => ({
        id: token,
        name: prev.name || tokenInfo.name,
        symbol: prev.symbol || tokenInfo.symbol?.toUpperCase(),
        logo: prev.logo || tokenInfo.image,
        marketCap: prev.marketCap || (tokenInfo.market_cap?.toString() || undefined),
        price: prev.price || (tokenInfo.current_price?.toString() || undefined),
        contract_address: prev.contract_address || tokenInfo.contract_address,
        blockchain: prev.blockchain || tokenInfo.blockchain,
        // Use either direct twitter property or get it from links.twitter_screen_name
        twitter: prev.twitter || tokenInfo.twitter || tokenInfo.links?.twitter_screen_name,
        github: prev.github || tokenInfo.links?.github
      }));
    }
    
    if (tokenError && !tokenLoading) {
      console.error(`[ScanResult] Token info error:`, tokenError);
      
      // Show toast for errors only if we don't have alternative metadata
      if (!tokenMetadata.name) {
        toast({
          title: "Error loading token data",
          description: "We couldn't fetch information for this token. Please check the token symbol and try again.",
          variant: "destructive"
        });
      }
    }
  }, [tokenInfo, tokenError, tokenLoading, tokenMetadata.name, token]);

  // Redirect to auth page if not authenticated
  if (!authLoading && !user) {
    const authQueryParams = new URLSearchParams({
      tab: 'signup',
      token: encodeURIComponent(token)
    });
    
    // Pass all metadata we have
    if (tokenMetadata.name) authQueryParams.append('name', tokenMetadata.name);
    if (tokenMetadata.symbol) authQueryParams.append('symbol', tokenMetadata.symbol);
    if (tokenMetadata.logo) authQueryParams.append('logo', tokenMetadata.logo);
    if (tokenMetadata.contract_address) authQueryParams.append('contract_address', tokenMetadata.contract_address);
    if (tokenMetadata.blockchain) authQueryParams.append('blockchain', tokenMetadata.blockchain);
    if (tokenMetadata.twitter) authQueryParams.append('twitter', tokenMetadata.twitter);
    if (tokenMetadata.github) authQueryParams.append('github', tokenMetadata.github);
    
    return <Navigate to={`/auth?${authQueryParams.toString()}`} />;
  }
  
  // Redirect to home if no token provided
  if (!token) {
    return <Navigate to="/" />;
  }

  // Function to calculate health score based on actual token metrics
  const calculateHealthScore = () => {
    // Start with a base score
    let score = 65;
    
    if (!tokenMetrics && !tokenInfo) return score;
    
    // Adjust score based on available metrics from tokenMetrics
    if (tokenMetrics) {
      // Market cap - higher is better
      if (tokenMetrics.marketCapValue > 1000000000) { // > $1B
        score += 15;
      } else if (tokenMetrics.marketCapValue > 100000000) { // > $100M
        score += 10;
      } else if (tokenMetrics.marketCapValue > 10000000) { // > $10M
        score += 5;
      }
      
      // TVL - higher is better
      if (tokenMetrics.tvlValue > 100000000) { // > $100M
        score += 10;
      } else if (tokenMetrics.tvlValue > 10000000) { // > $10M
        score += 5;
      }
      
      // Audit status - verified is better
      if (tokenMetrics.auditStatus === "Verified") {
        score += 5;
      }
      
      // Liquidity lock - longer is better
      if (tokenMetrics.liquidityLockDays > 180) {
        score += 10;
      } else if (tokenMetrics.liquidityLockDays > 30) {
        score += 5;
      }
      
      // Top holders - less concentration is better
      if (tokenMetrics.topHoldersValue < 30) {
        score += 10;
      } else if (tokenMetrics.topHoldersValue < 50) {
        score += 5;
      } else if (tokenMetrics.topHoldersValue > 80) {
        score -= 10;
      } else if (tokenMetrics.topHoldersValue > 60) {
        score -= 5;
      }
      
      // Security metrics
      if (tokenMetrics.ownershipRenounced === "Yes") {
        score += 10;
      }
      
      if (tokenMetrics.freezeAuthority === "No") {
        score += 5;
      } else if (tokenMetrics.freezeAuthority === "Yes") {
        score -= 5;
      }
    }
    
    // Use token info as fallback or additional data
    if (tokenInfo) {
      // Market cap rank
      if (tokenInfo.market_cap_rank && tokenInfo.market_cap_rank < 100) {
        score += 5; // Bonus for top 100 tokens
      }
      
      // Price change - stable or positive is better
      if (tokenInfo.price_change_percentage_24h && tokenInfo.price_change_percentage_24h < -20) {
        score -= 5; // Big drop is concerning
      }
      
      // Add bonus for having good documentation/links
      if (tokenInfo.links) {
        if (tokenInfo.links.homepage && tokenInfo.links.homepage[0]) score += 2;
        if (tokenInfo.links.twitter_screen_name) score += 2;
        if (tokenInfo.links.github) score += 3;
      }
    }
    
    // Cap score between 0-100
    return Math.max(0, Math.min(100, score));
  };
  
  const healthScore = calculateHealthScore();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Display name and symbol information - use best available source
  const tokenName = tokenMetadata.name || tokenInfo?.name || token.replace(/^\$/, '').toUpperCase();
  const tokenSymbol = tokenMetadata.symbol || tokenInfo?.symbol?.toUpperCase() || token.replace(/^\$/, '').toUpperCase();

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
            <TokenInfoCard 
              token={tokenInfo} 
              isLoading={tokenLoading} 
              error={tokenError as Error}
              tokenMetadata={{
                id: token,
                name: tokenMetadata.name,
                symbol: tokenMetadata.symbol,
                logo: tokenMetadata.logo,
                blockchain: tokenMetadata.blockchain,
                twitter: tokenMetadata.twitter,
                github: tokenMetadata.github,
                contract_address: tokenMetadata.contract_address
              }}
            />
            
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
                <KeyMetricsGrid 
                  token={tokenInfo} 
                  tokenId={token} 
                  isLoading={tokenLoading || metricsLoading}
                  error={tokenError || metricsError}
                  tokenMetadata={{
                    id: token,
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ScanResult;
