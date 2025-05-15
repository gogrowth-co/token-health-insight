
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

export interface TokenMetrics {
  name: string;
  symbol: string;
  marketCap: string;
  liquidityLock: string;
  topHoldersPercentage: string;
  tvl: string;
  auditStatus: string;
  socialFollowers: string;
  categories: {
    security: { score: number };
    liquidity: { score: number };
    tokenomics: { score: number };
    community: { score: number };
    development: { score: number };
  };
  healthScore: number;
}

export interface TokenScanHistoryItem {
  id: string;
  token: string;
  projectName: string;
  scanDate: string;
  healthScore: number;
}
