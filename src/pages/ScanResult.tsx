import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, ShieldCheck, Droplet, LineChart, UsersRound, Code } from "lucide-react";
import { useScanToken } from "@/hooks/useScanToken";
import { TokenMetrics } from "@/api/types";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HealthScoreCard } from "@/components/HealthScoreCard";
import { KeyMetricsGrid } from "@/components/KeyMetricsGrid";
import { CategorySection } from "@/components/CategorySection";
import { RiskFactorsSection } from "@/components/RiskFactorsSection";
import { formatDistance } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

const ScanResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Fix: Change from "tokenId" to "token" parameter
  const token = new URLSearchParams(location.search).get("token") || '';
  const { scan, isLoading, progress, error } = useScanToken();
  const [projectData, setProjectData] = useState<TokenMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    console.log("Current URL parameters:", location.search);
    console.log("Token parameter value:", token);
    
    if (token) {
      startScan(token);
    } else {
      toast({
        title: "Missing token",
        description: "No token was provided. Redirecting to home page.",
        variant: "destructive",
      });
      
      // Redirect after a short delay to show the toast
      setTimeout(() => navigate('/'), 2000);
    }
  }, [token, navigate, toast]);

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
              <h2 className="text-xl font-semibold text-red-600 mb-2">Scan Error</h2>
              <p className="text-slate-700">{error}</p>
              <Button 
                onClick={() => navigate('/')} 
                className="mt-4"
              >
                Try Another Token
              </Button>
            </div>
          </div>
        ) : projectData ? (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold">{projectData.name} ({projectData.symbol})</h1>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshScan()}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <>Refreshing<span className="loading">...</span></>
                    ) : (
                      <>Refresh<RefreshCw size={14} className="ml-1" /></>
                    )}
                  </Button>
                </div>
                <Button 
                  onClick={() => navigate('/')} 
                  variant="ghost" 
                  size="sm"
                >
                  New Scan
                </Button>
              </div>
            </div>
            
            <HealthScoreCard score={projectData.healthScore} />
            <KeyMetricsGrid projectData={projectData} tokenId={token} onDataUpdate={setProjectData} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategorySection 
                title="Security" 
                icon={<ShieldCheck className="h-5 w-5" />}
                score={projectData.categories.security.score}
                description="Evaluates contract safety, ownership, and audit status" 
                items={[
                  { 
                    name: 'Contract Verified', 
                    status: projectData.auditStatus || 'Unknown',
                    tooltip: 'Indicates whether the contract code has been verified and is publicly visible'
                  },
                  { 
                    name: 'Ownership Renounced', 
                    status: projectData.goPlus?.ownershipRenounced ? 'Yes' : 'No',
                    tooltip: 'When ownership is renounced, no one can modify the contract',
                    trend: projectData.goPlus?.ownershipRenounced ? 'up' : 'down'
                  },
                  { 
                    name: 'Honeypot Risk', 
                    status: projectData.goPlus?.isHoneypot ? 'High' : 'Low',
                    tooltip: 'Detects if the token contract prevents selling (honeypot)',
                    trend: projectData.goPlus?.isHoneypot ? 'down' : 'up'
                  },
                  { 
                    name: 'Can Mint New Tokens', 
                    status: projectData.goPlus?.canMint ? 'Yes' : 'No',
                    tooltip: 'If enabled, the contract owner can create new tokens at will',
                    trend: projectData.goPlus?.canMint ? 'down' : 'up'
                  },
                  { 
                    name: 'Open Source', 
                    status: projectData.goPlus?.isOpenSource ? 'Yes' : 'No',
                    tooltip: 'Indicates if the contract source code is publicly available',
                    trend: projectData.goPlus?.isOpenSource ? 'up' : 'down'
                  },
                  { 
                    name: 'External Calls', 
                    status: projectData.goPlus?.hasExternalCalls ? 'Yes' : 'No',
                    tooltip: 'Contract may call external contracts which could be malicious',
                    trend: projectData.goPlus?.hasExternalCalls ? 'down' : 'neutral'
                  }
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
            </div>

            <div className="grid grid-cols-1 gap-6">
              <CategorySection 
                title="Development" 
                icon={<Code className="h-5 w-5" />}
                score={projectData.categories.development.score}
                description="Evaluates code activity and repository health" 
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
                    name: 'Primary Language', 
                    status: projectData.github?.language || 'Unknown',
                    tooltip: 'Main programming language used in the repository' 
                  },
                  { 
                    name: 'Last Update', 
                    status: projectData.github?.updatedAt ? formatDistance(new Date(projectData.github.updatedAt), new Date(), { addSuffix: true }) : 'Unknown',
                    tooltip: 'Time since the last update to the repository' 
                  },
                  { 
                    name: 'Roadmap Progress', 
                    status: projectData.github?.roadmapProgress || 'Unknown',
                    tooltip: 'Progress against published roadmap if available' 
                  },
                  { 
                    name: 'Open Issues', 
                    status: projectData.github?.openIssues?.toString() || 'Unknown',
                    tooltip: 'Number of unresolved issues in the repository' 
                  }
                ]}
              />
              
              <RiskFactorsSection projectData={projectData} />
            </div>
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">No Data Available</h2>
              <p className="text-slate-600">We couldn't find data for this token. Please try another one.</p>
              <Button 
                onClick={() => navigate('/')} 
                className="mt-6"
              >
                Try Another Token
              </Button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ScanResult;
