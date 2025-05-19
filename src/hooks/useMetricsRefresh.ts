
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

export function useMetricsRefresh(
  refetch: () => Promise<void>,
  setRefreshTrigger: React.Dispatch<React.SetStateAction<number>>
) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setForceRefresh(true);
    try {
      await refetch();
      setRefreshTrigger(prev => prev + 1);
      toast({
        title: "Metrics refreshed",
        description: "The latest token metrics have been loaded.",
      });
    } catch (error) {
      console.error("Error refreshing metrics:", error);
      toast({
        title: "Refresh failed",
        description: "Unable to refresh metrics. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
      // Reset force refresh after a delay to prevent repeated forced refreshes
      setTimeout(() => {
        setForceRefresh(false);
      }, 1000);
    }
  };

  return {
    isRefreshing,
    forceRefresh,
    handleRefresh,
    setForceRefresh
  };
}
