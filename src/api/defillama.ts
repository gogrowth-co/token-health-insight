
// DeFiLlama API Service
// Provides functions for fetching TVL data and protocol information

const DEFILLAMA_BASE_URL = "https://api.llama.fi";

/**
 * Get protocol details by slug
 */
export async function getProtocolDetails(slug: string): Promise<any | null> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/protocol/${slug}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch protocol details: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching protocol details:", error);
    return null;
  }
}

/**
 * Get TVL data for a specific protocol
 */
export async function getProtocolTVL(slug: string): Promise<any | null> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/tvl/${slug}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch TVL data: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching TVL data:", error);
    return null;
  }
}

/**
 * Get TVL historical data for a protocol
 */
export async function getProtocolTVLHistory(slug: string): Promise<any | null> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/tvl/${slug}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch TVL history: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching TVL history:", error);
    return null;
  }
}

/**
 * Get all protocols listed on DeFiLlama
 */
export async function getAllProtocols(): Promise<any | null> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/protocols`);
    if (!response.ok) {
      throw new Error(`Failed to fetch protocols: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching protocols:", error);
    return null;
  }
}

/**
 * Find the matching protocol slug based on token symbol or name
 * @param tokenSymbol The token symbol (e.g., "ETH")
 * @param tokenName The token name (e.g., "Ethereum")
 */
export async function findProtocolSlug(
  tokenSymbol: string, 
  tokenName: string
): Promise<string | null> {
  try {
    // First get all protocols
    const protocols = await getAllProtocols();
    
    if (!protocols) return null;
    
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
    
    if (!match && normalizedName.length > 3) {
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

/**
 * Calculate TVL change percentage
 * @param currentTVL Current TVL value
 * @param previousTVL Previous TVL value
 */
export function calculateTVLChange(currentTVL: number, previousTVL: number): number {
  if (previousTVL === 0) return 0;
  return ((currentTVL - previousTVL) / previousTVL) * 100;
}

/**
 * Format TVL data for sparkline visualization
 * @param tvlHistory Array of TVL history data points
 * @param days Number of days to include (7 or 30)
 */
export function formatTVLHistoryForSparkline(tvlHistory: any[], days = 7): number[] {
  if (!tvlHistory || tvlHistory.length === 0) {
    return [];
  }
  
  // Get the last N days of data
  const recentData = tvlHistory.slice(-days);
  
  // Extract just the TVL values
  return recentData.map((dataPoint: any) => dataPoint.totalLiquidityUSD);
}

/**
 * Get TVL change over specified period
 * @param tvlHistory TVL history data
 * @param days Number of days (7 or 30)
 */
export function getTVLChangeOverPeriod(tvlHistory: any[], days = 7): number {
  if (!tvlHistory || tvlHistory.length < days + 1) {
    return 0;
  }
  
  const currentTVL = tvlHistory[tvlHistory.length - 1].totalLiquidityUSD;
  const previousTVL = tvlHistory[tvlHistory.length - days - 1].totalLiquidityUSD;
  
  return calculateTVLChange(currentTVL, previousTVL);
}

/**
 * Format chain distribution as a readable string
 * @param chainTvls Object containing TVL by chain
 */
export function formatChainDistribution(chainTvls: Record<string, number>): string {
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
