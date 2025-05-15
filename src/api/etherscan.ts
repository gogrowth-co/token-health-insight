
import { supabase } from "@/integrations/supabase/client";
import { fetchWithTimeout } from "@/utils/fetchWithTimeout";

// Base URL for Etherscan API
const ETHERSCAN_BASE_URL = "https://api.etherscan.io/api";

/**
 * Get Etherscan API key from Supabase secrets
 */
const getApiKey = async (): Promise<string | null> => {
  try {
    // Create a controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const { data } = await supabase.functions.invoke('get-secret', {
      body: { secretName: 'ETHERSCAN_API_KEY' }
    });
    
    clearTimeout(timeoutId);
    return data?.value || null;
  } catch (error) {
    console.error("Error fetching Etherscan API key:", error);
    return null;
  }
};

/**
 * Handles Etherscan API calls with proper error handling and retries
 */
async function callEtherscanApi(
  params: Record<string, string>,
  retries = 2,
  timeoutMs = 8000
): Promise<any> {
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    console.error("Etherscan API key not available");
    throw new Error("Etherscan API key not configured");
  }
  
  // Construct the full URL with parameters
  const queryParams = new URLSearchParams({
    ...params,
    apikey: apiKey,
  });
  
  const url = `${ETHERSCAN_BASE_URL}?${queryParams.toString()}`;
  
  try {
    const response = await fetchWithTimeout(url, {}, timeoutMs);
    
    // Check Etherscan API response status
    if (response.status === "0" && response.message === "NOTOK") {
      throw new Error(`Etherscan API error: ${response.result}`);
    }
    
    return response.result;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying Etherscan API call, retries left: ${retries - 1}`);
      // Wait for 1s before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      return callEtherscanApi(params, retries - 1, timeoutMs);
    }
    throw error;
  }
}

/**
 * Get token holder list for a contract address
 */
export async function getTokenHolders(contractAddress: string): Promise<any> {
  if (!contractAddress.startsWith("0x")) {
    throw new Error("Invalid contract address format");
  }
  
  return callEtherscanApi({
    module: "token",
    action: "tokenholderlist",
    contractaddress: contractAddress,
    page: "1",
    offset: "20", // Get top 20 holders to ensure we have at least top 10
  });
}

/**
 * Get contract source code and ABI
 */
export async function getContractSourceCode(contractAddress: string): Promise<any> {
  if (!contractAddress.startsWith("0x")) {
    throw new Error("Invalid contract address format");
  }
  
  return callEtherscanApi({
    module: "contract",
    action: "getsourcecode",
    address: contractAddress,
  });
}

/**
 * Get token balance for an address
 */
export async function getTokenBalance(contractAddress: string, address: string): Promise<any> {
  if (!contractAddress.startsWith("0x") || !address.startsWith("0x")) {
    throw new Error("Invalid address format");
  }
  
  return callEtherscanApi({
    module: "account",
    action: "tokenbalance",
    contractaddress: contractAddress,
    address: address,
    tag: "latest",
  });
}

/**
 * Analyze contract source code for security features
 * This function checks for ownership renouncement, mint/burn functions, etc.
 */
export function analyzeContractSecurity(sourceCode: any): {
  ownershipRenounced: boolean;
  canMint: boolean;
  canBurn: boolean;
  hasFreeze: boolean;
  isMultiSig: boolean;
  isProxy: boolean;
} {
  // Default values
  const result = {
    ownershipRenounced: false,
    canMint: false,
    canBurn: false,
    hasFreeze: false,
    isMultiSig: false,
    isProxy: false
  };
  
  if (!sourceCode || !sourceCode[0]?.SourceCode) {
    return result;
  }
  
  const source = sourceCode[0].SourceCode;
  
  // Check if contract is a proxy
  result.isProxy = source.includes("delegatecall") || 
                   source.includes("Proxy") || 
                   source.includes("upgradeable");
  
  // Check for ownership renouncement patterns
  result.ownershipRenounced = 
    source.includes("renounceOwnership") && 
    (source.includes("owner = address(0)") || source.includes("owner = 0x0000000000000000000000000000000000000000"));
  
  // Check for mint function
  result.canMint = source.includes("function mint") || 
                   source.includes("_mint(") || 
                   source.includes("mint(");
  
  // Check for burn function
  result.canBurn = source.includes("function burn") || 
                   source.includes("_burn(") || 
                   source.includes("burn(");
  
  // Check for freeze/blacklist functionality
  result.hasFreeze = source.includes("freeze") || 
                     source.includes("blacklist") || 
                     source.includes("pausable") || 
                     source.includes("function pause");
  
  // Check for multi-sig patterns
  result.isMultiSig = source.includes("multisig") || 
                      source.includes("multi-sig") || 
                      source.includes("required(") || 
                      source.includes("threshold") && source.includes("owners");
  
  return result;
}

/**
 * Calculate the percentage of total supply held by top holders
 */
export function calculateTopHoldersPercentage(holders: any[], totalSupply?: string): string {
  if (!holders || holders.length === 0) {
    return "N/A";
  }
  
  // If we don't have totalSupply, use the sum of all holders as an approximation
  let supply = totalSupply ? BigInt(totalSupply) : BigInt(0);
  
  if (!totalSupply) {
    for (const holder of holders) {
      supply += BigInt(holder.TokenHolderQuantity);
    }
  }
  
  // If supply is still 0, return N/A
  if (supply === BigInt(0)) {
    return "N/A";
  }
  
  // Calculate total for top 10 holders
  const topHolders = holders.slice(0, 10);
  let topHoldersTotal = BigInt(0);
  
  for (const holder of topHolders) {
    topHoldersTotal += BigInt(holder.TokenHolderQuantity);
  }
  
  // Calculate percentage
  const percentage = Number((topHoldersTotal * BigInt(10000)) / supply) / 100;
  return `${percentage.toFixed(2)}%`;
}
