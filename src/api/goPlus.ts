
import { GoPlusSecurityResponse, SecurityRiskSummary } from "./goPlusTypes";
import { supabase } from "@/integrations/supabase/client";
import { fetchJsonWithTimeout } from "@/utils/fetchWithTimeout";

/**
 * Check if a token is supported by GoPlus Security API
 * @param contractAddress The contract address to check
 * @returns Boolean indicating if token is supported
 */
export async function isTokenSupported(contractAddress: string): Promise<boolean> {
  try {
    const data = await fetchJsonWithTimeout<any>(
      `https://api.gopluslabs.io/api/v1/supported_chains`,
      {},
      5000 // 5 second timeout
    );
    return data.chains?.includes("1"); // Ethereum chain ID is 1
  } catch (error) {
    console.error("Error checking GoPlus token support:", error);
    return false;
  }
}

/**
 * Get security analysis for a token from GoPlus API directly
 * @param contractAddress The contract address to analyze
 * @returns Security analysis data or null if unavailable
 */
export async function getSecurityData(contractAddress: string): Promise<SecurityRiskSummary | null> {
  try {
    if (!contractAddress) {
      console.warn("No contract address provided for GoPlus security check");
      return null;
    }
    
    // Call our edge function to fetch GoPlus security data with a timeout
    const { data, error } = await supabase.functions.invoke('fetch-security-data', {
      body: { contractAddress },
      abortSignal: AbortSignal.timeout(12000) // 12 second timeout
    });
    
    if (error) {
      throw new Error(`Edge function error: ${error.message}`);
    }
    
    if (data) {
      return processSecurityData(data as GoPlusSecurityResponse);
    }
    
    return null;
    
  } catch (error) {
    console.error("Error fetching GoPlus security data:", error);
    return null;
  }
}

/**
 * Process raw GoPlus security data into a simplified risk summary
 */
export function processSecurityData(data: GoPlusSecurityResponse): SecurityRiskSummary | null {
  try {
    // Get the first (and usually only) contract from the result
    const contractAddress = Object.keys(data.result)[0];
    
    if (!contractAddress || !data.result[contractAddress]) {
      return null;
    }
    
    const security = data.result[contractAddress];
    
    // Count high and moderate risk factors
    let highRiskCount = 0;
    let moderateRiskCount = 0;
    
    // Check high risk factors
    if (security.is_honeypot === 1) highRiskCount++;
    if (security.can_take_back_ownership === 1) highRiskCount++;
    if (security.owner_change_balance === 1) highRiskCount++;
    if (security.selfdestruct === 1) highRiskCount++;
    if (security.cannot_sell_all === 1) highRiskCount++;
    
    // Check moderate risk factors
    if (security.can_mint === 1) moderateRiskCount++;
    if (security.is_blacklisted === 1) moderateRiskCount++;
    if (security.slippage_modifiable === 1) moderateRiskCount++;
    if (security.is_proxy === 1) moderateRiskCount++;
    if (security.transfer_pausable === 1) moderateRiskCount++;
    if (security.external_call === 1) moderateRiskCount++;
    
    // Calculate risk level
    let riskLevel: 'High' | 'Moderate' | 'Low' | 'Unknown' = 'Unknown';
    
    if (highRiskCount > 0) {
      riskLevel = 'High';
    } else if (moderateRiskCount > 1) {
      riskLevel = 'Moderate';
    } else if (moderateRiskCount === 1) {
      riskLevel = 'Low';
    } else if (security.is_open_source === 1) {
      riskLevel = 'Low';
    }
    
    // Format tax values
    const buyTax = security.buy_tax ? `${security.buy_tax}%` : '0%';
    const sellTax = security.sell_tax ? `${security.sell_tax}%` : '0%';
    
    return {
      ownershipRenounced: security.can_take_back_ownership !== 1,
      canMint: security.can_mint === 1,
      hasBlacklist: security.is_blacklisted === 1,
      slippageModifiable: security.slippage_modifiable === 1,
      isHoneypot: security.is_honeypot === 1,
      ownerCanChangeBalance: security.owner_change_balance === 1,
      isProxy: security.is_proxy === 1,
      hasExternalCalls: security.external_call === 1,
      transferPausable: security.transfer_pausable === 1,
      isSelfdestructable: security.selfdestruct === 1,
      isOpenSource: security.is_open_source === 1,
      buyTax,
      sellTax,
      highRiskCount,
      moderateRiskCount,
      riskLevel
    };
  } catch (error) {
    console.error("Error processing GoPlus security data:", error);
    return null;
  }
}
