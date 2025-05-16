import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache duration in seconds (1 hour)
const CACHE_DURATION = 60 * 60;

// Create a Supabase client for the function
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    
    // Check cache first
    const cacheKey = `security_${contractAddress.toLowerCase()}`;
    const { data: cachedData } = await supabase
      .from('token_data_cache')
      .select('data')
      .eq('token_id', cacheKey)
      .maybeSingle();
      
    if (cachedData) {
      console.log('Returning cached security data');
      return new Response(
        JSON.stringify(cachedData.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch security data from Etherscan and GoPlus in parallel
    const results = await Promise.allSettled([
      fetchEtherscanData(contractAddress),
      fetchGoPlusData(contractAddress)
    ]);
    
    // Process results from both APIs
    const etherscanResult = results[0].status === 'fulfilled' ? results[0].value : null;
    const goPlusResult = results[1].status === 'fulfilled' ? results[1].value : null;
    
    // Combine data from both sources
    const securityData = processSecurityData(contractAddress, etherscanResult, goPlusResult);
    
    // Cache the result
    await supabase.from('token_data_cache').upsert({
      token_id: cacheKey,
      data: securityData,
      expires_at: new Date(Date.now() + CACHE_DURATION * 1000).toISOString()
    });

    return new Response(
      JSON.stringify(securityData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`Error in fetch-token-security-data:`, error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

/**
 * Fetch contract data from Etherscan API
 */
async function fetchEtherscanData(contractAddress) {
  try {
    const { data: secretData } = await supabase.functions.invoke('get-secret', {
      body: { secretName: 'ETHERSCAN_API_KEY' }
    });
    
    if (!secretData?.value) {
      throw new Error('Etherscan API key not available');
    }
    
    const etherscanApiKey = secretData.value;
    const url = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${etherscanApiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== '1' || !data.result || data.result.length === 0) {
      console.warn('Etherscan API returned no valid data', data);
      return null;
    }
    
    return data.result;
  } catch (error) {
    console.error('Error fetching from Etherscan:', error);
    return null;
  }
}

/**
 * Fetch security data from GoPlus Security API
 */
async function fetchGoPlusData(contractAddress) {
  try {
    const url = `https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=${contractAddress}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code !== 1 || !data.result || !data.result[contractAddress]) {
      console.warn('GoPlus API returned no valid data', data);
      return null;
    }
    
    return data.result[contractAddress];
  } catch (error) {
    console.error('Error fetching from GoPlus:', error);
    return null;
  }
}

/**
 * Process and combine security data from Etherscan and GoPlus
 */
function processSecurityData(contractAddress, etherscanData, goPlusData) {
  // Default values
  let contractVerified = false;
  let ownershipRenounced = false;
  let honeypotRisk = 'Unknown';
  let isMintable = false;
  let canTakeBackOwnership = false;
  let hiddenOwner = false;
  let isBlacklisted = false;
  let slippageModifiable = false;
  let tradingCooldown = false;
  const riskFactors = [];
  
  // For the RiskFactorsList component
  let isHoneypot = false;
  let canMint = false;
  let hasBlacklist = false;
  let ownerCanChangeBalance = false;
  let transferPausable = false;
  let isSelfdestructable = false;
  let isOpenSource = true; // Default to true
  let buyTax = '0%';
  let sellTax = '0%';
  
  // Process Etherscan data if available
  if (etherscanData && etherscanData[0]) {
    contractVerified = etherscanData[0].ABI !== 'Contract source code not verified';
    isOpenSource = contractVerified;
    
    if (etherscanData[0].ContractName) {
      console.log(`Contract name: ${etherscanData[0].ContractName}`);
    }
    
    // Check for renounced ownership
    const ownerAddress = etherscanData[0].ContractCreator || etherscanData[0].Owner;
    if (ownerAddress) {
      ownershipRenounced = 
        ownerAddress === '0x0000000000000000000000000000000000000000' || 
        ownerAddress === '0x000000000000000000000000000000000000dEaD';
    }
  }
  
  // Process GoPlus data if available
  if (goPlusData) {
    // Extract risk factors
    honeypotRisk = goPlusData.is_honeypot === '1' ? 'High' : 'Low';
    isHoneypot = goPlusData.is_honeypot === '1';
    isMintable = goPlusData.is_mintable === '1';
    canMint = goPlusData.can_mint === '1';
    canTakeBackOwnership = goPlusData.can_take_back_ownership === '1';
    hiddenOwner = goPlusData.hidden_owner === '1';
    isBlacklisted = goPlusData.is_blacklisted === '1';
    hasBlacklist = isBlacklisted;
    slippageModifiable = goPlusData.slippage_modifiable === '1';
    tradingCooldown = goPlusData.trading_cooldown === '1';
    ownerCanChangeBalance = goPlusData.owner_change_balance === '1';
    transferPausable = goPlusData.transfer_pausable === '1';
    isSelfdestructable = goPlusData.selfdestruct === '1';
    
    // Get tax information
    if (goPlusData.buy_tax) {
      buyTax = `${goPlusData.buy_tax}%`;
    }
    if (goPlusData.sell_tax) {
      sellTax = `${goPlusData.sell_tax}%`;
    }
    
    if (!contractVerified) {
      isOpenSource = goPlusData.is_open_source === '1';
    }
  }
  
  // Build the risk factors list
  if (!ownershipRenounced) {
    riskFactors.push("Ownership not renounced");
  }
  if (honeypotRisk === 'High') {
    riskFactors.push("Honeypot risk detected");
  }
  if (isMintable) {
    riskFactors.push("Token is mintable");
  }
  if (isBlacklisted) {
    riskFactors.push("Blacklist function detected");
  }
  if (canTakeBackOwnership) {
    riskFactors.push("Ownership recovery enabled");
  }
  if (slippageModifiable) {
    riskFactors.push("Slippage can be changed");
  }
  if (tradingCooldown) {
    riskFactors.push("Trading cooldown active");
  }
  if (hiddenOwner) {
    riskFactors.push("Hidden owner detected");
  }
  
  return {
    contractAddress,
    contractVerified,
    ownershipRenounced,
    honeypotRisk,
    isMintable,
    isBlacklisted,
    canTakeBackOwnership,
    hiddenOwner,
    slippageModifiable,
    tradingCooldown,
    // Add the fields expected by RiskFactorsList
    isHoneypot,
    canMint, 
    hasBlacklist,
    ownerCanChangeBalance,
    transferPausable,
    isSelfdestructable,
    isOpenSource,
    buyTax,
    sellTax,
    riskFactors,
    scannedAt: new Date().toISOString(),
    dataSource: {
      etherscan: !!etherscanData,
      goPlus: !!goPlusData
    }
  };
}
