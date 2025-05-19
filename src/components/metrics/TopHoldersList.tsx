
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Info, Database, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface TopHolderEntry {
  address: string;
  percentage: number;
  value?: string;
}

interface TopHoldersListProps {
  holders: TopHolderEntry[];
  totalPercentage: string;
  fromCache?: boolean;
  isLoading?: boolean;
  contractAddress?: string;
  blockchain?: string;
}

export const TopHoldersList = ({
  holders,
  totalPercentage,
  fromCache = false,
  isLoading = false,
  contractAddress,
  blockchain
}: TopHoldersListProps) => {
  const [showAll, setShowAll] = useState(false);
  
  if (isLoading) {
    return (
      <div className="mt-4 space-y-2">
        <div className="h-4 w-1/4 animate-pulse rounded bg-muted"></div>
        <div className="h-10 w-full animate-pulse rounded bg-muted"></div>
        <div className="h-10 w-full animate-pulse rounded bg-muted"></div>
        <div className="h-10 w-full animate-pulse rounded bg-muted"></div>
      </div>
    );
  }

  if (!holders || holders.length === 0) {
    return (
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">No holder data available</p>
      </div>
    );
  }

  // Get explorer URL based on blockchain
  const getExplorerUrl = (address: string) => {
    if (!address) return "#";
    
    switch(blockchain?.toLowerCase()) {
      case 'eth':
        return `https://etherscan.io/address/${address}`;
      case 'bsc':
        return `https://bscscan.com/address/${address}`;
      case 'bas':
        return `https://basescan.org/address/${address}`;
      default:
        return `https://etherscan.io/address/${address}`;
    }
  };

  const displayHolders = showAll ? holders : holders.slice(0, 5);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium">Top Holders</h4>
          {fromCache && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Database className="h-3.5 w-3.5 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Data from cache</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mb-2">
        Top 10 addresses hold{" "}
        <span className="font-medium">{totalPercentage}</span> of the total supply
      </p>
      
      <div className="bg-white border rounded-md overflow-hidden">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayHolders.map((holder, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="font-mono text-xs flex items-center">
                  {shortenAddress(holder.address)}
                  {blockchain && (
                    <a 
                      href={getExplorerUrl(holder.address)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-1 text-gray-500 hover:text-gray-800"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </TableCell>
                <TableCell className="text-right">{holder.percentage.toFixed(2)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {holders.length > 5 && (
          <div className="px-4 py-2 border-t">
            <button 
              onClick={() => setShowAll(!showAll)} 
              className="text-xs text-blue-600 hover:underline"
            >
              {showAll ? "Show less" : `Show all ${holders.length} holders`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to shorten addresses
function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}
