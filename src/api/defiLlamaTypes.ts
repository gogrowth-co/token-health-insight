
// DeFiLlama API Types

export interface DefiLlamaTVLResponse {
  tvl: number[];
  tokensInUsd: number[];
  tokens: Record<string, number[]>;
  chainTvls: Record<string, number[]>;
  name: string;
  symbol: string;
  category: string;
  chains: string[];
}

export interface DefiLlamaProtocolResponse {
  id: string;
  name: string;
  address?: string;
  symbol: string;
  url: string;
  description: string;
  chain: string;
  logo: string;
  audits: string;
  audit_links: string[];
  gecko_id: string;
  cmcId: string;
  category: string;
  chains: string[];
  module: string;
  twitter: string;
  forkedFrom: string[];
  oracles: string[];
  listedAt: number;
  methodology: string;
  tvl: number;
  chainTvls: Record<string, number>;
  mcap: number;
  tvlPrevDay: number;
  tvlPrevWeek: number;
  tvlPrevMonth: number;
  extra: Record<string, any>;
}

export interface DefiLlamaTVLHistoryItem {
  date: number;
  totalLiquidityUSD: number;
}

export interface DefiLlamaData {
  tvl: number | null;
  tvlChange7d: number | null;
  tvlChange30d: number | null;
  chainDistribution: string;
  supportedChains: string[];
  tvlHistoryData: DefiLlamaTVLHistoryItem[];
  protocolSlug: string | null;
  category: string | null;
}

export interface SparklineData {
  data: number[];
  trend: 'up' | 'down' | 'neutral';
  change: number;
}
