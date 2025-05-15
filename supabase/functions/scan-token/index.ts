
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Base URL for CoinGecko API
const BASE_URL = "https://api.coingecko.com/api/v3";

// API parameter with API key if provided
const getApiParams = (): string => {
  const apiKey = Deno.env.get("COINGECKO_API_KEY");
  return apiKey ? `&x_cg_demo_api_key=${apiKey}` : "";
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get token ID from request
    const { tokenId } = await req.json();
    
    if (!tokenId) {
      return new Response(
        JSON.stringify({ error: 'Token ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch token details
    const tokenDetailsResponse = await fetch(
      `${BASE_URL}/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true${getApiParams()}`
    );
    
    if (!tokenDetailsResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Error fetching token details: ${tokenDetailsResponse.status}` }),
        { status: tokenDetailsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const tokenDetails = await tokenDetailsResponse.json();
    
    // Fetch market chart data
    const marketChartResponse = await fetch(
      `${BASE_URL}/coins/${tokenId}/market_chart?vs_currency=usd&days=30${getApiParams()}`
    );
    
    let marketChart = null;
    if (marketChartResponse.ok) {
      marketChart = await marketChartResponse.json();
    }
    
    // Calculate health metrics
    const metrics = calculateHealthMetrics(tokenDetails, marketChart);
    
    return new Response(
      JSON.stringify(metrics),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scan-token function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Similar calculation functions as in the client-side tokenScanner.ts
// Simplified for the edge function demonstration
function calculateHealthMetrics(tokenDetails: any, marketChart: any): any {
  // Calculate category scores (simplified for demonstration)
  const securityScore = 72;
  const liquidityScore = 80;
  const tokenomicsScore = 65;
  const communityScore = 85;
  const developmentScore = 70;
  
  // Calculate overall health score
  const healthScore = Math.round(
    (securityScore * 0.25) + 
    (liquidityScore * 0.25) + 
    (tokenomicsScore * 0.2) + 
    (communityScore * 0.15) + 
    (developmentScore * 0.15)
  );
  
  // Format market cap
  const marketCap = formatCurrency(tokenDetails.market_data?.market_cap?.usd || 0);
  
  return {
    name: tokenDetails.name,
    symbol: tokenDetails.symbol.toUpperCase(),
    marketCap,
    liquidityLock: "365 days", // Placeholder
    topHoldersPercentage: "42%", // Placeholder
    tvl: "$1.2M", // Placeholder
    auditStatus: "Verified", // Placeholder
    socialFollowers: formatNumber(tokenDetails.community_data?.twitter_followers || 0),
    categories: {
      security: { score: securityScore },
      liquidity: { score: liquidityScore },
      tokenomics: { score: tokenomicsScore },
      community: { score: communityScore },
      development: { score: developmentScore }
    },
    healthScore
  };
}

function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  } else {
    return value.toString();
  }
}
