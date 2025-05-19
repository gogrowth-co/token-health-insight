
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RefreshButtonProps {
  isRefreshing: boolean;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

export const RefreshButton = ({ isRefreshing, isLoading, onRefresh }: RefreshButtonProps) => {
  return (
    <Button 
      size="sm"
      variant="outline"
      onClick={onRefresh}
      disabled={isRefreshing || isLoading}
      className="flex items-center gap-1"
    >
      {(isRefreshing) ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Refreshing...</span>
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </>
      )}
    </Button>
  );
};
