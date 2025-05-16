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
    securityAnalysis?: {
      ownershipRenounced?: boolean;
      canMint?: boolean;
      canBurn?: boolean;
      hasFreeze?: boolean;
      isMultiSig?: boolean;
    };
  };
  defiLlama?: any;
  tvlSparkline?: {
    data: number[];
    trend: 'up' | 'down';
    change: number;
  };
  poolAddress?: string;
  dataSources?: string[];
  // New token info fields
  description?: string;
  website?: string;
  twitterUrl?: string;
  githubUrl?: string;
  explorerUrl?: string;
  whitepaper?: string;
  launchDate?: string;
  tokenType?: string;
}

// Added missing type for TokenSearchResult
export interface TokenSearchResult {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank?: number;
  thumb?: string;
  large?: string;
}

// Added missing type for TokenDetails
export interface TokenDetails {
  id: string;
  symbol: string;
  name: string;
  market_cap_rank?: number;
  market_data?: {
    current_price?: Record<string, number>;
    market_cap?: Record<string, number>;
    total_volume?: Record<string, number>;
    max_supply?: number;
    circulating_supply?: number;
    total_supply?: number;
  };
  community_data?: {
    twitter_followers?: number;
    reddit_subscribers?: number;
    telegram_channel_user_count?: number;
  };
  developer_data?: {
    forks?: number;
    stars?: number;
    subscribers?: number;
    total_issues?: number;
    closed_issues?: number;
    pull_request_contributors?: number;
    commit_count_4_weeks?: number;
  };
  links?: {
    homepage?: string[];
    blockchain_site?: string[];
    repos_url?: {
      github?: string[];
      bitbucket?: string[];
    };
    twitter_screen_name?: string;
    telegram_channel_identifier?: string;
  };
  tickers?: any[];
  platforms?: Record<string, string>;
}

// Added missing type for TokenScanHistoryItem
export interface TokenScanHistoryItem {
  id: string;
  token: string;
  projectName: string;
  scanDate: string;
  healthScore: number;
}

// Enhanced type for Core Metrics from our new function
export interface TokenCoreMetrics {
  name: string;
  symbol: string;
  price: number | null;
  marketCap: number | null;
  volume24h: number | null; 
  dexVolume24h: number | null;
  liquidityUSD: number | null;
  supply: number | null;
  contractAddress: string;
  dataQuality: "complete" | "partial" | "minimal";
  dataSources: string[];
  scannedAt: string;
  tvlSparkline?: {
    data: number[];
    trend: 'up' | 'down';
    change: number;
  };
  communityData?: {
    twitterFollowers?: number;
    telegramUsers?: number;
    redditSubscribers?: number;
  };
  developerData?: {
    forks?: number;
    stars?: number;
    commitCount?: number;
  };
}

// Add a new TokenInfoPanelProps interface
export interface TokenInfoData {
  name: string;
  symbol: string;
  contractAddress?: string;
  description?: string;
  website?: string;
  twitterUrl?: string;
  githubUrl?: string;
  explorerUrl?: string;
  whitepaper?: string;
  launchDate?: string;
  tokenType?: string;
  network?: string;
}
