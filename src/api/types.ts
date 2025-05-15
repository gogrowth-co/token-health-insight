export interface TokenSearchResult {
  id: string;
  symbol: string;
  name: string;
  market_cap_rank?: number;
  thumb?: string;
  large?: string;
}

export interface TokenDetails {
  id: string;
  symbol: string;
  name: string;
  description?: { en: string };
  market_cap_rank?: number;
  image?: {
    thumb: string;
    small: string;
    large: string;
  };
  market_data?: {
    current_price: { [key: string]: number };
    market_cap: { [key: string]: number };
    total_volume: { [key: string]: number };
    price_change_percentage_24h?: number;
    price_change_percentage_7d?: number;
    price_change_percentage_30d?: number;
  };
  community_data?: {
    twitter_followers: number;
    reddit_subscribers: number;
    telegram_channel_user_count?: number;
  };
  developer_data?: {
    forks: number;
    stars: number;
    subscribers: number;
    total_issues: number;
    commit_count_4_weeks: number;
  };
  links?: {
    homepage: string[];
    blockchain_site: string[];
    official_forum_url: string[];
    chat_url: string[];
    announcement_url: string[];
    twitter_screen_name: string;
    telegram_channel_identifier: string;
    repos_url?: {
      github: string[];
      bitbucket: string[];
    };
  };
}

export interface TokenMarketData {
  total_liquidity?: number;
  total_volume_24h?: number;
  price_change_24h?: number;
}

// GeckoTerminal Interfaces
export interface GeckoTerminalTokenData {
  data: {
    id: string;
    type: string;
    attributes: {
      address: string;
      name: string;
      symbol: string;
      decimals: number;
      total_supply: string;
      coingecko_coin_id: string | null;
      top_pools?: string[];
    };
    relationships: {
      pools: {
        data: Array<{ id: string; type: string }>;
      };
    };
  };
}

export interface GeckoTerminalPoolData {
  data: {
    id: string;
    type: string;
    attributes: {
      address: string;
      name: string;
      reserve_in_usd: string;
      base_token_price_usd: string;
      quote_token_price_usd: string;
      base_token_price_native_currency: string;
      quote_token_price_native_currency: string;
      volume_usd: {
        h24: string;
        h6: string;
        m5: string;
      };
      transactions: {
        h24: number;
        h6: number;
        m5: number;
      };
      creation_block: number;
      creation_timestamp: string;
      liquidity_locked?: {
        is_locked: boolean;
        locked_until?: string;
        duration_in_seconds?: number;
      };
    };
    relationships: {
      base_token: {
        data: { id: string; type: string };
      };
      quote_token: {
        data: { id: string; type: string };
      };
    };
  };
  included: Array<{
    id: string;
    type: string;
    attributes: {
      address: string;
      name: string;
      symbol: string;
    };
  }>;
}

export interface GeckoTerminalPoolsResponse {
  data: Array<{
    id: string;
    type: string;
    attributes: {
      address: string;
      name: string;
      reserve_in_usd: string;
      volume_usd: {
        h24: string;
      };
    };
    relationships: {
      dex: {
        data: { id: string; type: string };
      };
    };
  }>;
  included: Array<{
    id: string;
    type: string;
    attributes: {
      name: string;
    };
  }>;
  links: {
    self: string;
    next?: string;
  };
}

export interface GeckoTerminalOhlcvData {
  data: Array<{
    timestamp: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }>;
}

import { DefiLlamaData, SparklineData } from './defiLlamaTypes';

export interface TokenMetrics {
  name: string;
  symbol: string;
  marketCap: string;
  liquidityLock: string;
  topHoldersPercentage: string;
  tvl: string;
  auditStatus: string;
  socialFollowers: string;
  // New fields for GeckoTerminal data
  poolAge?: string;
  volume24h?: string;
  txCount24h?: number;
  priceChange?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  network?: string;
  poolAddress?: string;
  // New fields for Etherscan data
  etherscan?: {
    securityAnalysis?: {
      ownershipRenounced: boolean;
      canMint: boolean;
      canBurn: boolean;
      hasFreeze: boolean;
      isMultiSig: boolean;
      isProxy: boolean;
    };
    contractAddress?: string;
  };
  // New fields for DeFiLlama data
  defiLlama?: DefiLlamaData;
  // TVL sparkline data
  tvlSparkline?: SparklineData;
  categories: {
    security: { score: number };
    liquidity: { score: number };
    tokenomics: { score: number };
    community: { score: number };
    development: { score: number };
  };
  healthScore: number;
  // Last data update timestamp
  lastUpdated?: number;
}

export interface TokenScanHistoryItem {
  id: string;
  token: string;
  projectName: string;
  scanDate: string;
  healthScore: number;
}
