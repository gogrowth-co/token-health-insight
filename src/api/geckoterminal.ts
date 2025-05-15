
/**
 * GeckoTerminal API service for fetching on-chain token and pool data
 * API Documentation: https://apiguide.geckoterminal.com/
 */

// Base URL for the GeckoTerminal API
const BASE_URL = "https://api.geckoterminal.com/api/v2";

// API version header
const API_VERSION = "20230302";

// Headers for API requests
const headers = {
  'Accept': `application/json;version=${API_VERSION}`
};

/**
 * Get token data from GeckoTerminal
 * @param network Network identifier (e.g., 'eth', 'bsc')
 * @param tokenAddress Token contract address
 */
export async function getTokenData(network: string, tokenAddress: string) {
  try {
    const response = await fetch(
      `${BASE_URL}/networks/${network}/tokens/${tokenAddress}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Error fetching token data: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch token data for ${tokenAddress}:`, error);
    throw error;
  }
}

/**
 * Get pool data from GeckoTerminal
 * @param network Network identifier (e.g., 'eth', 'bsc')
 * @param poolAddress Pool address
 */
export async function getPoolData(network: string, poolAddress: string) {
  try {
    const response = await fetch(
      `${BASE_URL}/networks/${network}/pools/${poolAddress}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Error fetching pool data: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch pool data for ${poolAddress}:`, error);
    throw error;
  }
}

/**
 * Get token pools from GeckoTerminal
 * @param network Network identifier (e.g., 'eth', 'bsc')
 * @param tokenAddress Token contract address
 */
export async function getTokenPools(network: string, tokenAddress: string) {
  try {
    const response = await fetch(
      `${BASE_URL}/networks/${network}/tokens/${tokenAddress}/pools`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Error fetching token pools: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch token pools for ${tokenAddress}:`, error);
    throw error;
  }
}

/**
 * Get OHLCV data for a pool
 * @param network Network identifier
 * @param poolAddress Pool address
 * @param timeframe Timeframe for the OHLCV data
 * @param aggregate Aggregate interval
 */
export async function getPoolOhlcv(
  network: string,
  poolAddress: string,
  timeframe = '1h',
  aggregate = '5m'
) {
  try {
    const response = await fetch(
      `${BASE_URL}/networks/${network}/pools/${poolAddress}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=12`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Error fetching OHLCV data: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch OHLCV data for pool ${poolAddress}:`, error);
    throw error;
  }
}

/**
 * Detect token network from token ID or symbol
 * This is a simplified version - in production, you'd have a more robust detection
 */
export function detectNetwork(tokenIdOrSymbol: string): string {
  // Extract network from token ID if it contains a colon
  if (tokenIdOrSymbol.includes(':')) {
    const parts = tokenIdOrSymbol.split(':');
    return mapNetworkName(parts[0]);
  }
  
  // Default to Ethereum for CoinGecko IDs without explicit network
  return 'eth';
}

/**
 * Map network name to GeckoTerminal network identifier
 */
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

/**
 * Extract token address from CoinGecko ID
 */
export function extractTokenAddress(tokenIdOrSymbol: string): string | null {
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
