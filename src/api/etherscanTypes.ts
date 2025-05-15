
export interface EtherscanTokenHolder {
  TokenHolderAddress: string;
  TokenHolderQuantity: string;
  Percentage?: string;
  TokenName?: string;
  TokenSymbol?: string;
}

export interface EtherscanContractSource {
  ABI: string;
  ContractName: string;
  CompilerVersion: string;
  OptimizationUsed: string;
  Runs: string;
  ConstructorArguments: string;
  EVMVersion: string;
  Library: string;
  LicenseType: string;
  Proxy: string;
  Implementation: string;
  SwarmSource: string;
  SourceCode: string;
}

export interface EtherscanSecurityAnalysis {
  ownershipRenounced: boolean;
  canMint: boolean;
  canBurn: boolean;
  hasFreeze: boolean;
  isMultiSig: boolean;
  isProxy: boolean;
}

export interface EtherscanTokenData {
  holders?: EtherscanTokenHolder[];
  topHoldersPercentage?: string;
  contractSource?: EtherscanContractSource[];
  securityAnalysis?: EtherscanSecurityAnalysis;
  contractAddress?: string;
}
