
export interface GoPlusSecurity {
  // Core security indicators
  can_take_back_ownership: number;
  can_mint: number;
  is_anti_whale: number;
  is_blacklisted: number;
  is_honeypot: number;
  is_in_dex: number;
  is_mintable: number;
  is_open_source: number;
  is_proxy: number;
  is_whitelisted: number;
  slippage_modifiable: number;
  trading_cooldown: number;
  transfer_pausable: number;
  
  // Transaction modifiers
  anti_whale_modifiable: number;
  buy_tax: number;
  cannot_buy: number;
  cannot_sell_all: number;
  external_call: number;
  hidden_owner: number;
  owner_change_balance: number;
  personal_slippage_modifiable: number;
  sell_tax: number;
  selfdestruct: number;
  
  // Contract details
  contract_name: string;
  creator_address: string;
  creator_balance: string;
  creator_percent: number;
  holder_count: number;
  lp_holder_count: number;
  owner_address: string;
  owner_balance: string;
  owner_percent: number;
  token_name: string;
  token_symbol: string;
  total_supply: string;
  
  // Risk assessment
  trust_list: number;
  dex: Array<{
    name: string;
    liquidity: string;
    pair: string;
  }>;
}

export interface GoPlusSecurityResponse {
  code: number;
  message: string;
  result: Record<string, GoPlusSecurity>;
}

export interface SecurityRiskSummary {
  ownershipRenounced: boolean;
  canMint: boolean;
  hasBlacklist: boolean;
  slippageModifiable: boolean;
  isHoneypot: boolean;
  ownerCanChangeBalance: boolean;
  isProxy: boolean;
  hasExternalCalls: boolean;
  transferPausable: boolean;
  isSelfdestructable: boolean;
  isOpenSource: boolean;
  buyTax: string;
  sellTax: string;
  highRiskCount: number;
  moderateRiskCount: number;
  riskLevel: 'High' | 'Moderate' | 'Low' | 'Unknown';
}
