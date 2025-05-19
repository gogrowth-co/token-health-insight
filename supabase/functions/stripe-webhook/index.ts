
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

// Configure CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Price ID mapping to subscription tiers
const PRICE_TIER_MAP: Record<string, string> = {
  'price_1RQK5tD41aNWIHmd4YspKxDi': 'Pro Monthly',
  'price_1RQK5tD41aNWIHmd1p46UCwl': 'Pro Annual'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get the stripe signature from the request header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No stripe signature found in request headers");
    }
    
    // Get the webhook secret
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }
    
    // Get the raw request body
    const body = await req.text();
    
    logStep("Validating Stripe signature");
    
    // Construct the event
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logStep(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: "Invalid signature" }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    logStep(`Event received: ${event.type}`);
    
    // Initialize Supabase client with service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // Handle specific events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object, supabaseClient, stripe);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object, supabaseClient);
        break;
      default:
        logStep(`Unhandled event type: ${event.type}`);
    }
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep(`ERROR: ${errorMessage}`);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleSubscriptionChange(subscription: any, supabase: any, stripe: any) {
  try {
    const customerId = subscription.customer;
    logStep("Processing subscription change", { 
      subscriptionId: subscription.id, 
      customerId, 
      status: subscription.status 
    });
    
    // Get customer email
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.email) {
      throw new Error("Customer email not found");
    }
    
    // Get the pricing plan
    const priceId = subscription.items.data[0].price.id;
    const subscriptionTier = PRICE_TIER_MAP[priceId] || "Pro";
    const scanLimit = subscriptionTier !== "Free" ? 5 : 3;
    
    // Get subscription end date
    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    
    // Get the user from Supabase
    const { data: userData, error: userError } = await supabase
      .from("subscribers")
      .select("user_id, scan_count")
      .eq("stripe_customer_id", customerId)
      .single();
    
    if (userError && userError.code !== "PGRST116") {
      throw new Error(`Error fetching user: ${userError.message}`);
    }
    
    if (!userData) {
      logStep("No existing user found with this Stripe customer ID");
      
      // Try to find the user by email
      const { data: userByEmail, error: emailError } = await supabase
        .from("subscribers")
        .select("user_id, scan_count")
        .eq("email", customer.email)
        .single();
        
      if (emailError && emailError.code !== "PGRST116") {
        throw new Error(`Error fetching user by email: ${emailError.message}`);
      }
      
      if (userByEmail) {
        // Update existing user
        await supabase
          .from("subscribers")
          .update({
            stripe_customer_id: customerId,
            subscribed: subscription.status === "active",
            subscription_tier: subscriptionTier,
            subscription_end: subscriptionEnd,
            scan_limit: scanLimit,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userByEmail.user_id);
          
        logStep("Updated existing user by email", { userId: userByEmail.user_id });
      } else {
        // We don't have a user record yet, log this for follow-up
        logStep("No user record found for this customer", { email: customer.email });
      }
    } else {
      // Update the subscriber record
      await supabase
        .from("subscribers")
        .update({
          subscribed: subscription.status === "active",
          subscription_tier: subscriptionTier,
          subscription_end: subscriptionEnd,
          scan_limit: scanLimit,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userData.user_id);
        
      logStep("Updated user subscription", { 
        userId: userData.user_id,
        subscriptionTier,
        scanLimit
      });
    }
  } catch (error) {
    logStep(`Error processing subscription: ${error.message}`);
    throw error;
  }
}

async function handleSubscriptionCancellation(subscription: any, supabase: any) {
  try {
    const customerId = subscription.customer;
    logStep("Processing subscription cancellation", { 
      subscriptionId: subscription.id, 
      customerId 
    });
    
    // Get the user from Supabase
    const { data: userData, error: userError } = await supabase
      .from("subscribers")
      .select("user_id, scan_count")
      .eq("stripe_customer_id", customerId)
      .single();
    
    if (userError) {
      throw new Error(`Error fetching user: ${userError.message}`);
    }
    
    if (!userData) {
      logStep("No user found with this Stripe customer ID");
      return;
    }
    
    // Reset to free tier
    await supabase
      .from("subscribers")
      .update({
        subscribed: false,
        subscription_tier: "Free",
        subscription_end: null,
        scan_limit: 3, // Reset to free tier limit
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userData.user_id);
      
    logStep("Downgraded user to free tier", { userId: userData.user_id });
  } catch (error) {
    logStep(`Error processing cancellation: ${error.message}`);
    throw error;
  }
}
