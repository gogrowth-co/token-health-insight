
import React from "react";
import { ExternalLink, Github, Twitter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenInfo } from "@/hooks/useTokenInfo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TokenMetrics } from "@/hooks/useTokenMetrics";

interface TokenMetadataUI {
  id: string;
  name?: string;
  symbol?: string;
  logo?: string;
  blockchain?: string;
  twitter?: string;
  github?: string;
  contract_address?: string;
}

interface TokenInfoCardProps {
  token: TokenInfo | null;
  tokenMetrics?: TokenMetrics;
  isLoading?: boolean;
  error?: Error | null;
  tokenMetadata?: TokenMetadataUI;
}

export const TokenInfoCard = ({ 
  token, 
  tokenMetrics,
  isLoading = false, 
  error = null,
  tokenMetadata
}: TokenInfoCardProps) => {
  // Use metadata from props or fall back to token data
  const tokenName = tokenMetadata?.name || token?.name || "Unknown Token";
  const tokenSymbol = tokenMetadata?.symbol || token?.symbol?.toUpperCase() || "???";
  const tokenLogo = tokenMetadata?.logo || token?.image || "/placeholder.svg";
  const contractAddress = tokenMetadata?.contract_address || token?.contract_address || "";
  const blockchain = tokenMetadata?.blockchain || token?.blockchain || "eth";
  const twitterHandle = tokenMetadata?.twitter || token?.twitter || token?.links?.twitter_screen_name || "";
  const githubRepo = tokenMetadata?.github || token?.links?.github || "";
  
  // Calculate price change colors and arrows
  const priceChangePercent = token?.price_change_percentage_24h;
  const isPriceUp = priceChangePercent && priceChangePercent > 0;
  const priceChangeColor = isPriceUp ? "text-green-500" : "text-red-500";
  const priceChangeArrow = isPriceUp ? "↑" : "↓";

  // Market Cap and TVL from token metrics
  const marketCap = tokenMetrics?.marketCap || "N/A";
  const marketCapChange = tokenMetrics?.marketCapChange24h;
  const isMarketCapUp = marketCapChange && marketCapChange > 0;
  const marketCapChangeColor = isMarketCapUp ? "text-green-500" : "text-red-500";
  const marketCapChangeArrow = isMarketCapUp ? "↑" : "↓";

  const tvl = tokenMetrics?.tvl || "N/A";
  const tvlChange = tokenMetrics?.tvlChange24h;
  const isTvlUp = tvlChange && tvlChange > 0;
  const tvlChangeColor = isTvlUp ? "text-green-500" : "text-red-500";
  const tvlChangeArrow = isTvlUp ? "↑" : "↓";

  // Handle blockchain display
  const getBlockchainDisplay = () => {
    const chain = blockchain.toLowerCase();
    if (chain === "eth" || chain === "ethereum") return "Ethereum";
    if (chain === "bsc") return "BSC";
    if (chain === "polygon") return "Polygon";
    if (chain === "avalanche") return "Avalanche";
    if (chain === "fantom") return "Fantom";
    if (chain === "arbitrum") return "Arbitrum";
    if (chain === "optimism") return "Optimism";
    return blockchain;
  };

  // Format contract address for display
  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Get blockchain explorer URL
  const getExplorerUrl = () => {
    const chain = blockchain.toLowerCase();
    if (!contractAddress) return "#";
    
    if (chain === "eth" || chain === "ethereum") {
      return `https://etherscan.io/token/${contractAddress}`;
    } else if (chain === "bsc") {
      return `https://bscscan.com/token/${contractAddress}`;
    } else if (chain === "polygon") {
      return `https://polygonscan.com/token/${contractAddress}`;
    } else if (chain === "avalanche") {
      return `https://snowtrace.io/token/${contractAddress}`;
    } else if (chain === "fantom") {
      return `https://ftmscan.com/token/${contractAddress}`;
    } else if (chain === "arbitrum") {
      return `https://arbiscan.io/token/${contractAddress}`;
    } else if (chain === "optimism") {
      return `https://optimistic.etherscan.io/token/${contractAddress}`;
    }
    
    return `https://etherscan.io/token/${contractAddress}`;
  };

  // If loading, show skeleton
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mt-4">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row">
          {/* Token Logo and Basic Info */}
          <div className="flex items-center flex-grow">
            <div className="flex-shrink-0 mr-4">
              <img 
                src={tokenLogo} 
                alt={`${tokenName} logo`} 
                className="w-16 h-16 rounded-full" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold">{tokenName}</h2>
                <Badge variant="outline" className="text-sm font-medium">
                  ${tokenSymbol}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {getBlockchainDisplay()}
                </Badge>
              </div>
              
              {/* Price Display */}
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  ${token?.current_price?.toFixed(2) || "0.00"}
                </span>
                {priceChangePercent !== undefined && (
                  <span className={`text-sm font-medium ${priceChangeColor}`}>
                    {priceChangeArrow} {Math.abs(priceChangePercent).toFixed(2)}%
                  </span>
                )}
              </div>
              
              {/* Market Cap and TVL Row */}
              <div className="flex flex-wrap gap-6 mt-2">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Market Cap</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{marketCap}</span>
                    {marketCapChange !== undefined && (
                      <span className={`text-xs ${marketCapChangeColor}`}>
                        {marketCapChangeArrow} {Math.abs(marketCapChange).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">TVL</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{tvl}</span>
                    {tvlChange !== undefined && (
                      <span className={`text-xs ${tvlChangeColor}`}>
                        {tvlChangeArrow} {Math.abs(tvlChange).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Links and Contract */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 mt-4 md:mt-0 md:ml-4 lg:ml-8 md:items-end">
            {/* Social and External Links */}
            <div className="flex gap-2">
              {twitterHandle && (
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={`https://twitter.com/${twitterHandle}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <Twitter size={16} />
                    <span className="hidden sm:inline">Twitter</span>
                  </a>
                </Button>
              )}
              
              {githubRepo && (
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={`https://github.com/${githubRepo}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <Github size={16} />
                    <span className="hidden sm:inline">GitHub</span>
                  </a>
                </Button>
              )}
              
              {contractAddress && (
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={getExplorerUrl()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink size={16} />
                    <span className="hidden sm:inline">View Contract</span>
                  </a>
                </Button>
              )}
            </div>
            
            {/* Contract Address */}
            {contractAddress && (
              <div className="text-sm text-gray-500 flex items-center">
                <span className="mr-1">Contract:</span>
                <a 
                  href={getExplorerUrl()} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {formatAddress(contractAddress)}
                </a>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
