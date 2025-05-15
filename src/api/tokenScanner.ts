import { supabase } from "@/integrations/supabase/client";
import { getTokenDetails, getTokenMarketChart } from "./coingecko";
import { 
  TokenDetails, 
  TokenMetrics
} from "./types";
import { 
  GeckoTerminalPoolData, 
  formatTVLHistoryForSparkline 
} from "./geckoTerminalTypes";
import { getTokenPools, getPoolData, detectNetwork, extractTokenAddress } from "./geckoterminal";
import { getSecurityData } from "./goPlus";
import { TwitterMetrics } from "./twitterTypes";
import { EtherscanTokenData } from "./etherscanTypes";
import { toast } from "@/hooks/use-toast";

// Cache duration in seconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60;

// Progress update callback type
type ProgressCallback = (progress: number) => void;

/**
 * Clean token ID for API compatibility
 * Remove $ and other special characters that may cause issues
 */
export function cleanTokenId(tokenId: string): string {
  // Remove $ symbol and other special characters
  return tokenId.replace(/^\$/, '').replace(/[^a-z0-9-]/gi, '').toLowerCase();
}

/**
 * Scan a token and return comprehensive metrics
 * @param tokenIdOrSymbol Token ID or symbol
 * @param onProgress Optional callback for progress updates
 * @returns Token metrics or null if scan fails
 */
export async function scanToken(
  tokenIdOrSymbol: string, 
  onProgress?: ProgressCallback
): Promise<TokenMetrics | null> {
  try {
    // Update progress to 10%
    onProgress?.(0.1);
    
    // Check for empty input
    if (!tokenIdOrSymbol || tokenIdOrSymbol.trim() === '') {
      toast({
        title: "Invalid Token",
        description: "Please enter a valid token symbol or contract address",
        variant: "destructive",
      });
      return null;
    }
    
    // Try to get from cache first
    const { data: cachedData } = await supabase
      .from('token_data_cache')
      .select('data')
      .eq('token_id', tokenIdOrSymbol)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    
    if (cachedData) {
      console.log("Using cached data for", tokenIdOrSymbol);
      onProgress?.(1.0); // Complete progress
      return cachedData.data as unknown as TokenMetrics;
    }
    
    console.log("Fetching fresh data for", tokenIdOrSymbol);
    onProgress?.(0.2);
    
    // Set a timeout for the entire operation
    const scanAbortController = new AbortController();
    const timeoutId = setTimeout(() => scanAbortController.abort(), 25000); // 25 second overall timeout
    
    try {
      // Call the scan-token edge function which will handle all API calls
      onProgress?.(0.3);
      const { data, error } = await supabase.functions.invoke('scan-token', {
        body: { tokenId: tokenIdOrSymbol }
      });
      
      if (error) {
        console.error("Error from scan-token function:", error);
        toast({
          title: "Scan Error",
          description: "We couldn't complete the token scan. Please try again later.",
          variant: "destructive",
        });
        return null;
      }
      
      onProgress?.(0.9);
      
      if (!data) {
        throw new Error("No data returned from scan-token function");
      }
      
      const metrics = data as TokenMetrics;
      
      // Show appropriate toast based on data quality
      if (metrics.dataQuality === 'complete') {
        toast({
          title: "Scan Complete",
          description: `Full analysis for ${metrics.symbol} completed with health score: ${metrics.healthScore}/100`,
        });
      } else {
        toast({
          title: "Partial Analysis",
          description: `Limited data available for ${metrics.symbol}. Health score: ${metrics.healthScore}/100`,
          variant: "default",
        });
      }
      
      onProgress?.(1.0);
      
      // Save scan result for logged-in users
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await saveScanHistory(session.user.id, tokenIdOrSymbol, metrics);
      }
      
      return metrics;
    } catch (functionError) {
      console.error(`Edge function error:`, functionError);
      
      // Fall back to client-side scanning if edge function fails
      toast({
        title: "Using Fallback Scanner",
        description: "Our primary scanner is busy. Using alternative scan method...",
      });
      
      // Call direct APIs as fallback
      return await scanTokenDirectly(tokenIdOrSymbol, onProgress);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error(`Error scanning token ${tokenIdOrSymbol}:`, error);
    toast({
      title: "Scan Failed",
      description: error instanceof Error ? error.message : "Unknown error occurred",
      variant: "destructive",
    });
    return null;
  }
}

