/**
 * Types for GeckoTerminal API responses
 */

// GeckoTerminal Pool Data
export interface GeckoTerminalPoolData {
  data: {
    id: string;
    type: string;
    attributes: {
      name: string;
      address: string;
      reserve_in_usd?: string;
      volume_usd?: {
        h24?: string;
        h6?: string;
        h1?: string;
      };
      transactions?: {
        h24?: number;
        h6?: number;
        h1?: number;
      };
      creation_timestamp?: string;
      liquidity_locked?: {
        is_locked?: boolean;
        locked_until?: string;
        duration_in_seconds?: number;
      };
      [key: string]: any;
    };
    relationships?: {
      [key: string]: any;
    };
  };
  included?: any[];
}

// GeckoTerminal Token Pools Response
export interface GeckoTerminalTokenPoolsResponse {
  data: Array<{
    id: string;
    type: string;
    attributes: {
      address: string;
      name: string;
      [key: string]: any;
    };
  }>;
  included?: any[];
}

// Helper function to format TVL history data for sparkline charts
export function formatTVLHistoryForSparkline(tvlHistoryData: any[], days: number): number[] {
  // If we have enough data, take the last 'days' entries
  if (tvlHistoryData.length > days) {
    return tvlHistoryData.slice(-days).map(item => item.tvl || 0);
  }
  
  // Otherwise use all available data
  return tvlHistoryData.map(item => item.tvl || 0);
}

/**
 * Extract token address from ID value that may contain network:address format
 */
export function extractTokenAddressFromId(id: string): string | null {
  if (id.includes(':')) {
    return id.split(':')[1];
  }
  return null;
}

/**
 * Extract network ID from token ID
 */
export function extractNetworkFromId(id: string): string {
  if (id.includes(':')) {
    return id.split(':')[0];
  }
  return 'eth'; // Default to Ethereum
}
