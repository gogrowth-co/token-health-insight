
import { createClient } from '@supabase/supabase-js';
import { TokenMetrics } from '@/api/types';
import { getTokenDetails } from '@/api/coingecko';
import { getSecurityData } from '@/api/goPlus';
import { getTokenMarketChart } from '@/api/coingecko';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Cache duration in seconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60;

// Progress update callback type
type ProgressCallback = (progress: number) => void;

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
      return null;
    }
    
    // Try to get from cache first
    const { data: cachedData } = await supabaseClient
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
      const { data, error } = await supabaseClient.functions.invoke('scan-token', {
        body: { tokenId: tokenIdOrSymbol }
      });
      
      if (error) {
        console.error("Error from scan-token function:", error);
        return null;
      }
      
      onProgress?.(0.9);
      
      if (!data) {
        throw new Error("No data returned from scan-token function");
      }
      
      const metrics = data as TokenMetrics;
      
      // Show appropriate toast based on data quality
      if (metrics.dataQuality === 'complete') {
        console.log(`Full analysis for ${metrics.symbol} completed with health score: ${metrics.healthScore}/100`);
      } else {
        console.log(`Limited data available for ${metrics.symbol}. Health score: ${metrics.healthScore}/100`);
      }
      
      onProgress?.(1.0);
      
      // Save scan result for logged-in users
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session?.user) {
        await saveScanHistory(session.user.id, tokenIdOrSymbol, metrics);
      }
      
      return metrics;
    } catch (functionError) {
      console.error(`Edge function error:`, functionError);
      return await scanTokenDirectly(tokenIdOrSymbol, onProgress);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error(`Error scanning token ${tokenIdOrSymbol}:`, error);
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
    let tokenAddress = tokenIdOrSymbol;
    
    // Run concurrent API calls for better performance
    let goPlusData = null;
    
    if (tokenAddress) {
      try {
        // Get security data
        goPlusData = await getSecurityData(tokenAddress);
      } catch (err) {
        console.warn("Error fetching GoPlus security data:", err);
      }
    }
    
    onProgress?.(0.7);
    
    // Process the data and calculate health scores
    const metrics = calculateHealthMetrics(
      tokenDetails, 
      marketChart, 
      null, // poolData (disabled for performance)
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
  tokenDetails: any,
  marketChart: any,
  poolData?: any,
  etherscanData?: any,
  defiLlamaData?: any,
  githubData?: any,
  twitterData?: any,
  goPlusData?: any
): TokenMetrics {
  // Initialize scores for each category
  const securityScore = 50; // Placeholder score
  const liquidityScore = 50; // Placeholder score
  const tokenomicsScore = 50; // Placeholder score
  const communityScore = 50; // Placeholder score
  const developmentScore = 50; // Placeholder score
  
  // Format market cap for display
  const marketCap = formatCurrency(tokenDetails.market_data?.market_cap?.usd || 0);
  
  // Create the metrics object
  const metrics: TokenMetrics = {
    name: tokenDetails.name,
    symbol: tokenDetails.symbol.toUpperCase(),
    marketCap,
    categories: {
      security: { score: securityScore },
      liquidity: { score: liquidityScore },
      tokenomics: { score: tokenomicsScore },
      community: { score: communityScore },
      development: { score: developmentScore }
    },
    healthScore: Math.round((securityScore + liquidityScore + tokenomicsScore + communityScore + developmentScore) / 5),
    lastUpdated: Date.now(),
    // Enhanced token info fields from CoinGecko API
    description: tokenDetails.description?.en,
    website: tokenDetails.links?.homepage?.[0],
    twitterUrl: tokenDetails.links?.twitter_screen_name,
    githubUrl: tokenDetails.links?.repos_url?.github?.[0],
    tokenType: tokenDetails.asset_platform_id ? `${tokenDetails.asset_platform_id.charAt(0).toUpperCase() + tokenDetails.asset_platform_id.slice(1)} Token` : "Native Token",
    network: tokenDetails.asset_platform_id || "ethereum",
    // Extract contract address from platforms if available
    etherscan: {
      contractAddress: tokenDetails.platforms && Object.values(tokenDetails.platforms).find(value => value)
    }
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
 * Cache token data in Supabase
 */
async function cacheTokenData(tokenId: string, data: TokenMetrics): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + CACHE_DURATION);
    
    await supabaseClient
      .from('token_data_cache')
      .upsert({
        token_id: tokenId,
        data: data as unknown as Record<string, any>,
        expires_at: expiresAt.toISOString(),
        last_updated: new Date().toISOString()
      });
  } catch (error) {
    console.error("Error caching token data:", error);
  }
}

/**
 * Save scan history for logged-in users
 */
async function saveScanHistory(userId: string, tokenId: string, metrics: TokenMetrics): Promise<void> {
  try {
    await supabaseClient
      .from('token_scans')
      .insert({
        user_id: userId,
        token_id: tokenId,
        token_symbol: metrics.symbol,
        token_name: metrics.name,
        health_score: metrics.healthScore,
        category_scores: metrics.categories as unknown as Record<string, any>,
      });
  } catch (error) {
    console.error("Error saving scan history:", error);
  }
}