/**
 * Fallback direct scanning method when edge function fails
 */
async function scanTokenDirectly(tokenIdOrSymbol: string, onProgress?: ProgressCallback): Promise<TokenMetrics | null> {
  try {
    onProgress?.(0.4);
    
    // Fetch token details from CoinGecko
    const tokenDetails = await getTokenDetails(tokenIdOrSymbol);
    if (!tokenDetails) {
      throw new Error("Could not find token details");
    }
    
    onProgress?.(0.5);
    
    // Fetch market chart data
    const marketChart = await getTokenMarketChart(tokenIdOrSymbol);
    onProgress?.(0.6);
    
    // Extract token address for security check
    let tokenAddress = extractTokenAddress(tokenIdOrSymbol);
    const network = detectNetwork(tokenIdOrSymbol);
    
    // If we have a direct Ethereum address, use it
    if (!tokenAddress && /^0x[a-fA-F0-9]{40}$/i.test(tokenIdOrSymbol)) {
      tokenAddress = tokenIdOrSymbol;
    }
    
    // Run concurrent API calls for better performance
    let geckoTerminalData = null;
    let goPlusData = null;
    
    if (tokenAddress) {
      try {
        // Get token pools from GeckoTerminal
        geckoTerminalData = await getTokenPools(network, tokenAddress);
      } catch (err) {
        console.warn("Error fetching GeckoTerminal data:", err);
      }
      
      try {
        // Get security data
        goPlusData = await getSecurityData(tokenAddress);
      } catch (err) {
        console.warn("Error fetching GoPlus security data:", err);
      }
    }
    
    onProgress?.(0.7);
    
    // Get pool data if GeckoTerminal data is available
    let poolData = null;
    if (geckoTerminalData && 
        geckoTerminalData.data && 
        geckoTerminalData.data.length > 0) {
      try {
        const primaryPool = geckoTerminalData.data[0];
        poolData = await getPoolData(network, primaryPool.id.split(':')[1]);
      } catch (err) {
        console.warn("Error fetching pool data:", err);
      }
    }
    
    onProgress?.(0.8);
    
    // Process the data and calculate health scores
    const metrics = calculateHealthMetrics(
      tokenDetails, 
      marketChart, 
      poolData, 
      null, // etherscanData (disabled for performance)
      null, // defiLlamaData (disabled for performance)
      null, // githubData (disabled for performance)
      null, // twitterData (fetched separately via edge function)
      goPlusData
    );
    
    onProgress?.(0.9);
    
    // Cache the result
    await cacheTokenData(tokenIdOrSymbol, metrics);
    
    onProgress?.(1.0);
    
    return metrics;
  } catch (error) {
    console.error(`Error in fallback scanner:`, error);
    throw error;
  }
}

/**
 * Calculate health metrics for a token based on raw data
 */
