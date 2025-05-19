
export interface TokenMetrics {
  marketCap: string;
  marketCapValue: number;
  marketCapChange24h: number;
  currentPrice: number;
  priceChange24h: number;
  liquidityLock: string;
  liquidityLockDays: number;
  topHoldersPercentage: string;
  topHoldersValue: number;
  topHoldersTrend: 'up' | 'down' | null;
  tvl: string;
  tvlValue: number;
  tvlChange24h: number;
  auditStatus: string;
  socialFollowers: string;
  socialFollowersCount: number;
  socialFollowersChange: number;
  
  // Section scores
  securityScore?: number;
  liquidityScore?: number;
  tokenomicsScore?: number;
  communityScore?: number;
  developmentScore?: number;
}

export interface TokenMetricsResponse {
  metrics: TokenMetrics;
  cacheHit: boolean;
  error?: string;
}
