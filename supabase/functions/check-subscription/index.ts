import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use the service role key to perform writes (upsert) in Supabase
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      
      // Check if we need to create or update user record
      const { data: existingUser } = await supabaseClient
        .from("subscribers")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();
      
      // If no record exists, create one with free tier defaults
      if (!existingUser) {
        await supabaseClient.from("subscribers").insert({
          email: user.email,
          user_id: user.id,
          stripe_customer_id: null,
          subscribed: false,
          subscription_tier: "Free",
          scan_limit: 3,
          scan_count: 0,
          updated_at: new Date().toISOString(),
        });
      }
      
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: "Free",
        scan_limit: 3,
        scan_count: existingUser?.scan_count || 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = "Free";
    let subscriptionEnd = null;
    let scanLimit = 3; // Default for free tier

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      // Determine subscription tier from price
      const priceId = subscription.items.data[0].price.id;
      
      // Get scan count and reset date
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Check if we need to reset the scan count (new day)
      const { data: existingUser } = await supabaseClient
        .from("subscribers")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();
        
      let scanCount = 0;
      let scanResetDate = today.toISOString();
      
      if (existingUser) {
        // If we have an existing record, check if we need to reset the scan count
        if (existingUser.scan_reset_date) {
          const resetDate = new Date(existingUser.scan_reset_date);
          if (resetDate.getDate() === today.getDate() && 
              resetDate.getMonth() === today.getMonth() && 
              resetDate.getFullYear() === today.getFullYear()) {
            // Same day, keep the existing scan count
            scanCount = existingUser.scan_count || 0;
            scanResetDate = existingUser.scan_reset_date;
          }
        }
      }
      
      // Set tier specific limits
      if (priceId.includes("monthly")) {
        subscriptionTier = "Pro Monthly";
        scanLimit = 5; // 5 pro scans per day
      } else if (priceId.includes("annual")) {
        subscriptionTier = "Pro Annual";
        scanLimit = 5; // Same limit for annual
      }
      
      logStep("Determined subscription tier", { priceId, subscriptionTier, scanLimit });
    } else {
      logStep("No active subscription found");
      // Handle free tier user - get existing scan count if available
      const { data: existingUser } = await supabaseClient
        .from("subscribers")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();
        
      if (existingUser) {
        scanLimit = existingUser.scan_limit || 3;
      }
    }

    // Get or update scan count for today
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    const { data: existingRecord } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();
    
    let scanCount = 0;
    if (existingRecord) {
      // Check if we need to reset the scan counter (new day)
      if (existingRecord.scan_reset_date) {
        const resetDate = new Date(existingRecord.scan_reset_date);
        const todayDate = new Date(today);
        
        if (resetDate.getDate() !== todayDate.getDate() || 
            resetDate.getMonth() !== todayDate.getMonth() || 
            resetDate.getFullYear() !== todayDate.getFullYear()) {
          // New day, reset scan count
          scanCount = 0;
        } else {
          // Same day, keep the existing count
          scanCount = existingRecord.scan_count || 0;
        }
      }
    }
    
    // Update the subscriber record
    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      scan_count: scanCount,
      scan_limit: scanLimit,
      scan_reset_date: today,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Updated database with subscription info", { 
      subscribed: hasActiveSub, 
      subscriptionTier, 
      scanCount,
      scanLimit
    });
    
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      scan_count: scanCount,
      scan_limit: scanLimit
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
