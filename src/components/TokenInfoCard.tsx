
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Globe, Twitter, Github, Copy, ExternalLink, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenInfo } from "@/hooks/useTokenInfo";
import { formatCurrency, formatPercentage, formatDate, withFallback } from "@/lib/utils";

interface TokenInfoCardProps {
  token?: TokenInfo;
  isLoading: boolean;
  error?: Error | null;
}

export const TokenInfoCard = ({
  token,
  isLoading,
  error
}: TokenInfoCardProps) => {
  const [copied, setCopied] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
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
  if (error) {
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

  // If loading, display skeleton
  if (isLoading) {
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

  // If no token data, show appropriate message
  if (!token) {
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

  // Format social links with fallbacks
  const website = token.links?.homepage?.[0] || "";
  const twitter = token.links?.twitter_screen_name || "";
  const github = token.links?.github || "";
  
  // Ensure we have a description
  const description = withFallback(token.description, `${token.name || 'This token'} is a cryptocurrency token${token.symbol ? ` with symbol ${token.symbol?.toUpperCase() || ''}` : ''}.`);
  
  const summaryDescription = summarizeDescription(description);
  
  // Get launch date with fallback
  const launchDate = token.genesis_date || token.ath_date;

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

  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Token Logo and Basic Info */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 rounded-lg border">
              {token.image ? (
                <AvatarImage src={token.image} alt={`${token.name} logo`} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl">
                  {token.symbol?.substring(0, 2).toUpperCase() || '--'}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{token.name || 'Unknown Token'}</h3>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <span className="font-medium">${token.symbol?.toUpperCase() || '--'}</span>
                {token.market_cap_rank && (
                  <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                    Rank #{token.market_cap_rank}
                  </span>
                )}
              </div>
              
              {token.contract_address && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span>{truncateAddress(token.contract_address)}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          onClick={() => copyToClipboard(token.contract_address || '')} 
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
                        href={website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-500 hover:text-indigo-600"
                      >
                        <Globe size={18} />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="flex items-center gap-1">
                        Website <ExternalLink size={14} />
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
                        Twitter/X <ExternalLink size={14} />
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
                  {formatTokenPrice(token.current_price)}
                </div>
                {token.price_change_percentage_24h !== undefined ? (
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
