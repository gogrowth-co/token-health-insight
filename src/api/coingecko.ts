
import { fetchJsonWithTimeout } from "@/utils/fetchWithTimeout";
import { TokenDetails, TokenSearchResult } from "./types";

// Base URL for CoinGecko API
const BASE_URL = "https://api.coingecko.com/api/v3";

// API parameter with API key if provided, otherwise empty
const getApiParams = (): string => {
  // For the free tier, we can make limited requests without an API key
  // When we upgrade to Pro, we'll add the key from Supabase secrets
  return "";
};

/**
 * Clean token ID for API compatibility
 * Remove $ and other special characters that may cause issues
 */
export function cleanTokenId(tokenId: string): string {
  // Remove $ symbol which is common in token names but not in CoinGecko IDs
  return tokenId.replace(/^\$/, '');
}

/**
 * Search for tokens by query
 */
export async function searchTokens(
  query: string
): Promise<TokenSearchResult[]> {
  try {
    const data = await fetchJsonWithTimeout<{ coins: TokenSearchResult[] }>(
      `${BASE_URL}/search?query=${encodeURIComponent(query)}${getApiParams()}`,
      {},
      8000 // 8 second timeout
    );
    
    return data.coins || [];
  } catch (error) {
    console.error("Failed to search tokens:", error);
    throw error;
  }
}

/**
 * Get detailed information about a specific token
 */
export async function getTokenDetails(
  tokenId: string
): Promise<TokenDetails> {
  // Clean token ID for API compatibility
  const cleanedTokenId = cleanTokenId(tokenId);
  console.log(`Getting token details for cleaned ID: ${cleanedTokenId} (original: ${tokenId})`);
  
  try {
    return await fetchJsonWithTimeout<TokenDetails>(
      `${BASE_URL}/coins/${cleanedTokenId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true${getApiParams()}`,
      {},
      12000 // 12 second timeout for detailed data
    );
  } catch (error) {
    console.error(`Failed to fetch details for token ${cleanedTokenId}:`, error);
    throw error;
  }
}

/**
 * Get market chart data for a token
 */
export async function getTokenMarketChart(
  tokenId: string,
  days = 30,
  currency = "usd"
): Promise<{ prices: [number, number][]; market_caps: [number, number][]; total_volumes: [number, number][] }> {
  // Clean token ID for API compatibility
  const cleanedTokenId = cleanTokenId(tokenId);
  
  try {
    return await fetchJsonWithTimeout(
      `${BASE_URL}/coins/${cleanedTokenId}/market_chart?vs_currency=${currency}&days=${days}${getApiParams()}`,
      {},
      8000 // 8 second timeout
    );
  } catch (error) {
    console.error(`Failed to fetch market chart for ${cleanedTokenId}:`, error);
    throw error;
  }
}