function calculateHealthMetrics(
  tokenDetails: TokenDetails,
  marketChart: any,
  poolData?: GeckoTerminalPoolData | null,
  etherscanData?: EtherscanTokenData,
  defiLlamaData?: any,
  githubData?: any,
  twitterData?: TwitterMetrics,
  goPlusData?: any
): TokenMetrics {
  // Initialize scores for each category
  const securityScore = calculateSecurityScore(tokenDetails, poolData, etherscanData, goPlusData);
  const liquidityScore = calculateLiquidityScore(tokenDetails, marketChart, poolData, defiLlamaData);
  const tokenomicsScore = calculateTokenomicsScore(tokenDetails, poolData, etherscanData, goPlusData);
  const communityScore = calculateCommunityScore(tokenDetails, twitterData);
  const developmentScore = calculateDevelopmentScore(tokenDetails, githubData);
  
  // Calculate overall health score as weighted average
  const healthScore = Math.round(
    (securityScore * 0.25) + 
    (liquidityScore * 0.25) + 
    (tokenomicsScore * 0.2) + 
    (communityScore * 0.15) + 
    (developmentScore * 0.15)
  );
  
  // Format market cap for display
  const marketCap = formatCurrency(tokenDetails.market_data?.market_cap?.usd || 0);
  
  // Social followers count - now from Twitter if available
  const socialFollowers = twitterData 
    ? formatNumber(twitterData.followersCount) 
    : formatNumber(tokenDetails.community_data?.twitter_followers || 0);
  
  // Process GeckoTerminal data
  let liquidityLock = "Unknown"; // Default fallback
  let tvl = "Unknown"; // Default fallback
  let volume24h;
  let txCount24h;
  let poolAge;
  let poolAddress;
  let network;
  let dataQuality = "partial"; // Default to partial quality
  
  // Extract liquidity lock status from pool data if available
  if (poolData) {
    dataQuality = "complete"; // We have pool data
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
  
  // Update TVL with DeFiLlama data if available
  let tvlSparkline;
  if (defiLlamaData && defiLlamaData.tvl) {
    tvl = formatCurrency(defiLlamaData.tvl);
    dataQuality = "complete";
    
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
  
  // Get top holders percentage from Etherscan
  let topHoldersPercentage = "Unknown"; // Default fallback
  if (etherscanData?.topHoldersPercentage) {
    topHoldersPercentage = etherscanData.topHoldersPercentage;
    dataQuality = "complete";
  }
  
  // Determine audit status - enhance with GoPlus data if available
  let auditStatus = "Unknown"; // Default fallback
  if (goPlusData?.isOpenSource) {
    auditStatus = "Verified";
    dataQuality = "complete";
  } else if (goPlusData?.riskLevel === 'High') {
    auditStatus = "High Risk";
    dataQuality = "complete";
  } else if (etherscanData?.contractSource) {
    auditStatus = "Verified";
    dataQuality = "complete";
  }
  
  // Extract contract address if available
  const contractAddress = extractTokenAddress(tokenDetails.id);
  
  // Create the metrics object
  const metrics: TokenMetrics = {
    name: tokenDetails.name,
    symbol: tokenDetails.symbol.toUpperCase(),
    marketCap,
    liquidityLock,
    topHoldersPercentage,
    tvl,
    auditStatus,
    socialFollowers,
    // New fields from GeckoTerminal
    poolAge,
    volume24h,
    txCount24h,
    network,
    poolAddress,
    dataQuality,
    // New fields from Etherscan
    etherscan: {
      securityAnalysis: etherscanData?.securityAnalysis,
      contractAddress
    },
    // New fields from DeFiLlama
    defiLlama: defiLlamaData,
    tvlSparkline,
    // New field for GitHub data
    github: githubData,
    // New field for Twitter data
    twitter: twitterData,
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
  
  // Add GoPlus security data if available
  if (goPlusData) {
    metrics.goPlus = {
      ownershipRenounced: goPlusData.ownershipRenounced,
      canMint: goPlusData.canMint,
      hasBlacklist: goPlusData.hasBlacklist,
      slippageModifiable: goPlusData.slippageModifiable,
      isHoneypot: goPlusData.isHoneypot,
      ownerCanChangeBalance: goPlusData.ownerCanChangeBalance,
      isProxy: goPlusData.isProxy,
      hasExternalCalls: goPlusData.hasExternalCalls,
      transferPausable: goPlusData.transferPausable,
      isSelfdestructable: goPlusData.isSelfdestructable,
      isOpenSource: goPlusData.isOpenSource,
      buyTax: goPlusData.buyTax,
      sellTax: goPlusData.sellTax,
      riskLevel: goPlusData.riskLevel
    };
  }
  
  return metrics;
}

/**
 * Calculate security score based on various factors
 * Enhanced with GoPlus security data
 */
function calculateSecurityScore(
  tokenDetails: TokenDetails,
  poolData?: GeckoTerminalPoolData | null,
  etherscanData?: EtherscanTokenData,
  goPlusData?: any
): number {
  // In a real implementation, this would analyze contract security, audits, etc.
  // For now, using a placeholder score based on market cap rank and existence
  let score = 50; // Base score
  
  // Add points based on market cap rank (established projects tend to be more secure)
  if (tokenDetails.market_cap_rank) {
    if (tokenDetails.market_cap_rank <= 10) score += 20;
    else if (tokenDetails.market_cap_rank <= 100) score += 15;
    else if (tokenDetails.market_cap_rank <= 1000) score += 10;
  }
  
  // Add points for having GitHub repositories (transparency)
  if (tokenDetails?.links?.repos_url?.github?.length > 0) score += 5;
  
  // Add points for having a market cap (established project)
  if (tokenDetails?.market_data?.market_cap?.usd) score += 5;

  // Add or subtract points based on liquidity lock status
  if (poolData?.data?.attributes?.liquidity_locked) {
    const lockInfo = poolData.data.attributes.liquidity_locked;
    if (lockInfo.is_locked) {
      score += 5;
      
      // Additional points for longer locks
      if (lockInfo.duration_in_seconds) {
        const lockDays = lockInfo.duration_in_seconds / (60 * 60 * 24);
        if (lockDays > 365) score += 5;
        else if (lockDays > 180) score += 3;
      }
    } else {
      score -= 5; // Penalty for not having locked liquidity
    }
  }
  
  // Add Etherscan security analysis factors
  if (etherscanData?.securityAnalysis) {
    const analysis = etherscanData.securityAnalysis;
    
    // Ownership renouncement is major security factor
    if (analysis.ownershipRenounced) {
      score += 15;
    } else {
      score -= 10;
    }
    
    // No mint function is better for security
    if (!analysis.canMint) {
      score += 10;
    } else {
      score -= 5;
    }
    
    // No freeze function is better for decentralization
    if (!analysis.hasFreeze) {
      score += 5;
    } else {
      score -= 2;
    }
    
    // Multi-sig wallet is better for security
    if (analysis.isMultiSig) {
      score += 10;
    }
  }
  
  // Add GoPlus security analysis factors if available
  if (goPlusData) {
    // Critical risk factors
    if (goPlusData.isHoneypot) {
      score -= 40; // Severe penalty for honeypot
    }
    
    if (goPlusData.ownershipRenounced) {
      score += 15; // Major plus for renounced ownership
    } else {
      score -= 10; // Penalty for retained ownership
    }
    
    if (goPlusData.ownerCanChangeBalance) {
      score -= 20; // Severe penalty for owner balance manipulation
    }
    
    if (goPlusData.isSelfdestructable) {
      score -= 15; // Severe penalty for self-destruct capability
    }
    
    // Moderate risk factors
    if (goPlusData.canMint) {
      score -= 5; // Penalty for mint capability
    }
    
    if (goPlusData.hasBlacklist) {
      score -= 5; // Penalty for blacklisting capability
    }
    
    if (goPlusData.slippageModifiable) {
      score -= 5; // Penalty for slippage modification
    }
    
    if (goPlusData.transferPausable) {
      score -= 5; // Penalty for transfer pause capability
    }
    
    if (goPlusData.isOpenSource) {
      score += 10; // Bonus for open source code
    } else {
      score -= 10; // Penalty for closed source
    }
    
    // Adjust based on overall risk level
    if (goPlusData.riskLevel === 'High') {
      score = Math.min(score, 30); // Cap score at 30 for high risk contracts
    } else if (goPlusData.riskLevel === 'Low') {
      score = Math.max(score, 60); // Minimum score of 60 for low risk contracts
    }
  }
  
  // Cap the score at 100
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate liquidity score based on various factors
 * Now enhanced with DeFiLlama TVL data
 */
function calculateLiquidityScore(
  tokenDetails: TokenDetails, 
  marketChart: any,
  poolData?: GeckoTerminalPoolData | null,
  defiLlamaData?: any
): number {
  // Use GeckoTerminal data if available, otherwise fall back to CoinGecko
  const volume = tokenDetails.market_data?.total_volume?.usd || 0;
  const marketCap = tokenDetails.market_data?.market_cap?.usd || 0;
  
  let score = 50; // Base score
  
  // Volume to market cap ratio (higher is better)
  if (marketCap > 0) {
    const volumeToMarketCapRatio = volume / marketCap;
    if (volumeToMarketCapRatio > 0.3) score += 30;
    else if (volumeToMarketCapRatio > 0.1) score += 20;
    else if (volumeToMarketCapRatio > 0.05) score += 10;
  }
  
  // Absolute volume (higher is better)
  if (volume > 10000000) score += 20; // >$10M daily volume
  else if (volume > 1000000) score += 15; // >$1M daily volume
  else if (volume > 100000) score += 10; // >$100K daily volume

  // Pool data from GeckoTerminal
  if (poolData) {
    // Check pool reserve (TVL)
    const reserve = parseFloat(poolData.data.attributes.reserve_in_usd || '0');
    if (reserve > 1000000) score += 10; // >$1M TVL
    else if (reserve > 100000) score += 5; // >$100K TVL
    
    // Check 24h transaction count
    const tx24h = poolData.data.attributes.transactions?.h24 || 0;
    if (tx24h > 1000) score += 10; // >1000 daily transactions
    else if (tx24h > 100) score += 5; // >100 daily transactions
    
    // Check pool age
    if (poolData.data.attributes.creation_timestamp) {
      const creationDate = new Date(poolData.data.attributes.creation_timestamp);
      const now = new Date();
      const diffDays = Math.ceil(Math.abs(now.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 365) score += 10; // >1 year old
      else if (diffDays > 180) score += 8; // >6 months old
      else if (diffDays > 90) score += 5; // >3 months old
      else if (diffDays > 30) score += 2; // >1 month old
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
  
  // Cap the score at 100
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate tokenomics score
 * Enhanced with GoPlus security data
 */
function calculateTokenomicsScore(
  tokenDetails: TokenDetails, 
  poolData?: GeckoTerminalPoolData | null,
  etherscanData?: EtherscanTokenData,
  goPlusData?: any
): number {
  let score = 65; // Base score
  
  // Add Etherscan-based factors
  if (etherscanData?.securityAnalysis) {
    const analysis = etherscanData.securityAnalysis;
    
    // Burn function is good for tokenomics (deflationary)
    if (analysis.canBurn) {
      score += 10;
    }
    
    // Mint function can be negative for tokenomics (inflation risk)
    if (analysis.canMint) {
      score -= 10;
    }
  }
  
  // Top holders concentration factor
  if (etherscanData?.topHoldersPercentage) {
    const percentStr = etherscanData.topHoldersPercentage.replace('%', '');
    const percentage = parseFloat(percentStr);
    
    if (!isNaN(percentage)) {
      if (percentage < 30) score += 15;
      else if (percentage < 50) score += 5;
      else if (percentage > 80) score -= 15;
      else if (percentage > 60) score -= 5;
    }
  }
  
  // Add GoPlus tokenomics factors
  if (goPlusData) {
    // Tax considerations
    const buyTaxValue = parseFloat(goPlusData.buyTax);
    const sellTaxValue = parseFloat(goPlusData.sellTax);
    
    if (!isNaN(buyTaxValue) && buyTaxValue > 10) {
      score -= 10; // Heavy penalty for high buy tax
    } else if (!isNaN(buyTaxValue) && buyTaxValue > 5) {
      score -= 5; // Penalty for moderate buy tax
    }
    
    if (!isNaN(sellTaxValue) && sellTaxValue > 10) {
      score -= 15; // Heavy penalty for high sell tax
    } else if (!isNaN(sellTaxValue) && sellTaxValue > 5) {
      score -= 10; // Penalty for moderate sell tax
    }
    
    // Honeypot factors
    if (goPlusData.isHoneypot) {
      score = Math.min(score, 20); // Cap tokenomics score at 20 for honeypots
    }
  }
  
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate community score based on various factors
 * Enhanced with Twitter data
 */
function calculateCommunityScore(tokenDetails: TokenDetails, twitterData?: TwitterMetrics): number {
  // Based on social metrics
  const twitterFollowers = twitterData?.followersCount || tokenDetails.community_data?.twitter_followers || 0;
  const redditSubscribers = tokenDetails.community_data?.reddit_subscribers || 0;
  const telegramUsers = tokenDetails.community_data?.telegram_channel_user_count || 0;
  
  let score = 50; // Base score
  
  // Twitter followers
  if (twitterFollowers > 1000000) score += 20;
  else if (twitterFollowers > 100000) score += 15;
  else if (twitterFollowers > 10000) score += 10;
  else if (twitterFollowers > 1000) score += 5;
  
  // Twitter verification adds points
  if (twitterData && twitterData.verified) {
    score += 10;
  }
  
  // Twitter account age
  if (twitterData && twitterData.createdAt) {
    const createdAt = new Date(twitterData.createdAt);
    const now = new Date();
    const accountAgeInYears = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    if (accountAgeInYears > 3) score += 10;
    else if (accountAgeInYears > 1) score += 5;
  }
  
  // Twitter engagement (estimated by tweet count)
  if (twitterData && twitterData.tweetCount) {
    if (twitterData.tweetCount > 5000) score += 10;
    else if (twitterData.tweetCount > 1000) score += 5;
  }
  
  // Follower growth trend
  if (twitterData && twitterData.followerChange) {
    if (twitterData.followerChange.trend === 'up') {
      // Parse percentage value
      const percentValue = parseFloat(twitterData.followerChange.percentage.replace('%', ''));
      if (percentValue > 10) score += 10;
      else if (percentValue > 5) score += 5;
    }
  }
  
  // Reddit subscribers
  if (redditSubscribers > 100000) score += 10;
  else if (redditSubscribers > 10000) score += 7;
  else if (redditSubscribers > 1000) score += 5;
  
  // Telegram users
  if (telegramUsers > 100000) score += 10;
  else if (telegramUsers > 10000) score += 7;
  else if (telegramUsers > 1000) score += 5;
  
  // Cap the score at 100
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate development score using token details and GitHub data
 */
function calculateDevelopmentScore(tokenDetails: TokenDetails, githubData?: any): number {
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
    const commitCount = tokenDetails.developer_data?.commit_count_4_weeks || 0;
    const stars = tokenDetails.developer_data?.stars || 0;
    const forks = tokenDetails.developer_data?.forks || 0;
    
    // Recent commit activity
    if (commitCount > 100) score += 20;
    else if (commitCount > 50) score += 15;
    else if (commitCount > 20) score += 10;
    else if (commitCount > 0) score += 5;
    
    // GitHub stars
    if (stars > 5000) score += 15;
    else if (stars > 1000) score += 10;
    else if (stars > 100) score += 5;
    
    // GitHub forks
    if (forks > 1000) score += 15;
    else if (forks > 100) score += 10;
    else if (forks > 10) score += 5;
  }
  
  // Cap the score at 100
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Cache token data in Supabase
 */
async function cacheTokenData(tokenId: string, data: TokenMetrics): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + CACHE_DURATION);
    
    await supabase
      .from('token_data_cache')
      .upsert({
        token_id: tokenId,
        data: data as unknown as Record<string, any>,
        expires_at: expiresAt.toISOString(),
        last_updated: new Date().toISOString()
      });
  } catch (error) {
    console.error("Error caching token data:", error);
    // Continue execution even if caching fails
  }
}

/**
 * Save scan history for logged-in users
 */
async function saveScanHistory(userId: string, tokenId: string, metrics: TokenMetrics): Promise<void> {
  try {
    await supabase
      .from('token_scans')
      .insert({
        user_id: userId,
        token_id: tokenId,
        token_symbol: metrics.symbol,
        token_name: metrics.name,
        health_score: metrics.healthScore,
        category_scores: metrics.categories as unknown as Record<string, any>,
        token_address: metrics.etherscan?.contractAddress || null
      });
  } catch (error) {
    console.error("Error saving scan history:", error);
    // Continue execution even if history saving fails
  }
}

/**
 * Format currency values for display
 */
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

/**
 * Format numbers for display
 */
function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  } else {
    return value.toString();
  }
}
