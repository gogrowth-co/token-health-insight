
import { TwitterProfileResponse } from "./twitterTypes";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches Twitter profile data using Apify
 */
export async function fetchTwitterProfile(username: string): Promise<TwitterProfileResponse | null> {
  try {
    // Try to use the Supabase edge function first
    const { data, error } = await supabase.functions.invoke('fetch-twitter-profile', {
      body: { username }
    });
    
    if (error) {
      console.error("Error calling edge function:", error);
      throw new Error(error.message);
    }
    
    return data as TwitterProfileResponse;
  } catch (error) {
    console.error("Failed to fetch Twitter profile:", error);
    return null;
  }
}

/**
 * Extract Twitter handle from various sources
 */
export function extractTwitterHandle(tokenDetails: any): string | null {
  // Direct from Twitter screen name in CoinGecko data
  if (tokenDetails.links?.twitter_screen_name) {
    return tokenDetails.links.twitter_screen_name;
  }
  
  // Check in twitter URLs in the links
  if (tokenDetails.links?.announcement_url) {
    for (const url of tokenDetails.links.announcement_url) {
      if (url.includes('twitter.com/') || url.includes('x.com/')) {
        const match = url.match(/(?:twitter\.com|x\.com)\/([^/?]+)/);
        if (match && match[1]) return match[1];
      }
    }
  }
  
  // Check in homepage URLs
  if (tokenDetails.links?.homepage) {
    for (const url of tokenDetails.links.homepage) {
      if (url.includes('twitter.com/') || url.includes('x.com/')) {
        const match = url.match(/(?:twitter\.com|x\.com)\/([^/?]+)/);
        if (match && match[1]) return match[1];
      }
    }
  }
  
  // Try to guess from the name (fallback)
  if (tokenDetails.name) {
    return tokenDetails.name.toLowerCase().replace(/\s+/g, '');
  }
  
  return null;
}

/**
 * Calculate follower growth trend and percentage
 */
export function calculateFollowerGrowth(
  currentFollowers: number,
  historicalData?: { date: Date, followers: number }[]
): { trend: 'up' | 'down' | 'neutral', value: number, percentage: string } {
  if (!historicalData || historicalData.length === 0) {
    return { trend: 'neutral', value: 0, percentage: '0%' };
  }
  
  // Sort by date, most recent first
  const sortedData = [...historicalData].sort((a, b) => b.date.getTime() - a.date.getTime());
  const oldestData = sortedData[sortedData.length - 1];
  
  const change = currentFollowers - oldestData.followers;
  const percentage = oldestData.followers === 0 
    ? '0%' 
    : `${((change / oldestData.followers) * 100).toFixed(1)}%`;
  
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
  
  return { trend, value: change, percentage: change >= 0 ? `+${percentage}` : percentage };
}
