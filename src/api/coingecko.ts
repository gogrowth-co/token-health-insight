
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
  try {
    return await fetchJsonWithTimeout<TokenDetails>(
      `${BASE_URL}/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true${getApiParams()}`,
      {},
      12000 // 12 second timeout for detailed data
    );
  } catch (error) {
    console.error(`Failed to fetch details for token ${tokenId}:`, error);
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
  try {
    return await fetchJsonWithTimeout(
      `${BASE_URL}/coins/${tokenId}/market_chart?vs_currency=${currency}&days=${days}${getApiParams()}`,
      {},
      8000 // 8 second timeout
    );
  } catch (error) {
    console.error(`Failed to fetch market chart for ${tokenId}:`, error);
    throw error;
  }
}
