
import { supabase } from "@/integrations/supabase/client";
import { getTokenDetails, getTokenMarketChart } from "./coingecko";
import { TokenDetails, TokenMetrics } from "./types";

// Cache duration in seconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60;

/**
 * Scan a token and return comprehensive metrics
 */
export async function scanToken(tokenIdOrSymbol: string): Promise<TokenMetrics | null> {
  try {
    // Try to get from cache first
    const { data: cachedData } = await supabase
      .from('token_data_cache')
      .select('data')
      .eq('token_id', tokenIdOrSymbol)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (cachedData) {
      console.log("Using cached data for", tokenIdOrSymbol);
      return cachedData.data as TokenMetrics;
    }
    
    console.log("Fetching fresh data for", tokenIdOrSymbol);
    
    // Fetch token details
    const tokenDetails = await getTokenDetails(tokenIdOrSymbol);
    // Fetch market chart data
    const marketChart = await getTokenMarketChart(tokenIdOrSymbol);
    
    // Process the data and calculate health scores
    const metrics = calculateHealthMetrics(tokenDetails, marketChart);
    
    // Cache the result
    await cacheTokenData(tokenIdOrSymbol, metrics);
    
    // Save scan result for logged-in users
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await saveScanHistory(session.user.id, tokenIdOrSymbol, metrics);
    }
    
    return metrics;
  } catch (error) {
    console.error(`Error scanning token ${tokenIdOrSymbol}:`, error);
    return null;
  }
}

/**
 * Calculate health metrics for a token based on raw data
 */
function calculateHealthMetrics(
  tokenDetails: TokenDetails,
  marketChart: any
): TokenMetrics {
  // Initialize scores for each category
  const securityScore = calculateSecurityScore(tokenDetails);
  const liquidityScore = calculateLiquidityScore(tokenDetails, marketChart);
  const tokenomicsScore = calculateTokenomicsScore(tokenDetails);
  const communityScore = calculateCommunityScore(tokenDetails);
  const developmentScore = calculateDevelopmentScore(tokenDetails);
  
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
  
  // Social followers count
  const socialFollowers = formatNumber(tokenDetails.community_data?.twitter_followers || 0);
  
  return {
    name: tokenDetails.name,
    symbol: tokenDetails.symbol.toUpperCase(),
    marketCap,
    // These fields would come from other data sources in a full implementation
    liquidityLock: "365 days", // Placeholder
    topHoldersPercentage: "42%", // Placeholder
    tvl: "$1.2M", // Placeholder
    auditStatus: "Verified", // Placeholder
    socialFollowers,
    categories: {
      security: { score: securityScore },
      liquidity: { score: liquidityScore },
      tokenomics: { score: tokenomicsScore },
      community: { score: communityScore },
      development: { score: developmentScore }
    },
    healthScore
  };
}

/**
 * Calculate security score based on various factors
 */
function calculateSecurityScore(tokenDetails: TokenDetails): number {
  // In a real implementation, this would analyze contract security, audits, etc.
  // For now, using a placeholder score based on market cap rank and existence
  const hasMarketCap = !!tokenDetails.market_data?.market_cap?.usd;
  const hasGitHub = tokenDetails.links?.repos_url?.github?.length > 0;
  
  let score = 50; // Base score
  
  // Add points based on market cap rank (established projects tend to be more secure)
  if (tokenDetails.market_cap_rank) {
    if (tokenDetails.market_cap_rank <= 10) score += 30;
    else if (tokenDetails.market_cap_rank <= 100) score += 20;
    else if (tokenDetails.market_cap_rank <= 1000) score += 10;
  }
  
  // Add points for having GitHub repositories (transparency)
  if (hasGitHub) score += 10;
  
  // Add points for having a market cap (established project)
  if (hasMarketCap) score += 10;
  
  // Cap the score at 100
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate liquidity score
 */
function calculateLiquidityScore(tokenDetails: TokenDetails, marketChart: any): number {
  // In a real implementation, this would analyze liquidity depth, trading volume, etc.
  // For now, using volume and market cap as proxies for liquidity
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
  
  // Cap the score at 100
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate tokenomics score
 */
function calculateTokenomicsScore(tokenDetails: TokenDetails): number {
  // In a real implementation, this would analyze supply dynamics, distribution, etc.
  // For now, using a placeholder score
  return 65; // Fixed score for MVP
}

/**
 * Calculate community score
 */
function calculateCommunityScore(tokenDetails: TokenDetails): number {
  // Based on social metrics
  const twitterFollowers = tokenDetails.community_data?.twitter_followers || 0;
  const redditSubscribers = tokenDetails.community_data?.reddit_subscribers || 0;
  const telegramUsers = tokenDetails.community_data?.telegram_channel_user_count || 0;
  
  let score = 50; // Base score
  
  // Twitter followers
  if (twitterFollowers > 1000000) score += 20;
  else if (twitterFollowers > 100000) score += 15;
  else if (twitterFollowers > 10000) score += 10;
  else if (twitterFollowers > 1000) score += 5;
  
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
 * Calculate development score
 */
function calculateDevelopmentScore(tokenDetails: TokenDetails): number {
  // Based on GitHub metrics
  const commitCount = tokenDetails.developer_data?.commit_count_4_weeks || 0;
  const stars = tokenDetails.developer_data?.stars || 0;
  const forks = tokenDetails.developer_data?.forks || 0;
  
  let score = 50; // Base score
  
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
  
  // Cap the score at 100
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Cache token data in Supabase
 */
async function cacheTokenData(tokenId: string, data: TokenMetrics): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + CACHE_DURATION);
  
  await supabase
    .from('token_data_cache')
    .upsert({
      token_id: tokenId,
      data,
      expires_at: expiresAt.toISOString(),
      last_updated: new Date().toISOString()
    })
    .select();
}

/**
 * Save scan history for logged-in users
 */
async function saveScanHistory(userId: string, tokenId: string, metrics: TokenMetrics): Promise<void> {
  await supabase
    .from('token_scans')
    .insert({
      user_id: userId,
      token_id: tokenId,
      token_symbol: metrics.symbol,
      token_name: metrics.name,
      health_score: metrics.healthScore,
      category_scores: metrics.categories
    })
    .select();
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
