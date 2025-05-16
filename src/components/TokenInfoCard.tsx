
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Globe, Twitter, Github, Copy, ExternalLink, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenInfo } from "@/hooks/useTokenInfo";

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
  const summarizeDescription = (desc: string) => {
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

  // If no token data
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

  // Format social links
  const website = token.links?.homepage?.[0] || "";
  const twitter = token.links?.twitter_screen_name || "";
  const github = token.links?.github || "";
  const description = token.description || `${token.name} is a cryptocurrency token with symbol ${token.symbol.toUpperCase()}.`;
  const summaryDescription = summarizeDescription(description);

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
                  {token.symbol.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{token.name}</h3>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <span className="font-medium">${token.symbol.toUpperCase()}</span>
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
            </div>
          </div>
          
          {/* Description and Social Links */}
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-sm text-gray-600">
                {showFullDescription ? description : summaryDescription}
              </p>
              
              {description.length > summaryDescription.length && (
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

              {token.current_price && (
                <div className="ml-auto text-right">
                  <div className="text-lg font-semibold">
                    ${token.current_price.toLocaleString()}
                  </div>
                  {token.price_change_percentage_24h && (
                    <div className={`text-sm ${token.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {token.price_change_percentage_24h >= 0 ? '+' : ''}{token.price_change_percentage_24h.toFixed(2)}%
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
