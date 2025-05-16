
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Globe, Twitter, Github, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

interface TokenInfoProps {
  name: string;
  symbol: string;
  address: string;
  description: string;
  logoUrl?: string;
  website?: string;
  twitter?: string;
  github?: string;
}

export const TokenInfoCard = ({
  name,
  symbol,
  address,
  description,
  logoUrl,
  website,
  twitter,
  github
}: TokenInfoProps) => {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Truncate address for display
  const truncateAddress = (addr: string) => {
    return addr.length > 12 ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 6)}` : addr;
  };

  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Token Logo and Basic Info */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 rounded-lg border">
              {logoUrl ? (
                <AvatarImage src={logoUrl} alt={`${name} logo`} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl">
                  {symbol.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{name}</h3>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <span className="font-medium">${symbol.toUpperCase()}</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>{truncateAddress(address)}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => copyToClipboard(address)} 
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
            </div>
          </div>
          
          {/* Description and Social Links */}
          <div className="flex-1 space-y-2">
            <p className="text-sm text-gray-600">{description}</p>
            
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
                        href={`https://github.com/${github}`} 
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
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
