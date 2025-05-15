
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TwitterProfile {
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

interface TwitterProfileResponse {
  userData: TwitterProfile;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { username } = await req.json();
    
    if (!username) {
      return new Response(
        JSON.stringify({ error: "Username is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get Apify API key from environment
    const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY");
    
    if (!APIFY_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Apify API key not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Check cache first (if we've fetched this handle in the last 24 hours)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Twitter handles are case-insensitive, so normalize to lowercase
    const normalizedUsername = username.toLowerCase();
    
    const { data: cachedData } = await supabase
      .from('twitter_profile_cache')
      .select('profile_data, fetched_at')
      .eq('username', normalizedUsername)
      .single();

    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    
    // Return cached data if it's less than 24 hours old
    if (cachedData && (Date.now() - new Date(cachedData.fetched_at).getTime() < ONE_DAY_MS)) {
      console.log(`Returning cached Twitter data for @${normalizedUsername}`);
      return new Response(
        JSON.stringify(cachedData.profile_data),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // If no valid cached data, fetch from Apify
    console.log(`Fetching Twitter profile for @${normalizedUsername} from Apify`);
    
    // Call the Apify API for Twitter User Scraper (actor ID: V38PZzpEgOfeeWvZY)
    const apifyResponse = await fetch(
      "https://api.apify.com/v2/acts/V38PZzpEgOfeeWvZY/run-sync?token=" + APIFY_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: [normalizedUsername],
          maxItems: 1
        }),
      }
    );

    if (!apifyResponse.ok) {
      const errorText = await apifyResponse.text();
      console.error("Apify API error:", errorText);
      return new Response(
        JSON.stringify({ error: `Apify API error: ${apifyResponse.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const apifyData = await apifyResponse.json();
    
    if (!apifyData || !apifyData.items || apifyData.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Twitter profile not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Get the first item as our Twitter profile
    const twitterUser = apifyData.items[0];
    
    // Format response data
    const responseData: TwitterProfileResponse = {
      userData: {
        url: twitterUser.url,
        followersCount: twitterUser.followersCount,
        followingCount: twitterUser.followingCount,
        tweetCount: twitterUser.tweetCount,
        verified: twitterUser.verified || false,
        createdAt: twitterUser.createdAt,
        name: twitterUser.name,
        screenName: twitterUser.screenName,
        description: twitterUser.description,
        profileImageUrl: twitterUser.profileImageUrl
      }
    };
    
    // Store in cache
    await supabase.from('twitter_profile_cache').upsert({
      username: normalizedUsername,
      profile_data: responseData,
      fetched_at: new Date().toISOString()
    });
    
    // Return the profile data
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Twitter profile fetch error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch Twitter profile" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
