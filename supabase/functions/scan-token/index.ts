
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

// Set up CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? ""
);

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Parse request body
    const { tokenId } = await req.json();
    console.log(`Scanning token: ${tokenId}`);

    if (!tokenId) {
      return new Response(
        JSON.stringify({ error: "Missing tokenId parameter" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check token cache first
    const { data: cachedData } = await supabaseClient
      .from('token_data_cache')
      .select('data')
      .eq('token_id', tokenId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedData) {
      console.log(`Using cached data for token: ${tokenId}`);
      
      // Get authentication info from request to save scan history
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        try {
          // Extract token from Bearer header
          const token = authHeader.replace('Bearer ', '');
          const { data: { user } } = await supabaseClient.auth.getUser(token);
          
          if (user) {
            // Save scan history for authenticated user
            await supabaseClient
              .from('token_scans')
              .insert({
                user_id: user.id,
                token_id: tokenId,
                token_symbol: cachedData.data.symbol,
                token_name: cachedData.data.name,
                health_score: cachedData.data.healthScore,
                category_scores: cachedData.data.categories
              });
          }
        } catch (authError) {
          // Log but don't fail the request if saving history fails
          console.error(`Error saving scan history: ${authError.message}`);
        }
      }
      
      return new Response(JSON.stringify(cachedData.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`No cache found for token: ${tokenId}, fetching fresh data`);

    // Create a controller to manage the overall timeout for the entire operation
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("Overall operation timeout reached, aborting");
      timeoutController.abort();
    }, 25000); // 25 seconds overall timeout

    try {
      // Call other edge functions with concurrent requests
      const securityPromise = supabaseClient.functions.invoke('fetch-security-data', {
        body: { contractAddress: tokenId.includes(':') ? tokenId.split(':')[1] : tokenId },
        abortSignal: timeoutController.signal,
      }).catch(err => {
        console.error(`Security data fetch error: ${err.message}`);
        return { data: null };
      });
      
      const twitterPromise = supabaseClient.functions.invoke('fetch-twitter-profile', {
        body: { tokenId },
        abortSignal: timeoutController.signal,
      }).catch(err => {
        console.error(`Twitter profile fetch error: ${err.message}`);
        return { data: null };
      });

      // Wait for all API calls to complete or timeout
      const [securityResult, twitterResult] = await Promise.allSettled([
        securityPromise,
        twitterPromise
      ]);
      
      // Create real token metrics based on available data
      // We still use mock values for fields we can't easily get
      // but include real data from our API calls
      const metrics = {
        name: tokenId,
        symbol: tokenId.toUpperCase(),
        marketCap: "$10M",  // Mock data
        liquidityLock: "365 days",  // Mock data
        topHoldersPercentage: "42%",  // Mock data
        tvl: "$1.2M",  // Mock data
        auditStatus: securityResult.status === 'fulfilled' && 
          securityResult.value.data?.isOpenSource ? "Verified" : "Unverified",
        socialFollowers: twitterResult.status === 'fulfilled' && 
          twitterResult.value.data?.followersCount ? 
          `${Math.floor(twitterResult.value.data.followersCount / 1000)}K` : "10K",
        poolAge: "180 days",  // Mock data
        volume24h: "$500K",  // Mock data
        txCount24h: 1200,  // Mock data
        network: "eth",  // Default network
        categories: {
          security: { score: 85 },
          liquidity: { score: 75 },
          tokenomics: { score: 80 },
          community: { score: 70 },
          development: { score: 65 }
        },
        healthScore: 78,
        lastUpdated: Date.now(),
        // Add security data if available
        goPlus: securityResult.status === 'fulfilled' && securityResult.value.data ? 
          securityResult.value.data : null,
        // Add twitter data if available
        twitter: twitterResult.status === 'fulfilled' && twitterResult.value.data ?
          twitterResult.value.data : null
      };

      // Cache the result
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour cache
      
      await supabaseClient
        .from('token_data_cache')
        .upsert({
          token_id: tokenId,
          data: metrics,
          expires_at: expiresAt.toISOString(),
          last_updated: new Date().toISOString()
        });
        
      // Get authentication info from request to save scan history
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        try {
          // Extract token from Bearer header
          const token = authHeader.replace('Bearer ', '');
          const { data: { user } } = await supabaseClient.auth.getUser(token);
          
          if (user) {
            // Save scan history for authenticated user
            await supabaseClient
              .from('token_scans')
              .insert({
                user_id: user.id,
                token_id: tokenId,
                token_symbol: metrics.symbol,
                token_name: metrics.name,
                health_score: metrics.healthScore,
                category_scores: metrics.categories
              });
          }
        } catch (authError) {
          // Log but don't fail the request if saving history fails
          console.error(`Error saving scan history: ${authError.message}`);
        }
      }

      return new Response(JSON.stringify(metrics), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error(`Error processing request: ${error.message}`);
    
    return new Response(
      JSON.stringify({ error: "Error processing token scan", message: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
