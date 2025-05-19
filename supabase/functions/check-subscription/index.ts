
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

// Price ID mapping to subscription tiers
const PRICE_TIER_MAP: Record<string, string> = {
  'price_1RQK5tD41aNWIHmd4YspKxDi': 'Pro Monthly',
  'price_1RQK5tD41aNWIHmd1p46UCwl': 'Pro Annual'
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Create a Supabase client with service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

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

    // Check for existing subscriber record
    const { data: existingSubscriber } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Initialize with default values
    let scanCount = 0;
    let scanLimit = 3; // Default free tier limit
    
    // If subscriber record exists, get current scan count
    if (existingSubscriber) {
      scanCount = existingSubscriber.scan_count || 0;
      
      // Check if we need to reset the daily scan count (at midnight UTC)
      const today = new Date();
      const resetDate = existingSubscriber.scan_reset_date ? new Date(existingSubscriber.scan_reset_date) : null;
      
      if (!resetDate || today.getDate() !== resetDate.getDate() || 
          today.getMonth() !== resetDate.getMonth() || 
          today.getFullYear() !== resetDate.getFullYear()) {
        // Reset scan count at midnight
        scanCount = 0;
        logStep("Resetting daily scan count", { userId: user.id });
      }
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      // Upsert the subscriber record with free tier defaults
      await supabaseClient
        .from("subscribers")
        .upsert({
          email: user.email,
          user_id: user.id,
          stripe_customer_id: null,
          subscribed: false,
          subscription_tier: "Free",
          subscription_end: null,
          scan_count: scanCount,
          scan_limit: 3, // Free tier limit
          scan_reset_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      return new Response(JSON.stringify({
        subscribed: false,
        subscription_tier: "Free",
        subscription_end: null,
        scan_count: scanCount,
        scan_limit: 3,
        canScan: scanCount < 3
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
      expand: ["data.items.data.price"],
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = "Free";
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      // Get the price ID from the subscription
      const priceId = subscription.items.data[0].price.id;
      
      // Map the price ID to a subscription tier
      subscriptionTier = PRICE_TIER_MAP[priceId] || "Pro";
      
      // Update scan limit based on subscription tier
      scanLimit = subscriptionTier !== "Free" ? 5 : 3; // 5 for Pro plans, 3 for Free
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        priceId: priceId,
        tier: subscriptionTier,
        scanLimit,
        endDate: subscriptionEnd 
      });
    } else {
      // No active subscription, default to Free tier
      subscriptionTier = "Free";
      scanLimit = 3;
      logStep("No active subscription found, using Free tier settings");
    }

    // Upsert the subscriber record
    await supabaseClient
      .from("subscribers")
      .upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: customerId,
        subscribed: hasActiveSub,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
        scan_count: scanCount,
        scan_limit: scanLimit,
        scan_reset_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

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
      scan_limit: scanLimit,
      canScan: scanCount < scanLimit
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
