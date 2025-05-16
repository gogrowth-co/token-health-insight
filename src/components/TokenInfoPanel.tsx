
import React from "react";
import { ExternalLink, Info } from "lucide-react";
import { TokenInfoData } from "@/api/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { formatExplorerUrl, formatGithubUrl, formatTwitterUrl, formatUrl, truncateAddress } from "@/utils/linkFormatters";

interface TokenInfoPanelProps {
  tokenInfo: TokenInfoData | null;
  isLoading?: boolean;
}

export const TokenInfoPanel: React.FC<TokenInfoPanelProps> = ({
  tokenInfo,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Token Information</CardTitle>
          <CardDescription>Basic details about this token</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!tokenInfo) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Token Information</CardTitle>
          <CardDescription>Basic details about this token</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">
            <Info className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No token information available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const website = formatUrl(tokenInfo.website);
  const twitterUrl = formatTwitterUrl(tokenInfo.twitterUrl);
  const githubUrl = formatGithubUrl(tokenInfo.githubUrl);
  const explorerUrl = formatExplorerUrl(tokenInfo.contractAddress, tokenInfo.network);
  
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Token Information</CardTitle>
        <CardDescription>Basic details about this token</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Token Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="text-lg font-bold">{tokenInfo.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Symbol</p>
              <p className="text-lg font-bold">{tokenInfo.symbol}</p>
            </div>
          </div>
          
          {/* Token Address */}
          {tokenInfo.contractAddress && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Contract Address</p>
              <div className="flex items-center gap-2">
                <p className="font-mono bg-gray-100 p-2 rounded text-sm overflow-hidden text-ellipsis">
                  {tokenInfo.contractAddress.length > 25 
                    ? truncateAddress(tokenInfo.contractAddress, 8) 
                    : tokenInfo.contractAddress}
                </p>
                {explorerUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(explorerUrl, '_blank')}
                  >
                    <ExternalLink size={14} className="mr-1" />
                    View
                  </Button>
                )}
              </div>
              {tokenInfo.network && (
                <div className="mt-1">
                  <Badge variant="outline" className="text-xs">
                    Network: {tokenInfo.network.toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>
          )}
          
          {/* Description */}
          {tokenInfo.description && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700">
                {tokenInfo.description.length > 300
                  ? `${tokenInfo.description.substring(0, 300)}...`
                  : tokenInfo.description}
              </p>
            </div>
          )}
          
          {/* Links Section */}
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">Resources</p>
            <div className="flex flex-wrap gap-2">
              {website && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open(website, '_blank')}
                >
                  <ExternalLink size={14} className="mr-1" />
                  Website
                </Button>
              )}
              
              {twitterUrl && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open(twitterUrl, '_blank')}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    width="14" 
                    height="14" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="mr-1"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                  Twitter
                </Button>
              )}
              
              {githubUrl && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open(githubUrl, '_blank')}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    width="14" 
                    height="14" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="mr-1"
                  >
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                  GitHub
                </Button>
              )}
              
              {tokenInfo.whitepaper && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open(formatUrl(tokenInfo.whitepaper), '_blank')}
                >
                  <ExternalLink size={14} className="mr-1" />
                  Whitepaper
                </Button>
              )}
            </div>
          </div>
          
          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
            {tokenInfo.tokenType && (
              <div>
                <p className="text-sm font-medium text-gray-500">Token Type</p>
                <p>{tokenInfo.tokenType}</p>
              </div>
            )}
            
            {tokenInfo.launchDate && (
              <div>
                <p className="text-sm font-medium text-gray-500">Launch Date</p>
                <p>{tokenInfo.launchDate}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
