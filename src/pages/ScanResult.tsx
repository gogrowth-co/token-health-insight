import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, ShieldCheck, Droplet, LineChart, UsersRound, Code, AlertCircle } from "lucide-react";
import { useScanToken } from "@/hooks/useScanToken";
import { TokenMetrics } from "@/api/types";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HealthScoreCard } from "@/components/HealthScoreCard";
import { KeyMetricsGrid } from "@/components/KeyMetricsGrid";
import { CategorySection } from "@/components/CategorySection";
import { RiskFactorsSection } from "@/components/RiskFactorsSection";
import { MetricQualityBadge } from "@/components/MetricQualityBadge";
import { formatDistance } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cleanTokenId } from '@/api/coingecko';
import { useTokenSecurity } from "@/hooks/useTokenSecurity";
import { SecurityPanel } from "@/components/SecurityPanel";

const ScanResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  // Get token from query parameters
  const token = new URLSearchParams(location.search).get("token") || '';
  
  const { scan, isLoading, progress, error } = useScanToken();
  const [projectData, setProjectData] = useState<TokenMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scanAttempted, setScanAttempted] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const contractAddress = projectData?.etherscan?.contractAddress || null;
  
  // Add the security data hook
  const { 
    data: securityData, 
    isLoading: securityLoading, 
    error: securityError 
  } = useTokenSecurity(contractAddress);
  
  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("ScanResult: User not authenticated, redirecting to auth with token:", token);
      if (token) {
        navigate(`/auth?tab=signup&token=${encodeURIComponent(token)}`);
      } else {
        navigate('/auth?tab=signin');
      }
      return;
    }
    
    // Only proceed with scan if authenticated and token exists
    if (!authLoading && user && token) {
      console.log("ScanResult: User authenticated, starting scan for token:", token);
      startScan(token);
      setScanAttempted(true);
    } else if (!authLoading && user && !token) {
      // Notify user that no token was provided
      toast({
        title: "Missing token",
        description: "No token was provided. Please enter a token to scan.",
        variant: "destructive",
      });
      
      // Redirect to dashboard after a short delay to show the toast
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  }, [token, navigate, toast, user, authLoading]);

  const startScan = async (tokenValue: string) => {
    console.log("Starting scan for token:", tokenValue);
    const data = await scan(tokenValue);
    setProjectData(data);
  };

  const refreshScan = async () => {
    setIsRefreshing(true);
    if (token) {
      const data = await scan(token);
      setProjectData(data);
    }
    setIsRefreshing(false);
  };

  const getSuggestedTokens = () => {
    // Return some popular tokens that are known to work well
    return [
      { id: 'bitcoin', name: 'Bitcoin (BTC)' },
      { id: 'ethereum', name: 'Ethereum (ETH)' },
      { id: 'pepe', name: 'Pepe (PEPE)' },
      { id: 'dogecoin', name: 'Dogecoin (DOGE)' },
      { id: 'shiba-inu', name: 'Shiba Inu (SHIB)' }
    ];
  };

  const tryAnotherToken = (tokenId: string) => {
    navigate(`/scan?token=${encodeURIComponent(tokenId)}`);
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-8">
            <Progress value={30} className="w-full max-w-md" />
            <div className="text-lg font-medium">
              Checking authentication...
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Token header component with name, symbol, health score, and data quality badge
  const TokenHeader = ({ data }: { data: TokenMetrics }) => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{data.name} ({data.symbol})</h1>
            <div className="flex items-center mt-1 gap-3">
              <MetricQualityBadge quality={data.dataQuality || "partial"} />
              <span className="text-sm text-gray-500">Token ID: {token}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <HealthScoreCard score={data.healthScore} />
          <Button
            variant="outline"
            size="sm"
            onClick={refreshScan}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>Refreshing<span className="loading">...</span></>
            ) : (
              <>Refresh <RefreshCw size={14} className="ml-1" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-8">
            <Progress value={progress} className="w-full max-w-md" />
            <div className="text-lg font-medium">
              {progress < 30 ? "Initializing scan..." : 
               progress < 60 ? "Analyzing on-chain data..." :
               progress < 90 ? "Gathering token metrics..." : 
               "Finalizing results..."}
            </div>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
              <div className="flex flex-col items-center mb-6">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-xl font-semibold text-red-600 mb-2">Scan Error</h2>
                <p className="text-slate-700 mb-4">{error}</p>
                <p className="text-slate-600 text-sm">
                  We couldn't retrieve data for <strong>{token}</strong>. 
                  Please check the token name or address and try again.
                </p>
              </div>
              
              <div className="mt-6">
                <h3 className="text-md font-medium text-slate-800 mb-3">Try one of these popular tokens:</h3>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {getSuggestedTokens().map((suggestedToken) => (
                    <Button 
                      key={suggestedToken.id}
                      variant="outline"
                      size="sm"
                      onClick={() => tryAnotherToken(suggestedToken.id)}
                      className="text-xs"
                    >
                      {suggestedToken.name}
                    </Button>
                  ))}
                </div>
                
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  className="w-full"
                >
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </div>
        ) : projectData ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Button 
                onClick={() => navigate('/dashboard')} 
                variant="ghost" 
                size="sm"
              >
                Back to Dashboard
              </Button>
              <Button 
                onClick={() => navigate('/dashboard')} 
                variant="ghost" 
                size="sm"
              >
                New Scan
              </Button>
            </div>
            
            {/* Token header with name and health score */}
            <TokenHeader data={projectData} />
            
            {/* Key metrics grid section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Key Metrics</h2>
              <KeyMetricsGrid projectData={projectData} tokenId={token} onDataUpdate={setProjectData} />
            </div>
            
            {/* Main content tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="overview" className="min-w-max">Overview</TabsTrigger>
                  <TabsTrigger value="security" className="min-w-max">Security</TabsTrigger>
                  <TabsTrigger value="liquidity" className="min-w-max">Liquidity</TabsTrigger>
                  <TabsTrigger value="tokenomics" className="min-w-max">Tokenomics</TabsTrigger>
                  <TabsTrigger value="community" className="min-w-max">Community</TabsTrigger>
                  <TabsTrigger value="development" className="min-w-max">Development</TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-6">
                <TabsContent value="overview" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CategorySection 
                      title="Security" 
                      icon={<ShieldCheck className="h-5 w-5" />}
                      score={projectData.categories.security.score}
                      description="Evaluates contract safety, ownership, and audit status" 
                      items={[
                        { 
                          name: 'Contract Verified', 
                          status: securityData?.contractVerified ? 'Yes' : 'No',
                          tooltip: 'Indicates whether the contract code has been verified and is publicly visible',
                          trend: securityData?.contractVerified ? 'up' : 'down'
                        },
                        { 
                          name: 'Ownership Renounced', 
                          status: securityData?.ownershipRenounced ? 'Yes' : 'No',
                          tooltip: 'When ownership is renounced, no one can modify the contract',
                          trend: securityData?.ownershipRenounced ? 'up' : 'down'
                        },
                        { 
                          name: 'Honeypot Risk', 
                          status: securityData?.honeypotRisk || 'Unknown',
                          tooltip: 'Detects if the token contract prevents selling (honeypot)',
                          trend: securityData?.honeypotRisk === 'Low' ? 'up' : 'down'
                        },
                      ]}
                    />
                    
                    <CategorySection 
                      title="Liquidity" 
                      icon={<Droplet className="h-5 w-5" />}
                      score={projectData.categories.liquidity.score}
                      description="Evaluates pool size, locked liquidity, and trading volume" 
                      items={[
                        { 
                          name: 'Total Value Locked', 
                          status: projectData.tvl || 'Unknown',
                          tooltip: 'The total amount of funds locked in liquidity pools'
                        },
                        { 
                          name: 'Liquidity Lock', 
                          status: projectData.liquidityLock || 'Unknown',
                          tooltip: 'Indicates if and how long the liquidity is locked'
                        },
                        { 
                          name: '24h Volume', 
                          status: projectData.volume24h || 'Unknown',
                          tooltip: 'Trading volume in the last 24 hours'
                        },
                      ]}
                    />
                    
                    <CategorySection 
                      title="Tokenomics" 
                      icon={<LineChart className="h-5 w-5" />}
                      score={projectData.categories.tokenomics.score}
                      description="Evaluates distribution, supply, and taxation" 
                      items={[
                        { 
                          name: 'Market Cap', 
                          status: projectData.marketCap || 'Unknown',
                          tooltip: 'Total market value of the circulating supply'
                        },
                        { 
                          name: 'Top Holders', 
                          status: projectData.topHoldersPercentage || 'Unknown',
                          tooltip: 'Percentage owned by the top wallet holders'
                        },
                        { 
                          name: 'Buy Tax', 
                          status: projectData.goPlus?.buyTax || '0%',
                          tooltip: 'Fee applied when buying this token',
                          trend: projectData.goPlus?.buyTax === '0%' ? 'up' : 'down'
                        },
                      ]}
                    />
                    
                    <CategorySection 
                      title="Community" 
                      icon={<UsersRound className="h-5 w-5" />}
                      score={projectData.categories.community.score}
                      description="Evaluates social media presence and engagement" 
                      items={[
                        { 
                          name: 'Social Followers', 
                          status: projectData.socialFollowers || '0',
                          tooltip: 'Total followers across all social platforms'
                        },
                        { 
                          name: 'Twitter Account', 
                          status: projectData.twitter?.verified ? 'Verified' : 'Standard',
                          tooltip: 'Twitter verification status'
                        },
                        { 
                          name: 'Community Growth', 
                          status: projectData.twitter?.followerChange?.percentage || 'Unknown',
                          tooltip: 'Follower growth rate in recent period',
                          change: projectData.twitter?.followerChange?.value
                        },
                      ]}
                    />
                  </div>
                  
                  {/* Update to the new RiskFactorsSection with security data */}
                  <RiskFactorsSection securityData={securityData} isLoading={securityLoading} />
                </TabsContent>
                
                <TabsContent value="security" className="mt-0">
                  <SecurityPanel 
                    securityData={securityData}
                    isLoading={securityLoading} 
                    securityScore={projectData.categories.security.score}
                  />
                </TabsContent>
                
                <TabsContent value="liquidity" className="mt-0">
                  <CategorySection 
                    title="Liquidity" 
                    icon={<Droplet className="h-5 w-5" />}
                    score={projectData.categories.liquidity.score}
                    description="Evaluates pool size, locked liquidity, and trading volume" 
                    fullWidth={true}
                    items={[
                      { 
                        name: 'Total Value Locked', 
                        status: projectData.tvl || 'Unknown',
                        tooltip: 'The total amount of funds locked in liquidity pools'
                      },
                      { 
                        name: 'Liquidity Lock', 
                        status: projectData.liquidityLock || 'Unknown',
                        tooltip: 'Indicates if and how long the liquidity is locked'
                      },
                      { 
                        name: '24h Volume', 
                        status: projectData.volume24h || 'Unknown',
                        tooltip: 'Trading volume in the last 24 hours'
                      },
                      { 
                        name: '24h Transactions', 
                        status: projectData.txCount24h?.toString() || 'Unknown',
                        tooltip: 'Number of transactions in the last 24 hours'
                      },
                      { 
                        name: 'Pool Age', 
                        status: projectData.poolAge || 'Unknown',
                        tooltip: 'How long the trading pool has been active'
                      },
                      { 
                        name: 'DEX', 
                        status: projectData.network ? projectData.network.toUpperCase() : 'Unknown',
                        tooltip: 'The decentralized exchange where this token is traded'
                      }
                    ]}
                  />
                </TabsContent>
                
                <TabsContent value="tokenomics" className="mt-0">
                  <CategorySection 
                    title="Tokenomics" 
                    icon={<LineChart className="h-5 w-5" />}
                    score={projectData.categories.tokenomics.score}
                    description="Evaluates distribution, supply, and taxation" 
                    fullWidth={true}
                    items={[
                      { 
                        name: 'Market Cap', 
                        status: projectData.marketCap || 'Unknown',
                        tooltip: 'Total market value of the circulating supply'
                      },
                      { 
                        name: 'Top Holders', 
                        status: projectData.topHoldersPercentage || 'Unknown',
                        tooltip: 'Percentage owned by the top wallet holders'
                      },
                      { 
                        name: 'Buy Tax', 
                        status: projectData.goPlus?.buyTax || '0%',
                        tooltip: 'Fee applied when buying this token',
                        trend: projectData.goPlus?.buyTax === '0%' ? 'up' : 'down'
                      },
                      { 
                        name: 'Sell Tax', 
                        status: projectData.goPlus?.sellTax || '0%',
                        tooltip: 'Fee applied when selling this token',
                        trend: projectData.goPlus?.sellTax === '0%' ? 'up' : 'down'
                      },
                      { 
                        name: 'Can Change Balance', 
                        status: projectData.goPlus?.ownerCanChangeBalance ? 'Yes' : 'No',
                        tooltip: 'Owner can modify balances without user consent',
                        trend: projectData.goPlus?.ownerCanChangeBalance ? 'down' : 'up'
                      },
                      { 
                        name: 'Risk Level', 
                        status: projectData.goPlus?.riskLevel || 'Unknown',
                        tooltip: 'Overall contract risk level based on multiple factors',
                        trend: projectData.goPlus?.riskLevel === 'Low' ? 'up' : 
                               projectData.goPlus?.riskLevel === 'High' ? 'down' : 'neutral'
                      }
                    ]}
                  />
                </TabsContent>
                
                <TabsContent value="community" className="mt-0">
                  <CategorySection 
                    title="Community" 
                    icon={<UsersRound className="h-5 w-5" />}
                    score={projectData.categories.community.score}
                    description="Evaluates social media presence and engagement" 
                    fullWidth={true}
                    items={[
                      { 
                        name: 'Social Followers', 
                        status: projectData.socialFollowers || '0',
                        tooltip: 'Total followers across all social platforms'
                      },
                      { 
                        name: 'Twitter Account', 
                        status: projectData.twitter?.verified ? 'Verified' : 'Standard',
                        tooltip: 'Twitter verification status'
                      },
                      { 
                        name: 'Community Growth', 
                        status: projectData.twitter?.followerChange?.percentage || 'Unknown',
                        tooltip: 'Follower growth rate in recent period',
                        change: projectData.twitter?.followerChange?.value
                      },
                      { 
                        name: 'Account Age', 
                        status: projectData.twitter?.createdAt ? formatDistance(new Date(projectData.twitter.createdAt), new Date(), { addSuffix: true }) : 'Unknown',
                        tooltip: 'How long the Twitter account has existed'
                      },
                      { 
                        name: 'Tweet Count', 
                        status: projectData.twitter?.tweetCount?.toString() || 'Unknown',
                        tooltip: 'Total number of tweets from this account'
                      },
                      { 
                        name: 'Twitter Handle', 
                        status: projectData.twitter?.screenName || 'Unknown',
                        tooltip: 'The Twitter username'
                      }
                    ]}
                  />
                </TabsContent>
                
                <TabsContent value="development" className="mt-0">
                  <CategorySection 
                    title="Development" 
                    icon={<Code className="h-5 w-5" />}
                    score={projectData.categories.development.score}
                    description="Evaluates code activity and repository health" 
                    fullWidth={true}
                    items={[
                      { 
                        name: 'GitHub Repository', 
                        status: projectData.github ? 'Available' : 'Not Found',
                        tooltip: 'Indicates if a GitHub repository exists for this project'
                      },
                      { 
                        name: 'Activity Status', 
                        status: projectData.github?.activityStatus || 'Unknown',
                        tooltip: 'Level of recent development activity'
                      },
                      { 
                        name: 'Recent Commits', 
                        status: projectData.github?.commitCount?.toString() || 'Unknown',
                        tooltip: 'Number of code commits in recent period'
                      },
                      { 
                        name: 'Stars', 
                        status: projectData.github?.starCount?.toString() || 'Unknown',
                        tooltip: 'Number of GitHub stars, indicating popularity'
                      },
                      { 
                        name: 'Forks', 
                        status: projectData.github?.forkCount?.toString() || 'Unknown',
                        tooltip: 'Number of GitHub forks of this repository'
                      },
                      { 
                        name: 'License', 
                        status: projectData.github?.license || 'Unknown',
                        tooltip: 'Type of open source license used'
                      },
                      { 
                        name: 'Last Update', 
                        status: projectData.github?.updatedAt ? formatDistance(new Date(projectData.github.updatedAt), new Date(), { addSuffix: true }) : 'Unknown',
                        tooltip: 'Time since the last update to the repository' 
                      },
                    ]}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        ) : (
          <div className="py-16 text-center">
            {scanAttempted ? (
              <div className="bg-white rounded-lg shadow p-6">
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 mb-4">No Data Available</h2>
                <p className="text-slate-600 mb-6">We couldn't find data for <strong>{token}</strong>. Please try another token.</p>
                
                <div className="mb-6">
                  <h3 className="text-md font-medium text-slate-800 mb-3">Try one of these popular tokens:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {getSuggestedTokens().map((suggestedToken) => (
                      <Button 
                        key={suggestedToken.id}
                        variant="outline"
                        size="sm"
                        onClick={() => tryAnotherToken(suggestedToken.id)}
                        className="text-xs"
                      >
                        {suggestedToken.name}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  className="w-full"
                >
                  Return to Dashboard
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Progress value={30} className="w-full max-w-md" />
                <div className="mt-4 text-lg font-medium">
                  Initializing scan...
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ScanResult;
