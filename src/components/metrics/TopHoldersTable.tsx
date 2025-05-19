
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Database } from "lucide-react";

interface TopHolderEntry {
  address: string;
  percentage: number;
  value: string;
}

interface TopHoldersTableProps {
  topHolders: TopHolderEntry[];
  totalPercentage: string;
  fromCache?: boolean;
  isLoading?: boolean;
}

export const TopHoldersTable = ({
  topHolders,
  totalPercentage,
  fromCache = false,
  isLoading = false,
}: TopHoldersTableProps) => {
  if (isLoading) {
    return (
      <div className="w-full rounded-md border p-4">
        <div className="space-y-2">
          <div className="h-4 w-1/4 animate-pulse rounded bg-muted"></div>
          <div className="h-10 w-full animate-pulse rounded bg-muted"></div>
          <div className="h-10 w-full animate-pulse rounded bg-muted"></div>
          <div className="h-10 w-full animate-pulse rounded bg-muted"></div>
        </div>
      </div>
    );
  }

  if (topHolders.length === 0) {
    return (
      <div className="w-full rounded-md border p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Top 10 Holders</h3>
          {fromCache && (
            <span className="flex items-center text-xs text-muted-foreground">
              <Database className="mr-1 h-3 w-3" />
              From cache
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-md border">
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="font-medium">Top 10 Holders</h3>
        {fromCache && (
          <span className="flex items-center text-xs text-muted-foreground">
            <Database className="mr-1 h-3 w-3" />
            From cache
          </span>
        )}
      </div>
      <div className="p-4 pt-0">
        <p className="text-sm text-muted-foreground">
          The top 10 addresses hold{" "}
          <span className="font-medium">{totalPercentage}</span> of the total
          supply.
        </p>
      </div>

      <div className="p-0">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topHolders.map((holder, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="font-mono text-xs">
                  {shortenAddress(holder.address)}
                </TableCell>
                <TableCell className="text-right">{holder.percentage.toFixed(2)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Helper function to shorten addresses
function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}
