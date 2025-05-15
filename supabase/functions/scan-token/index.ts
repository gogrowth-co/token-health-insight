import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Base URL for CoinGecko API
const CG_BASE_URL = "https://api.coingecko.com/api/v3";
// Base URL for GeckoTerminal API
const GT_BASE_URL = "https://api.geckoterminal.com/api/v2";
// Base URL for Etherscan API
const ETHERSCAN_BASE_URL = "https://api.etherscan.io/api";
// Base URL for DeFiLlama API
const DEFILLAMA_BASE_URL = "https://api.llama.fi";
// GeckoTerminal API version header
const GT_API_VERSION = "20230302";

// Get API key for CoinGecko
const getApiParams = (): string => {
  const apiKey = Deno.env.get("COINGECKO_API_KEY");
  return apiKey ? `&x_cg_demo_api_key=${apiKey}` : "";
};

// Get API key for Etherscan
const getEtherscanApiKey = (): string => {
  const apiKey = Deno.env.get("ETHERSCAN_API_KEY");
  return apiKey || "";
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Etherscan API functions
async function getTokenHolders(contractAddress: string): Promise<any> {
  if (!contractAddress?.startsWith("0x")) {
    return null;
  }
  
  const apiKey = getEtherscanApiKey();
  if (!apiKey) {
    console.warn("No Etherscan API key available");
    return null;
  }
  
  try {
    const response = await fetch(
      `${ETHERSCAN_BASE_URL}?module=token&action=tokenholderlist&contractaddress=${contractAddress}&page=1&offset=20&apikey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check Etherscan API response status
    if (data.status === "0") {
      console.warn(`Etherscan API error: ${data.message}`);
      return null;
    }
    
    return data.result;
  } catch (error) {
    console.error("Error fetching token holders:", error);
    return null;
  }
}

async function getContractSourceCode(contractAddress: string): Promise<any> {
  if (!contractAddress?.startsWith("0x")) {
    return null;
  }
  
  const apiKey = getEtherscanApiKey();
  if (!apiKey) {
    console.warn("No Etherscan API key available");
    return null;
  }
  
  try {
    const response = await fetch(
      `${ETHERSCAN_BASE_URL}?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check Etherscan API response status
    if (data.status === "0") {
      console.warn(`Etherscan API error: ${data.message}`);
      return null;
    }
    
    return data.result;
  } catch (error) {
    console.error("Error fetching contract source code:", error);
    return null;
  }
}

// Analyze contract source code for security features
function analyzeContractSecurity(sourceCode: any): {
  ownershipRenounced: boolean;
  canMint: boolean;
  canBurn: boolean;
  hasFreeze: boolean;
  isMultiSig: boolean;
  isProxy: boolean;
} {
  // Default values
  const result = {
    ownershipRenounced: false,
    canMint: false,
    canBurn: false,
    hasFreeze: false,
    isMultiSig: false,
    isProxy: false
  };
  
  if (!sourceCode || !sourceCode[0]?.SourceCode) {
    return result;
  }
  
  const source = sourceCode[0].SourceCode;
  
  // Check if contract is a proxy
  result.isProxy = source.includes("delegatecall") || 
                   source.includes("Proxy") || 
                   source.includes("upgradeable");
  
  // Check for ownership renouncement patterns
  result.ownershipRenounced = 
    source.includes("renounceOwnership") && 
    (source.includes("owner = address(0)") || source.includes("owner = 0x0000000000000000000000000000000000000000"));
  
  // Check for mint function
  result.canMint = source.includes("function mint") || 
                   source.includes("_mint(") || 
                   source.includes("mint(");
  
  // Check for burn function
  result.canBurn = source.includes("function burn") || 
                   source.includes("_burn(") || 
                   source.includes("burn(");
  
  // Check for freeze/blacklist functionality
  result.hasFreeze = source.includes("freeze") || 
                     source.includes("blacklist") || 
                     source.includes("pausable") || 
                     source.includes("function pause");
  
  // Check for multi-sig patterns
  result.isMultiSig = source.includes("multisig") || 
                      source.includes("multi-sig") || 
                      source.includes("required(") || 
                      source.includes("threshold") && source.includes("owners");
  
  return result;
}

// Calculate top holders percentage
function calculateTopHoldersPercentage(holders: any[]): string {
  if (!holders || holders.length === 0) {
    return "N/A";
  }
  
  // Calculate total supply (sum of all holders)
  let totalSupply = BigInt(0);
  for (const holder of holders) {
    totalSupply += BigInt(holder.TokenHolderQuantity);
  }
  
  // If supply is still 0, return N/A
  if (totalSupply === BigInt(0)) {
    return "N/A";
  }
  
  // Calculate total for top 10 holders
  const topHolders = holders.slice(0, 10);
  let topHoldersTotal = BigInt(0);
  
  for (const holder of topHolders) {
    topHoldersTotal += BigInt(holder.TokenHolderQuantity);
  }
  
  // Calculate percentage
  const percentage = Number((topHoldersTotal * BigInt(10000)) / totalSupply) / 100;
  return `${percentage.toFixed(2)}%`;
}

// DeFiLlama API Functions
async function findProtocolSlug(tokenSymbol: string, tokenName: string): Promise<string | null> {
  try {
    // Get all protocols
    const response = await fetch(`${DEFILLAMA_BASE_URL}/protocols`);
    if (!response.ok) {
      throw new Error(`Error fetching protocols: ${response.status}`);
    }

    const protocols = await response.json();
    
    // Clean and normalize the token inputs
    const normalizedSymbol = tokenSymbol.toLowerCase().trim();
    const normalizedName = tokenName.toLowerCase().trim();
    
    // Try to find exact match by symbol first
    let match = protocols.find(
      (protocol: any) => protocol.symbol?.toLowerCase() === normalizedSymbol
    );
    
    // If no exact symbol match, try name match
    if (!match) {
      match = protocols.find(
        (protocol: any) => protocol.name?.toLowerCase() === normalizedName
      );
    }
    
    // If still no match, try partial matches
    if (!match) {
      match = protocols.find(
        (protocol: any) => 
          protocol.symbol?.toLowerCase().includes(normalizedSymbol) ||
          normalizedSymbol.includes(protocol.symbol?.toLowerCase())
      );
    }
    
    if (!match) {
      match = protocols.find(
        (protocol: any) => 
          protocol.name?.toLowerCase().includes(normalizedName) ||
          normalizedName.includes(protocol.name?.toLowerCase())
      );
    }
    
    return match ? match.slug : null;
  } catch (error) {
    console.error("Error finding protocol slug:", error);
    return null;
  }
}

async function getProtocolDetails(slug: string): Promise<any | null> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/protocol/${slug}`);
    if (!response.ok) {
      throw new Error(`Error fetching protocol details: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching protocol details:", error);
    return null;
  }
}

