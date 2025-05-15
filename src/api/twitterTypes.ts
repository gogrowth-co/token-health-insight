
export interface TwitterProfile {
  url: string;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  verified: boolean;
  createdAt: string;
  name: string;
  screenName: string;
  description?: string;
  profileImageUrl?: string;
}

export interface TwitterProfileResponse {
  userData: TwitterProfile;
  error?: string;
}

export interface TwitterMetrics {
  followersCount: number;
  tweetCount: number;
  verified: boolean;
  createdAt: string;
  screenName: string;
  followerChange?: {
    trend: 'up' | 'down' | 'neutral';
    value: number;
    percentage: string;
  };
}
