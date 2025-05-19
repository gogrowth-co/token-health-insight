import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { TokenInfoCard } from "@/components/TokenInfoCard";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { useTokenMetrics } from "@/hooks/useTokenMetrics";
import { TokenHeader } from "@/components/scan-result/TokenHeader";
import { TabNavigation } from "@/components/scan-result/TabNavigation";
import { CategoryTabs } from "@/components/scan-result/CategoryTabs";
import { useHealthScore } from "@/components/scan-result/useHealthScore";

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
  const { user, isLoading: authLoading } = useAuth();
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

  // Calculate health score
  const healthScore = useHealthScore(tokenMetrics, tokenInfo);

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
            <TokenHeader 
              tokenName={tokenName}
              tokenSymbol={tokenSymbol}
              healthScore={healthScore}
            />
            
            {/* Token Info Card - Now includes Market Cap and TVL */}
            <TokenInfoCard 
              token={tokenInfo} 
              tokenMetrics={tokenMetrics}
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
            <TabNavigation 
              activeTab={activeTab}
              onValueChange={handleTabChange}
              className="mt-6"
            />
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Tabs Content - KeyMetricsGrid has been removed */}
          <CategoryTabs
            activeTab={activeTab}
            onValueChange={handleTabChange}
            token={tokenInfo}
            tokenId={token}
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
            tokenMetrics={tokenMetrics}
            tokenLoading={tokenLoading}
            tokenError={tokenError as Error | null}
            metricsLoading={metricsLoading}
            metricsError={metricsError as Error | null}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ScanResult;
