
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

      // Create mock token metrics for testing
      // In a real implementation, we would process all the API responses
      const metrics = {
        name: tokenId,
        symbol: tokenId.toUpperCase(),
        marketCap: "$10M",
        liquidityLock: "365 days",
        topHoldersPercentage: "42%",
        tvl: "$1.2M",
        auditStatus: "Verified",
        socialFollowers: "10K",
        poolAge: "180 days",
        volume24h: "$500K",
        txCount24h: 1200,
        network: "eth",
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
