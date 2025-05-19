
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Globe, Twitter, Github, Copy, ExternalLink, Info, ChevronDown, ChevronUp, Link2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenInfo } from "@/hooks/useTokenInfo";
import { formatCurrency, formatPercentage, formatDate, withFallback } from "@/lib/utils";

interface TokenMetadata {
  id: string;
  name?: string;
  symbol?: string;
  logo?: string;
  marketCap?: string;
  price?: string;
  contract_address?: string; // Add contract address to metadata
}

interface TokenInfoCardProps {
  token?: TokenInfo;
  isLoading: boolean;
  error?: Error | null;
  tokenMetadata?: TokenMetadata;
}

export const TokenInfoCard = ({
  token,
  isLoading,
  error,
  tokenMetadata
}: TokenInfoCardProps) => {
  const [copied, setCopied] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // Debug logging for token data
  useEffect(() => {
    console.log("[TokenInfoCard] Rendering with metadata:", tokenMetadata);
    console.log("[TokenInfoCard] Token API data:", token);
    
    // Log specific fields we're interested in
    if (token) {
      console.log("[TokenInfoCard] Contract address:", token.contract_address);
      console.log("[TokenInfoCard] Social links:", token.links);
      if (token.platforms) {
        console.log("[TokenInfoCard] Platforms:", token.platforms);
      }
    }
  }, [tokenMetadata, token]);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Truncate address for display
  const truncateAddress = (addr: string) => {
    return addr?.length > 12 ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 6)}` : addr;
  };

  // Truncate description to approximately 300 words
  const summarizeDescription = (desc: string = '') => {
    if (!desc) return '';
    
    const words = desc.split(/\s+/);
    if (words.length <= 300) return desc;
    
    return words.slice(0, 300).join(' ') + '...';
  };

  // If there's an error, display error card
  if (error && !tokenMetadata?.name) {
    return (
      <Card className="border-none shadow-sm bg-white overflow-hidden mb-6">
        <CardContent className="p-6">
          <div className="flex flex-row items-center gap-3 text-red-600">
            <Info size={20} />
            <p>Could not load token information. Please check if the token symbol is correct.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If loading and no metadata, display skeleton
  if (isLoading && !tokenMetadata?.name) {
    return (
      <Card className="border-none shadow-sm bg-white overflow-hidden mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center gap-3 pt-1">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no token data and no metadata, show appropriate message
  if (!token && !tokenMetadata?.name) {
    return (
      <Card className="border-none shadow-sm bg-white overflow-hidden mb-6">
        <CardContent className="p-6">
          <div className="flex flex-row items-center gap-3 text-gray-500">
            <Info size={20} />
            <p>No token information available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Merge token data with metadata, preferring metadata when available
  const displayName = tokenMetadata?.name || token?.name || "Unknown Token";
  const displaySymbol = tokenMetadata?.symbol || token?.symbol?.toUpperCase() || "--";
  const displayImage = tokenMetadata?.logo || token?.image;
  
  // Try to parse numerical values if they were passed as strings
  const displayPrice = tokenMetadata?.price ? Number(tokenMetadata.price) : token?.current_price;
  const displayMarketCap = tokenMetadata?.marketCap ? Number(tokenMetadata.marketCap) : token?.market_cap;

  // Get contract address with fallbacks - prioritize metadata from search result
  const contractAddress = tokenMetadata?.contract_address || token?.contract_address || "";

  // Format social links with fallbacks
  const website = token?.links?.homepage?.[0] || "";
  const twitter = token?.links?.twitter_screen_name || "";
  const github = token?.links?.github || "";
  
  // Ensure we have a description
  const description = withFallback(token?.description, `${displayName || 'This token'} is a cryptocurrency token${displaySymbol ? ` with symbol ${displaySymbol || ''}` : ''}.`);
  
  const summaryDescription = summarizeDescription(description);
  
  // Get launch date with fallback
  const launchDate = token?.genesis_date || token?.ath_date;

  // Format price according to its scale
  const formatTokenPrice = (price?: number) => {
    if (price === undefined || price === null) return "N/A";
    
    if (price === 0) return "$0.00";
    
    // For very small values
    if (price < 0.00001) {
      return `$${price.toExponential(2)}`;
    }
    
    // For small values
    if (price < 0.01) {
      return `$${price.toFixed(6)}`;
    }
    
    // For regular values
    return formatCurrency(price, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  // Determine blockchain from contract address or platforms data
  const getBlockchainFromAddress = (): string => {
    if (!token) return "";
    
    // Check if we have platforms data
    if (token.platforms && Object.keys(token.platforms).length > 0) {
      console.log("Found platforms data:", token.platforms);
      
      // Prioritize Ethereum address if available
      if (token.platforms.ethereum && token.platforms.ethereum === contractAddress) {
        return "ETH";
      }
      
      // Check other common platforms
      if (token.platforms.binance_smart_chain && token.platforms.binance_smart_chain === contractAddress) {
        return "BSC";
      }
      
      if (token.platforms.polygon_pos && token.platforms.polygon_pos === contractAddress) {
        return "MATIC";
      }
      
      if (token.platforms.solana && token.platforms.solana === contractAddress) {
        return "SOL";
      }
      
      // Default to first platform in the list
      const firstPlatform = Object.keys(token.platforms)[0];
      return firstPlatform.slice(0, 3).toUpperCase();
    }
    
    // Default to Ethereum if we can't determine
    return "ETH";
  };

  const blockchainLabel = getBlockchainFromAddress();

  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Token Logo and Basic Info */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 rounded-lg border">
              {displayImage ? (
                <AvatarImage src={displayImage} alt={`${displayName} logo`} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl">
                  {displaySymbol?.substring(0, 2).toUpperCase() || '--'}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{displayName}</h3>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <span className="font-medium">${displaySymbol}</span>
                {token?.market_cap_rank && (
                  <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                    Rank #{token.market_cap_rank}
                  </span>
                )}
              </div>
              
              {contractAddress && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  {blockchainLabel && (
                    <Badge variant="outline" className="h-5 px-1 text-xs font-normal">
                      {blockchainLabel}
                    </Badge>
                  )}
                  <span>{truncateAddress(contractAddress)}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          onClick={() => copyToClipboard(contractAddress)} 
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {copied ? "Copied!" : "Copy address"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  {/* Link to blockchain explorer if we have a contract address */}
                  {contractAddress && blockchainLabel === "ETH" && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={`https://etherscan.io/token/${contractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Link2 size={14} />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="flex items-center gap-1">
                            View on Etherscan <ExternalLink size={14} />
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}
              
              {/* Display launch date if available */}
              {launchDate && (
                <div className="text-xs text-gray-500">
                  Launch: {formatDate(launchDate)}
                </div>
              )}
            </div>
          </div>
          
          {/* Description and Social Links */}
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-sm text-gray-600">
                {showFullDescription ? description : summaryDescription}
              </p>
              
              {description && summaryDescription !== description && description.length > summaryDescription.length && (
                <button 
                  onClick={() => setShowFullDescription(!showFullDescription)} 
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center mt-1"
                >
                  {showFullDescription ? (
                    <>Show less <ChevronUp size={14} className="ml-1" /></>
                  ) : (
                    <>Read more <ChevronDown size={14} className="ml-1" /></>
                  )}
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3 pt-1">
              {website && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a 
                        href={website.startsWith('http') ? website : `https://${website}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-500 hover:text-indigo-600"
                      >
                        <Globe size={18} />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="flex items-center gap-1">
                        {website} <ExternalLink size={14} />
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {twitter && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a 
                        href={`https://twitter.com/${twitter}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-500 hover:text-indigo-600"
                      >
                        <Twitter size={18} />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="flex items-center gap-1">
                        @{twitter} <ExternalLink size={14} />
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {github && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a 
                        href={github.startsWith('http') ? github : `https://github.com/${github}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-500 hover:text-indigo-600"
                      >
                        <Github size={18} />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="flex items-center gap-1">
                        GitHub <ExternalLink size={14} />
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Price information (right aligned) */}
              <div className="ml-auto text-right">
                <div className="text-lg font-semibold">
                  {formatTokenPrice(displayPrice)}
                </div>
                {token?.price_change_percentage_24h !== undefined ? (
                  <div className={`text-sm ${token.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(token.price_change_percentage_24h)}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">N/A</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
