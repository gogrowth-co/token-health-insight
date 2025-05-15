
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

// Set up CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Define Twitter profile data structure
interface TwitterProfile {
  username: string;
  displayName: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  verified: boolean;
  createdAt: string;
  profileImageUrl: string;
  location?: string;
  url?: string;
  followerChange?: {
    trend: 'up' | 'down' | 'stable';
    percentage: string;
  };
}

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? ""
);

// Helper function to clean username
function cleanUsername(username?: string): string | null {
  if (!username) return null;
  
  // Remove @ symbol if present
  username = username.replace(/^@/, '');
  
  // Clean any other special characters
  return username.replace(/[^a-zA-Z0-9_]/g, '');
}

// Extract Twitter handle from token data
function getTwitterHandleFromToken(tokenId: string, symbol: string, name: string): string | null {
  // Try to extract from tokenId
  if (tokenId.includes('twitter.com/') || tokenId.includes('x.com/')) {
    const match = tokenId.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i);
    if (match && match[1]) {
      return cleanUsername(match[1]);
    }
  }
  
  // Most crypto projects use their symbol or name as Twitter handle
  return cleanUsername(symbol) || cleanUsername(name);
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Parse request body
    const { tokenId, symbol, name } = await req.json();
    
    if (!tokenId && !symbol && !name) {
      return new Response(
        JSON.stringify({ error: "Missing token information" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Extract Twitter handle from input
    const twitterUsername = getTwitterHandleFromToken(tokenId, symbol, name);
    
    if (!twitterUsername) {
      return new Response(
        JSON.stringify({ error: "Could not determine Twitter username" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    console.log(`Looking up Twitter profile for: ${twitterUsername}`);
    
    // Check cache first
    const { data: cachedProfile } = await supabaseClient
      .from('twitter_profile_cache')
      .select('profile_data, fetched_at')
      .eq('username', twitterUsername.toLowerCase())
      .single();
    
    // If we have a cached profile that's less than 24 hours old, use it
    if (cachedProfile) {
      const fetchedAt = new Date(cachedProfile.fetched_at);
      const now = new Date();
      const hoursSinceFetch = (now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceFetch < 24) {
        console.log(`Using cached Twitter profile for ${twitterUsername}`);
        return new Response(
          JSON.stringify(cachedProfile.profile_data),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Simulate profile fetch (in a real implementation, you would call Twitter API)
    const mockProfile: TwitterProfile = generateMockTwitterProfile(twitterUsername, symbol, name);
    
    // Cache the profile
    await supabaseClient
      .from('twitter_profile_cache')
      .upsert({
        username: twitterUsername.toLowerCase(),
        profile_data: mockProfile,
        fetched_at: new Date().toISOString()
      });
    
    return new Response(
      JSON.stringify(mockProfile),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(`Error processing request: ${error.message}`);
    
    return new Response(
      JSON.stringify({ error: "Error fetching Twitter profile", message: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

/**
 * Generate a mock Twitter profile for development purposes
 * In production, this would be replaced with a real API call
 */
function generateMockTwitterProfile(username: string, symbol?: string, name?: string): TwitterProfile {
  // Determine if profile should be "verified" based on a simple pattern
  const isVerified = Math.random() > 0.5;
  
  // Generate a realistic follower count based on a token's probable popularity
  let followersCount = 0;
  const rand = Math.random();
  if (rand > 0.95) {
    // Very popular projects (5%)
    followersCount = Math.floor(500000 + Math.random() * 1500000);
  } else if (rand > 0.8) {
    // Popular projects (15%)
    followersCount = Math.floor(100000 + Math.random() * 400000);
  } else if (rand > 0.5) {
    // Medium projects (30%)
    followersCount = Math.floor(10000 + Math.random() * 90000);
  } else if (rand > 0.2) {
    // Small projects (30%)
    followersCount = Math.floor(1000 + Math.random() * 9000);
  } else {
    // Very small projects (20%)
    followersCount = Math.floor(100 + Math.random() * 900);
  }
  
  // Create a realistic account creation date
  const createdAt = new Date();
  // Set between 1-5 years ago
  createdAt.setFullYear(createdAt.getFullYear() - Math.floor(1 + Math.random() * 4));
  // Set random month and day
  createdAt.setMonth(Math.floor(Math.random() * 12));
  createdAt.setDate(Math.floor(1 + Math.random() * 28));
  
  const displayName = name || `${symbol || username} Official`;
  
  return {
    username: username,
    displayName: displayName,
    bio: `Official account for ${name || symbol || username}. Building the future of decentralized finance.`,
    followersCount: followersCount,
    followingCount: Math.floor(followersCount * 0.1),
    tweetCount: Math.floor(500 + Math.random() * 5000),
    verified: isVerified,
    createdAt: createdAt.toISOString(),
    profileImageUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
    location: Math.random() > 0.5 ? "Crypto Valley, Switzerland" : undefined,
    url: `https://${username.toLowerCase()}.io`,
    followerChange: {
      trend: Math.random() > 0.3 ? 'up' : 'down',
      percentage: `${(Math.random() * 20).toFixed(1)}%`
    }
  };
}