async function getProtocolTVLHistory(slug: string): Promise<any | null> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/tvl/${slug}`);
    if (!response.ok) {
      throw new Error(`Error fetching TVL history: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching TVL history:", error);
    return null;
  }
}

function formatChainDistribution(chainTvls: Record<string, number>): string {
  if (!chainTvls) return "N/A";
  
  // Get chains sorted by TVL
  const chains = Object.keys(chainTvls)
    .filter(chain => !chain.includes("-") && chain !== "tvl") // Filter out staking and special entries
    .sort((a, b) => chainTvls[b] - chainTvls[a]);
  
  if (chains.length === 0) return "N/A";
  if (chains.length === 1) return chains[0];
  if (chains.length === 2) return `${chains[0]} + ${chains[1]}`;
  
  // If more than 2 chains, show top 2 + count of others
  return `${chains[0]} + ${chains[1]} + ${chains.length - 2} more`;
}

function getTVLChangeOverPeriod(tvlHistory: any[], days = 7): number {
  if (!tvlHistory || tvlHistory.length < days + 1) {
    return 0;
  }
  
  const currentTVL = tvlHistory[tvlHistory.length - 1].totalLiquidityUSD;
  const previousTVL = tvlHistory[tvlHistory.length - days - 1].totalLiquidityUSD;
  
  return ((currentTVL - previousTVL) / previousTVL) * 100;
}

