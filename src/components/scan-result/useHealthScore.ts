
import { TokenInfo } from "@/hooks/useTokenInfo";
import { TokenMetrics } from "@/hooks/useTokenMetrics";
import { withFallback } from "@/utils/dataHelpers";

export function useHealthScore(tokenMetrics?: TokenMetrics, tokenInfo?: TokenInfo | null) {
  // Function to calculate health score based on actual token metrics
  const calculateHealthScore = () => {
    // Start with a base score
    let score = 65;
    
    if (!tokenMetrics && !tokenInfo) return score;
    
    // Adjust score based on available metrics from tokenMetrics
    if (tokenMetrics) {
      // Market cap - higher is better
      const marketCapValue = tokenMetrics.marketCapValue || 0;
      if (marketCapValue > 1000000000) { // > $1B
        score += 15;
      } else if (marketCapValue > 100000000) { // > $100M
        score += 10;
      } else if (marketCapValue > 10000000) { // > $10M
        score += 5;
      }
      
      // TVL - higher is better
      const tvlValue = tokenMetrics.tvlValue || 0;
      if (tvlValue > 100000000) { // > $100M
        score += 10;
      } else if (tvlValue > 10000000) { // > $10M
        score += 5;
      }
      
      // Audit status - verified is better
      if (withFallback(tokenMetrics.auditStatus) === "Verified") {
        score += 5;
      }
      
      // Liquidity lock - longer is better
      if (tokenMetrics.liquidityLockDays && tokenMetrics.liquidityLockDays > 180) {
        score += 10;
      } else if (tokenMetrics.liquidityLockDays && tokenMetrics.liquidityLockDays > 30) {
        score += 5;
      }
      
      // Top holders - less concentration is better
      const topHoldersValue = tokenMetrics.topHoldersValue || 0;
      if (topHoldersValue < 30) {
        score += 10;
      } else if (topHoldersValue < 50) {
        score += 5;
      } else if (topHoldersValue > 80) {
        score -= 10;
      } else if (topHoldersValue > 60) {
        score -= 5;
      }
      
      // Security metrics
      if (withFallback(tokenMetrics.ownershipRenounced) === "Yes") {
        score += 10;
      }
      
      if (withFallback(tokenMetrics.freezeAuthority) === "No") {
        score += 5;
      } else if (withFallback(tokenMetrics.freezeAuthority) === "Yes") {
        score -= 5;
      }
      
      // If the security score is available, use it to adjust the overall score
      if (tokenMetrics.securityScore !== undefined) {
        // Weight the security score as 30% of the total
        score = Math.round(score * 0.7 + tokenMetrics.securityScore * 0.3);
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
    
    // Log the calculated score for debugging
    console.log("Health Score Calculation:", { 
      baseScore: 65,
      marketCapValue: tokenMetrics?.marketCapValue,
      tvlValue: tokenMetrics?.tvlValue,
      auditStatus: tokenMetrics?.auditStatus,
      liquidityLockDays: tokenMetrics?.liquidityLockDays,
      topHoldersValue: tokenMetrics?.topHoldersValue,
      ownershipRenounced: tokenMetrics?.ownershipRenounced,
      freezeAuthority: tokenMetrics?.freezeAuthority,
      securityScore: tokenMetrics?.securityScore,
      finalScore: Math.max(0, Math.min(100, score))
    });
    
    // Cap score between 0-100
    return Math.max(0, Math.min(100, score));
  };
  
  return calculateHealthScore();
}
