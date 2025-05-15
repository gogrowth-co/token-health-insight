
export interface TokenCategories {
  security: {
    score: number;
  };
  liquidity: {
    score: number;
  };
  tokenomics: {
    score: number;
  };
  community: {
    score: number;
  };
  development: {
    score: number;
  };
}

export interface GoPlusSecurityData {
  ownershipRenounced?: boolean;
  canMint?: boolean;
  hasBlacklist?: boolean;
  slippageModifiable?: boolean;
  isHoneypot?: boolean;
  ownerCanChangeBalance?: boolean;
  isProxy?: boolean;
  hasExternalCalls?: boolean;
  transferPausable?: boolean;
  isSelfdestructable?: boolean;
  isOpenSource?: boolean;
  buyTax?: string;
  sellTax?: string;
  riskLevel?: string;
}

export interface TokenTwitterData {
  verified?: boolean;
  screenName?: string;
  followersCount?: number;
  friendsCount?: number;
  statusesCount?: number;
  createdAt?: string;
  tweetCount?: number;
  followerChange?: {
    value: number;
    percentage: string;
  };
}

export interface TokenGithubData {
  starCount?: number;
  forkCount?: number;
  commitCount?: number;
  contributorCount?: number;
  openIssues?: number;
  language?: string;
  license?: string;
  updatedAt?: string;
  activityStatus?: string;
  roadmapProgress?: string;
}

export interface TokenMetrics {
  name: string;
  symbol: string;
  marketCap?: string;
  tvl?: string;
  liquidityLock?: string;
  topHoldersPercentage?: string;
  auditStatus?: string;
  socialFollowers?: string;
  poolAge?: string;
  volume24h?: string;
  txCount24h?: number;
  network?: string;
  categories: TokenCategories;
  healthScore: number;
  lastUpdated?: number;
  dataQuality?: "complete" | "partial";
  goPlus?: GoPlusSecurityData;
  twitter?: TokenTwitterData;
  github?: TokenGithubData;
  etherscan?: {
    contractAddress?: string;
  };
}
