
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

export function useMetricsRefresh(
  refetch: () => Promise<void>,
  setRefreshTrigger?: React.Dispatch<React.SetStateAction<number>>
) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [refreshTrigger, setInternalRefreshTrigger] = useState(0);

  // Use the provided setRefreshTrigger or the internal one
  const effectiveSetRefreshTrigger = setRefreshTrigger || setInternalRefreshTrigger;

  const handleRefresh = async () => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshing) {
      return;
    }
    
    setIsRefreshing(true);
    setForceRefresh(true);
    
    try {
      // Show loading toast
      toast({
        title: "Refreshing metrics",
        description: "Fetching the latest data...",
      });
      
      // Increment the refresh trigger to force a new API call
      effectiveSetRefreshTrigger(prev => prev + 1);
      
      // Execute the refetch function
      await refetch();
      
      // Show success toast
      toast({
        title: "Metrics refreshed",
        description: "The latest token metrics have been loaded.",
      });
    } catch (error) {
      console.error("Error refreshing metrics:", error);
      
      // Show error toast with more helpful message
      const errorMessage = error instanceof Error ? error.message : String(error);
      const userFriendlyMessage = errorMessage.includes('Failed to fetch') || errorMessage.includes('connect to our servers')
        ? "Network connection issue. Please check your internet and try again."
        : "Unable to refresh metrics. Please try again later.";
        
      toast({
        title: "Refresh failed",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
      
      // Reset force refresh after a delay
      setTimeout(() => {
        setForceRefresh(false);
      }, 1000);
    }
  };

  return {
    isRefreshing,
    forceRefresh,
    handleRefresh,
    setForceRefresh,
    refreshTrigger,
    setRefreshTrigger: effectiveSetRefreshTrigger
  };
}