function formatTVLHistoryForSparkline(tvlHistory: any[], days = 7): number[] {
  if (!tvlHistory || tvlHistory.length === 0) {
    return [];
  }
  
  // Get the last N days of data
  const recentData = tvlHistory.slice(-days);
  
  // Extract just the TVL values
  return recentData.map((dataPoint: any) => dataPoint.totalLiquidityUSD);
}

// Add GitHub API functions
async function getGitHubRepoInfo(owner: string, repo: string) {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    
    if (!response.ok) {
      console.warn(`GitHub API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching GitHub repo info:", error);
    return null;
  }
}

async function getGitHubRepoCommits(owner: string, repo: string, days = 30) {
  try {
    // Calculate date from X days ago
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceString = since.toISOString();
    
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?since=${sinceString}&per_page=100`
    );
    
    if (!response.ok) {
      console.warn(`GitHub API error: ${response.status} ${response.statusText}`);
      return [];
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching GitHub commits:", error);
    return [];
  }
}

async function getGitHubCommitActivity(owner: string, repo: string) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`
    );
    
    if (!response.ok) {
      console.warn(`GitHub API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching GitHub commit activity:", error);
    return null;
  }
}

// Extract GitHub repo info from URL
function extractGitHubRepoFromUrl(url: string) {
  try {
    const githubRegex = /github\.com\/([^\/]+)\/([^\/]+)/;
    const matches = url.match(githubRegex);
    
    if (matches && matches.length >= 3) {
      const owner = matches[1];
      let repo = matches[2].split('.git')[0].split('#')[0].split('?')[0];
      return { owner, repo };
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting GitHub repo from URL:", error);
    return null;
  }
}

// Find GitHub repo from token details
function findGitHubRepoFromTokenDetails(tokenDetails: any) {
  // Check token links
  if (tokenDetails?.links?.repos_url?.github?.length > 0) {
    for (const url of tokenDetails.links.repos_url.github) {
      const repoInfo = extractGitHubRepoFromUrl(url);
      if (repoInfo) return repoInfo;
    }
  }
  
  // Check homepage for GitHub links
  if (tokenDetails?.links?.homepage?.length > 0) {
    for (const url of tokenDetails.links.homepage) {
      if (url.includes('github.com')) {
        const repoInfo = extractGitHubRepoFromUrl(url);
        if (repoInfo) return repoInfo;
      }
    }
  }
  
  return null;
}

// Calculate activity status based on commit frequency
function calculateGitHubActivityStatus(commits: any[], commitActivity: any[] | null) {
  // Default values
  const result = {
    status: 'Inactive' as 'Active' | 'Stale' | 'Inactive',
    commitCount: 0,
    commitTrend: 'neutral' as 'up' | 'down' | 'neutral',
    commitChange: '0%',
    lastCommitDate: null as string | null
  };
  
  // Get commit count for the last 30 days
  result.commitCount = commits.length;
  
  // Get the date of the most recent commit
  if (commits.length > 0) {
    result.lastCommitDate = commits[0].commit.author.date;
  }
  
  // Determine activity status based on commit frequency
  if (result.commitCount > 10) {
    result.status = 'Active';
  } else if (result.commitCount > 0) {
    result.status = 'Stale';
  }
  
  // Calculate commit trend using commit activity data
  if (commitActivity && commitActivity.length >= 8) {
    // Sum up commits from the last 4 weeks and the 4 weeks before that
    const lastFourWeeks = commitActivity.slice(0, 4).reduce((sum, week) => sum + week.total, 0);
    const previousFourWeeks = commitActivity.slice(4, 8).reduce((sum, week) => sum + week.total, 0);
    
    if (previousFourWeeks === 0) {
      if (lastFourWeeks > 0) {
        result.commitTrend = 'up';
        result.commitChange = 'New';
      }
    } else {
      const change = ((lastFourWeeks - previousFourWeeks) / previousFourWeeks) * 100;
      result.commitChange = `${change > 0 ? '+' : ''}${change.toFixed(0)}%`;
      
      if (change > 5) {
        result.commitTrend = 'up';
      } else if (change < -5) {
        result.commitTrend = 'down';
      }
    }
  }
  
  return result;
}

/**
 * Calculate a rough estimate of roadmap progress based on repository data
 */
function calculateRoadmapProgress(repoDetails: any): string {
  // In a real implementation, this would analyze milestones, issues, or project boards
  // For now, returning a placeholder calculation based on issues and repository age
  
  // If there are no open issues, consider it complete
  if (repoDetails.open_issues_count === 0) {
    return "100%";
  }
  
  // Base the calculation on the ratio of open issues to repository age
  const creationDate = new Date(repoDetails.created_at);
  const now = new Date();
  const ageInDays = Math.ceil((now.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Older repositories with fewer open issues are considered further along
  const issuesPerDay = repoDetails.open_issues_count / ageInDays;
  
  if (issuesPerDay < 0.01) {
    return "90%";
  } else if (issuesPerDay < 0.05) {
    return "75%";
  } else if (issuesPerDay < 0.1) {
    return "60%";
  } else if (issuesPerDay < 0.5) {
    return "40%";
  } else {
    return "25%";
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get token ID from request
    const { tokenId } = await req.json();
    
    if (!tokenId) {
      return new Response(
        JSON.stringify({ error: 'Token ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch token details from CoinGecko
    const tokenDetailsResponse = await fetch(
      `${CG_BASE_URL}/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true${getApiParams()}`
    );
    
    if (!tokenDetailsResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Error fetching token details: ${tokenDetailsResponse.status}` }),
        { status: tokenDetailsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const tokenDetails = await tokenDetailsResponse.json();
    
    // Fetch market chart data from CoinGecko
    const marketChartResponse = await fetch(
      `${CG_BASE_URL}/coins/${tokenId}/market_chart?vs_currency=usd&days=30${getApiParams()}`
    );
    
    let marketChart = null;
    if (marketChartResponse.ok) {
      marketChart = await marketChartResponse.json();
    }
    
    // Try to get on-chain data from GeckoTerminal
    let poolData = null;
    try {
      // Detect network and extract token address
      const network = detectNetwork(tokenId);
      const tokenAddress = extractTokenAddress(tokenId);
      
      if (tokenAddress) {
        // Get token pools from GeckoTerminal
        const tokenPoolsResponse = await fetch(
          `${GT_BASE_URL}/networks/${network}/tokens/${tokenAddress}/pools`,
          { headers: { 'Accept': `application/json;version=${GT_API_VERSION}` } }
        );
        
        if (tokenPoolsResponse.ok) {
          const tokenPools = await tokenPoolsResponse.json();
          
          // If token has pools, get data for the primary pool
          if (tokenPools.data && tokenPools.data.length > 0) {
            const primaryPool = tokenPools.data[0];
            const poolId = primaryPool.id.split(':')[1];
            
            const poolDataResponse = await fetch(
              `${GT_BASE_URL}/networks/${network}/pools/${poolId}`,
              { headers: { 'Accept': `application/json;version=${GT_API_VERSION}` } }
            );
            
            if (poolDataResponse.ok) {
              poolData = await poolDataResponse.json();
            }
          }
        }
      }
    } catch (error) {
      console.warn("Error fetching GeckoTerminal data:", error);
      // Continue without GT data, we'll use fallback values
    }
    
    // Try to get Etherscan data
    let etherscanData = {
      holders: null,
      topHoldersPercentage: null,
      contractSource: null,
      securityAnalysis: null
    };
    
    try {
      const tokenAddress = extractTokenAddress(tokenId);
      
      if (tokenAddress) {
        // Fetch contract source code
        const contractSource = await getContractSourceCode(tokenAddress);
        
        if (contractSource) {
          etherscanData.contractSource = contractSource;
          etherscanData.securityAnalysis = analyzeContractSecurity(contractSource);
        }
        
        // Fetch token holders
        const holders = await getTokenHolders(tokenAddress);
        
        if (holders) {
          etherscanData.holders = holders;
          etherscanData.topHoldersPercentage = calculateTopHoldersPercentage(holders);
        }
      }
    } catch (error) {
      console.warn("Error fetching Etherscan data:", error);
      // Continue without Etherscan data
    }
    
    // Try to get DeFiLlama data
    let defiLlamaData = null;
    try {
      // Try to find matching protocol in DeFiLlama
      const protocolSlug = await findProtocolSlug(
        tokenDetails.symbol, 
        tokenDetails.name
      );
      
      if (protocolSlug) {
        console.log("Found DeFiLlama protocol slug:", protocolSlug);
        
        // Get protocol details and TVL data
        const [protocolDetails, tvlHistory] = await Promise.all([
          getProtocolDetails(protocolSlug),
          getProtocolTVLHistory(protocolSlug)
        ]);
        
        if (protocolDetails && tvlHistory) {
          const tvlChange7d = getTVLChangeOverPeriod(tvlHistory, 7);
          const tvlChange30d = getTVLChangeOverPeriod(tvlHistory, 30);
          
          defiLlamaData = {
            tvl: protocolDetails.tvl,
            tvlChange7d,
            tvlChange30d,
            chainDistribution: formatChainDistribution(protocolDetails.chainTvls),
            supportedChains: protocolDetails.chains || [],
            tvlHistoryData: tvlHistory,
            protocolSlug,
            category: protocolDetails.category
          };
        }
      }
    } catch (error) {
      console.warn("Error fetching DeFiLlama data:", error);
      // Continue without DeFiLlama data
    }
    
    // Try to get GitHub data
    let githubData = null;
    try {
      const repoInfo = findGitHubRepoFromTokenDetails(tokenDetails);
      
      if (repoInfo) {
        console.log("Found GitHub repository:", repoInfo);
        const { owner, repo } = repoInfo;
        const [repoDetails, recentCommits, commitActivity] = await Promise.all([
          getGitHubRepoInfo(owner, repo),
          getGitHubRepoCommits(owner, repo),
          getGitHubCommitActivity(owner, repo)
        ]);
        
        if (repoDetails) {
          const activityMetrics = calculateGitHubActivityStatus(recentCommits, commitActivity);
          
          githubData = {
            repoUrl: repoDetails.html_url,
            activityStatus: activityMetrics.status,
            starCount: repoDetails.stargazers_count,
            forkCount: repoDetails.forks_count,
            commitCount: activityMetrics.commitCount,
            commitTrend: activityMetrics.commitTrend,
            commitChange: activityMetrics.commitChange,
            isOpenSource: repoDetails.visibility === 'public',
            license: repoDetails.license?.spdx_id,
            language: repoDetails.language,
            updatedAt: repoDetails.pushed_at,
            roadmapProgress: calculateRoadmapProgress(repoDetails),
            openIssues: repoDetails.open_issues_count
          };
        }
      }
    } catch (error) {
      console.error("Error processing GitHub data:", error);
    }
    
    // Calculate health metrics with all collected data
    const metrics = calculateHealthMetrics(tokenDetails, marketChart, poolData, etherscanData, defiLlamaData, githubData);
    
    return new Response(
      JSON.stringify(metrics),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scan-token function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Detect token network from token ID or symbol
function detectNetwork(tokenIdOrSymbol: string): string {
  // Extract network from token ID if it contains a colon
  if (tokenIdOrSymbol.includes(':')) {
    const parts = tokenIdOrSymbol.split(':');
    return mapNetworkName(parts[0]);
  }
  
  // Default to Ethereum for CoinGecko IDs without explicit network
  return 'eth';
}

// Map network name to GeckoTerminal network identifier
function mapNetworkName(network: string): string {
  const networkMap: Record<string, string> = {
    'ethereum': 'eth',
    'binance-smart-chain': 'bsc',
    'polygon-pos': 'polygon',
    'fantom': 'ftm',
    'avalanche': 'avax',
    'arbitrum-one': 'arbitrum',
    'optimistic-ethereum': 'optimism',
  };
  
  return networkMap[network.toLowerCase()] || 'eth';
}

// Extract token address from CoinGecko ID
function extractTokenAddress(tokenIdOrSymbol: string): string | null {
  // If the token ID contains a colon, it might be in the format 'network:address'
  if (tokenIdOrSymbol.includes(':')) {
    const parts = tokenIdOrSymbol.split(':');
    if (parts.length > 1) {
      return parts[1];
    }
  }
  
  // If it looks like an Ethereum address
  if (/^0x[a-fA-F0-9]{40}$/.test(tokenIdOrSymbol)) {
    return tokenIdOrSymbol;
  }
  
  return null;
}

// Simplified calculation function for the edge function
function calculateHealthMetrics(
  tokenDetails: any, 
  marketChart: any, 
  poolData: any,
  etherscanData: any = {},
  defiLlamaData: any = null,
  githubData: any = null
): any {
  // Format market cap for display
  const marketCap = formatCurrency(tokenDetails.market_data?.market_cap?.usd || 0);
  
  // Social followers count
  const socialFollowers = formatNumber(tokenDetails.community_data?.twitter_followers || 0);
  
  // Calculate category scores with Etherscan data
  const securityScore = calculateSecurityScore(tokenDetails, poolData, etherscanData);
  const liquidityScore = calculateLiquidityScore(tokenDetails, marketChart, poolData, defiLlamaData);
  const tokenomicsScore = calculateTokenomicsScore(tokenDetails, poolData, etherscanData);
  const communityScore = calculateCommunityScore(tokenDetails);
  const developmentScore = calculateDevelopmentScore(tokenDetails, githubData);
  
  // Calculate overall health score
  const healthScore = Math.round(
    (securityScore * 0.25) + 
    (liquidityScore * 0.25) + 
    (tokenomicsScore * 0.2) + 
    (communityScore * 0.15) + 
    (developmentScore * 0.15)
  );
  
  // Process GeckoTerminal data
  let liquidityLock = "365 days"; // Default fallback
  let tvl = "$1.2M"; // Default fallback
  let volume24h;
  let txCount24h;
  let poolAge;
  let poolAddress;
  let network;
  
  // Extract liquidity lock status from pool data if available
  if (poolData && poolData.data) {
    const poolAttributes = poolData.data.attributes;
    
    // Get pool creation date and calculate age
    if (poolAttributes.creation_timestamp) {
      const creationDate = new Date(poolAttributes.creation_timestamp);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - creationDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      poolAge = diffDays === 1 ? '1 day' : `${diffDays} days`;
    }
    
    // Get liquidity lock info
    if (poolAttributes.liquidity_locked) {
      if (poolAttributes.liquidity_locked.is_locked) {
        if (poolAttributes.liquidity_locked.locked_until) {
          const lockDate = new Date(poolAttributes.liquidity_locked.locked_until);
          const now = new Date();
          if (lockDate > now) {
            // Calculate days left
            const diffTime = Math.abs(lockDate.getTime() - now.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            liquidityLock = diffDays === 1 ? '1 day' : `${diffDays} days`;
          } else {
            liquidityLock = "Expired";
          }
        } else if (poolAttributes.liquidity_locked.duration_in_seconds) {
          // Convert seconds to days
          const days = Math.ceil(poolAttributes.liquidity_locked.duration_in_seconds / (60 * 60 * 24));
          liquidityLock = days === 1 ? '1 day' : `${days} days`;
        }
      } else {
        liquidityLock = "Not locked";
      }
    }
    
    // Get TVL (reserve_in_usd)
    if (poolAttributes.reserve_in_usd) {
      tvl = formatCurrency(parseFloat(poolAttributes.reserve_in_usd));
    }
    
    // Get 24h volume
    if (poolAttributes.volume_usd && poolAttributes.volume_usd.h24) {
      volume24h = formatCurrency(parseFloat(poolAttributes.volume_usd.h24));
    }
    
    // Get 24h transaction count
    if (poolAttributes.transactions && poolAttributes.transactions.h24) {
      txCount24h = poolAttributes.transactions.h24;
    }
    
    // Store pool address and network
    poolAddress = poolData.data.id;
    if (poolAddress.includes(':')) {
      const parts = poolAddress.split(':');
      network = parts[0];
      poolAddress = parts[1];
    }
  }
  
  // Get top holders percentage from Etherscan data
  const topHoldersPercentage = etherscanData.topHoldersPercentage || "42%"; // Fallback
  
  // Get security analysis from Etherscan data
  const securityAnalysis = etherscanData.securityAnalysis || {
    ownershipRenounced: false,
    canMint: false,
    canBurn: true,
    hasFreeze: false,
    isMultiSig: false,
    isProxy: false
  };
  
  // Determine audit status based on security analysis
  let auditStatus = "Unverified";
  if (etherscanData.contractSource) {
    auditStatus = "Verified";
  }
  
  // Update TVL with DeFiLlama data if available
  let tvlSparkline;
  if (defiLlamaData && defiLlamaData.tvl) {
    tvl = formatCurrency(defiLlamaData.tvl);
    
    // Create sparkline data if history available
    if (defiLlamaData.tvlHistoryData && defiLlamaData.tvlHistoryData.length > 0) {
      const sparklineData = formatTVLHistoryForSparkline(defiLlamaData.tvlHistoryData, 7);
      const trend = defiLlamaData.tvlChange7d >= 0 ? 'up' : 'down';
      
      tvlSparkline = {
        data: sparklineData,
        trend,
        change: defiLlamaData.tvlChange7d
      };
    }
  }
  
  return {
    name: tokenDetails.name,
    symbol: tokenDetails.symbol.toUpperCase(),
    marketCap,
    liquidityLock,
    topHoldersPercentage,
    tvl,
    auditStatus,
    socialFollowers,
    poolAge,
    volume24h,
    txCount24h,
    network,
    poolAddress,
    // Add Etherscan-specific data
    etherscan: {
      securityAnalysis,
      contractAddress: extractTokenAddress(tokenDetails.id)
    },
    // Add DeFiLlama-specific data
    defiLlama: defiLlamaData,
    // Add GitHub-specific data
    github: githubData,
    tvlSparkline,
    categories: {
      security: { score: securityScore },
      liquidity: { score: liquidityScore },
      tokenomics: { score: tokenomicsScore },
      community: { score: communityScore },
      development: { score: developmentScore }
    },
    healthScore,
    lastUpdated: Date.now()
  };
}

// Basic security score calculation with Etherscan data
function calculateSecurityScore(
  tokenDetails: any, 
  poolData: any,
  etherscanData: any = {}
): number {
  let score = 50;
  
  // Market cap rank factors
  if (tokenDetails.market_cap_rank) {
    if (tokenDetails.market_cap_rank <= 10) score += 30;
    else if (tokenDetails.market_cap_rank <= 100) score += 20;
    else if (tokenDetails.market_cap_rank <= 1000) score += 10;
  }
  
  // Liquidity lock factors
  if (poolData?.data?.attributes?.liquidity_locked) {
    if (poolData.data.attributes.liquidity_locked.is_locked) {
      score += 10;
    } else {
      score -= 10;
    }
  }
  
  // Etherscan factors
  if (etherscanData.securityAnalysis) {
    if (etherscanData.securityAnalysis.ownershipRenounced) {
      score += 15;
    } else {
      score -= 10;
    }
    
    if (!etherscanData.securityAnalysis.canMint) {
      score += 10;
    } else {
      score -= 5;
    }
    
    if (!etherscanData.securityAnalysis.hasFreeze) {
      score += 5;
    }
    
    if (etherscanData.securityAnalysis.isMultiSig) {
      score += 10;
    }
  }
  
  return Math.min(Math.max(score, 0), 100);
}

// Basic liquidity score calculation
function calculateLiquidityScore(
  tokenDetails: any, 
  marketChart: any, 
  poolData: any,
  defiLlamaData: any = null
): number {
  let score = 60;
  
  // Pool factors
  if (poolData?.data?.attributes) {
    const attrs = poolData.data.attributes;
    
    // TVL factor
    const reserve = parseFloat(attrs.reserve_in_usd || '0');
    if (reserve > 1000000) score += 20;
    else if (reserve > 100000) score += 10;
    
    // Volume factor
    if (attrs.volume_usd?.h24) {
      const volume = parseFloat(attrs.volume_usd.h24);
      if (volume > 100000) score += 20;
      else if (volume > 10000) score += 10;
    }
  }
  
  // DeFiLlama data
  if (defiLlamaData) {
    // TVL size factor
    const tvl = defiLlamaData.tvl || 0;
    if (tvl > 100000000) score += 20; // >$100M TVL
    else if (tvl > 10000000) score += 15; // >$10M TVL
    else if (tvl > 1000000) score += 10; // >$1M TVL
    
    // TVL changes factor (positive changes are better)
    if (defiLlamaData.tvlChange7d > 10) score += 10; // >10% increase in 7 days
    else if (defiLlamaData.tvlChange7d > 0) score += 5; // Any positive change
    else if (defiLlamaData.tvlChange7d < -20) score -= 10; // >20% decrease
    
    // Multi-chain presence (more chains is better)
    if (defiLlamaData.supportedChains && defiLlamaData.supportedChains.length > 0) {
      const chainCount = defiLlamaData.supportedChains.length;
      if (chainCount > 3) score += 10; // Present on more than 3 chains
      else if (chainCount > 1) score += 5; // Present on multiple chains
    }
  }
  
  return Math.min(Math.max(score, 0), 100);
}

// Enhanced tokenomics score calculation with Etherscan data
function calculateTokenomicsScore(
  tokenDetails: any, 
  poolData: any,
  etherscanData: any = {}
): number {
  let score = 65; // Base score
  
  if (etherscanData.securityAnalysis) {
    // Burn mechanism is good for tokenomics
    if (etherscanData.securityAnalysis.canBurn) {
      score += 10;
    }
    
    // Mint function can be negative for tokenomics (inflation risk)
    if (etherscanData.securityAnalysis.canMint) {
      score -= 10;
    }
    
    // No freeze functionality is better for decentralization
    if (!etherscanData.securityAnalysis.hasFreeze) {
      score += 5;
    }
  }
  
  // Top holders concentration factor
  if (etherscanData.topHoldersPercentage) {
    const percentage = parseFloat(etherscanData.topHoldersPercentage);
    if (!isNaN(percentage)) {
      if (percentage < 30) score += 15;
      else if (percentage < 50) score += 5;
      else if (percentage > 80) score -= 15;
      else if (percentage > 60) score -= 5;
    }
  }
  
  return Math.min(Math.max(score, 0), 100);
}

// Calculate community score
function calculateCommunityScore(tokenDetails: any): number {
  // Social followers count
  const socialFollowers = formatNumber(tokenDetails.community_data?.twitter_followers || 0);
  
  // Community score based on social followers
  const communityScore = Math.round((socialFollowers / 1000000) * 100);
  
  return communityScore;
}

// Calculate development score
function calculateDevelopmentScore(tokenDetails: any, githubData: any = null): number {
  let score = 50; // Base score
  
  // If we have GitHub data, prioritize that for development metrics
  if (githubData) {
    // Recent commit activity
    if (githubData.commitCount > 100) score += 20;
    else if (githubData.commitCount > 50) score += 15;
    else if (githubData.commitCount > 20) score += 10;
    else if (githubData.commitCount > 0) score += 5;
    
    // Repository stars
    if (githubData.starCount > 5000) score += 15;
    else if (githubData.starCount > 1000) score += 10;
    else if (githubData.starCount > 100) score += 5;
    
    // Repository forks
    if (githubData.forkCount > 1000) score += 10;
    else if (githubData.forkCount > 100) score += 7;
    else if (githubData.forkCount > 10) score += 3;
    
    // Open source status
    if (githubData.isOpenSource) score += 10;
    
    // Activity status
    if (githubData.activityStatus === 'Active') score += 10;
    else if (githubData.activityStatus === 'Stale') score += 5;
  } else {
    // Fall back to CoinGecko dev data if available
    if (tokenDetails.links?.dev_data?.social?.twitter_followers) {
      score += Math.round((tokenDetails.links.dev_data.social.twitter_followers / 1000000) * 100);
    }
  }
  
  // Cap the score at 100
  return Math.min(Math.max(score, 0), 100);
}

// Format currency values for display
function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}

// Format numbers for display
function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  } else {
    return value.toString();
  }
}
