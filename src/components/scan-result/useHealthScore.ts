
import { TokenInfo } from "@/hooks/useTokenInfo";
import { TokenMetrics } from "@/hooks/useTokenMetrics";

export function useHealthScore(tokenMetrics?: TokenMetrics, tokenInfo?: TokenInfo | null) {
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
  
  return calculateHealthScore();
}
