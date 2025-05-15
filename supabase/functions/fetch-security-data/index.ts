
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache duration in seconds (1 hour)
const CACHE_DURATION = 60 * 60;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { contractAddress } = await req.json();
    
    if (!contractAddress) {
      return new Response(
        JSON.stringify({ error: 'Contract address is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Fetching security data for contract: ${contractAddress}`);

    // Make request to GoPlus API
    const response = await fetch(
      `https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=${contractAddress}`,
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`GoPlus API returned ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`Got response from GoPlus API: ${JSON.stringify(data).slice(0, 100)}...`);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`Error in fetch-security-data:`, error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

