import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw } from "lucide-react";
import { useScanToken } from "@/hooks/useScanToken";
import { TokenMetrics } from "@/api/types";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HealthScoreCard } from "@/components/HealthScoreCard";
import { KeyMetricsGrid } from "@/components/KeyMetricsGrid";
import { CategorySection } from "@/components/CategorySection";
import { RiskFactorsSection } from "@/components/RiskFactorsSection";
import { formatDistance } from 'date-fns';

const ScanResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tokenId = new URLSearchParams(location.search).get("tokenId") || '';
  const { scan, isLoading, progress, error } = useScanToken();
  const [projectData, setProjectData] = useState<TokenMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (tokenId) {
      startScan(tokenId);
    } else {
      navigate('/'); // Redirect if no token ID
    }
  }, [tokenId, navigate]);

  const startScan = async (tokenId: string) => {
    const data = await scan(tokenId);
    setProjectData(data);
  };

  const refreshScan = async () => {
    setIsRefreshing(true);
    if (tokenId) {
      const data = await scan(tokenId);
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
            
            <HealthScoreCard healthScore={projectData.healthScore} />
            <KeyMetricsGrid projectData={projectData} tokenId={tokenId} onDataUpdate={setProjectData} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategorySection 
                title="Security" 
                score={projectData.categories.security.score}
                description="Evaluates contract safety, ownership, and audit status" 
                items={[
                  { 
                    label: 'Contract Verified', 
                    value: projectData.auditStatus || 'Unknown',
                    valueClass: projectData.auditStatus === 'Verified' ? 'text-green-600' : 
                               projectData.auditStatus === 'High Risk' ? 'text-red-600' : 'text-yellow-600' 
                  },
                  { 
                    label: 'Ownership Renounced', 
                    value: projectData.goPlus?.ownershipRenounced ? 'Yes' : 'No',
                    valueClass: projectData.goPlus?.ownershipRenounced ? 'text-green-600' : 'text-red-600'
                  },
                  { 
                    label: 'Honeypot Risk', 
                    value: projectData.goPlus?.isHoneypot ? 'High' : 'Low',
                    valueClass: projectData.goPlus?.isHoneypot ? 'text-red-600' : 'text-green-600'
                  },
                  { 
                    label: 'Can Mint New Tokens', 
                    value: projectData.goPlus?.canMint ? 'Yes' : 'No',
                    valueClass: projectData.goPlus?.canMint ? 'text-red-600' : 'text-green-600'
                  },
                  { 
                    label: 'Open Source', 
                    value: projectData.goPlus?.isOpenSource ? 'Yes' : 'No',
                    valueClass: projectData.goPlus?.isOpenSource ? 'text-green-600' : 'text-red-600'
                  },
                  { 
                    label: 'External Calls', 
                    value: projectData.goPlus?.hasExternalCalls ? 'Yes' : 'No',
                    valueClass: projectData.goPlus?.hasExternalCalls ? 'text-yellow-600' : 'text-green-600'
                  }
                ]}
              />
              
              <CategorySection 
                title="Liquidity" 
                score={projectData.categories.liquidity.score}
                description="Evaluates pool size, locked liquidity, and trading volume" 
                items={[
                  { label: 'Total Value Locked', value: projectData.tvl || 'Unknown' },
                  { label: 'Liquidity Lock', value: projectData.liquidityLock || 'Unknown' },
                  { label: '24h Volume', value: projectData.volume24h || 'Unknown' },
                  { label: '24h Transactions', value: projectData.txCount24h?.toString() || 'Unknown' },
                  { label: 'Pool Age', value: projectData.poolAge || 'Unknown' },
                  { 
                    label: 'DEX', 
                    value: projectData.network ? projectData.network.toUpperCase() : 'Unknown'
                  }
                ]}
              />
              
              <CategorySection 
                title="Tokenomics" 
                score={projectData.categories.tokenomics.score}
                description="Evaluates distribution, supply, and taxation" 
                items={[
                  { label: 'Market Cap', value: projectData.marketCap || 'Unknown' },
                  { label: 'Top Holders', value: projectData.topHoldersPercentage || 'Unknown' },
                  { 
                    label: 'Buy Tax', 
                    value: projectData.goPlus?.buyTax || '0%',
                    valueClass: projectData.goPlus?.buyTax === '0%' ? 'text-green-600' : 'text-yellow-600'
                  },
                  { 
                    label: 'Sell Tax', 
                    value: projectData.goPlus?.sellTax || '0%',
                    valueClass: projectData.goPlus?.sellTax === '0%' ? 'text-green-600' : 'text-yellow-600'
                  },
                  { 
                    label: 'Can Change Balance', 
                    value: projectData.goPlus?.ownerCanChangeBalance ? 'Yes' : 'No',
                    valueClass: projectData.goPlus?.ownerCanChangeBalance ? 'text-red-600' : 'text-green-600'
                  },
                  { 
                    label: 'Risk Level', 
                    value: projectData.goPlus?.riskLevel || 'Unknown',
                    valueClass: projectData.goPlus?.riskLevel === 'Low' ? 'text-green-600' : 
                               projectData.goPlus?.riskLevel === 'High' ? 'text-red-600' : 'text-yellow-600'
                  }
                ]}
              />
              
              <CategorySection 
                title="Community" 
                score={projectData.categories.community.score}
                description="Evaluates social media presence and engagement" 
                items={[
                  { label: 'Social Followers', value: projectData.socialFollowers || '0' },
                  { label: 'Twitter Account', value: projectData.twitter?.verified ? 'Verified' : 'Standard' },
                  { label: 'Community Growth', value: projectData.twitter?.followerChange?.percentage || 'Unknown' },
                  { label: 'Account Age', value: projectData.twitter?.createdAt ? formatDistance(new Date(projectData.twitter.createdAt), new Date(), { addSuffix: true }) : 'Unknown' },
                  { label: 'Tweet Count', value: projectData.twitter?.tweetCount?.toString() || 'Unknown' },
                  { label: 'Twitter Handle', value: projectData.twitter?.screenName || 'Unknown' }
                ]}
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <CategorySection 
                title="Development" 
                score={projectData.categories.development.score}
                description="Evaluates code activity and repository health" 
                items={[
                  { label: 'GitHub Repository', value: projectData.github ? 'Available' : 'Not Found' },
                  { label: 'Activity Status', value: projectData.github?.activityStatus || 'Unknown' },
                  { label: 'Recent Commits', value: projectData.github?.commitCount?.toString() || 'Unknown' },
                  { label: 'Stars', value: projectData.github?.starCount?.toString() || 'Unknown' },
                  { label: 'Forks', value: projectData.github?.forkCount?.toString() || 'Unknown' },
                  { label: 'License', value: projectData.github?.license || 'Unknown' },
                  { label: 'Primary Language', value: projectData.github?.language || 'Unknown' },
                  { label: 'Last Update', value: projectData.github?.updatedAt ? formatDistance(new Date(projectData.github.updatedAt), new Date(), { addSuffix: true }) : 'Unknown' },
                  { label: 'Roadmap Progress', value: projectData.github?.roadmapProgress || 'Unknown' },
                  { label: 'Open Issues', value: projectData.github?.openIssues?.toString() || 'Unknown' }
                ]}
              />
              
              <RiskFactorsSection goPlus={projectData.goPlus} />
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
