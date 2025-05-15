
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TokenMetrics } from "@/api/types";
import { scanToken } from "@/api/tokenScanner";
import { useToast } from "@/hooks/use-toast";

export const useScanToken = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const scan = async (tokenId: string): Promise<TokenMetrics | null> => {
    try {
      setIsLoading(true);
      setError(null);
      setProgress(10);

      // Simulate staged loading for better UX
      setTimeout(() => setProgress(30), 500);
      
      toast({
        title: "Scanning token",
        description: "Fetching token information...",
      });

      // Try edge function first if available, fall back to client
      let result: TokenMetrics | null = null;
      
      try {
        setTimeout(() => setProgress(50), 1000);
        
        // Call the edge function
        const { data, error: funcError } = await supabase.functions.invoke('scan-token', {
          body: { tokenId },
        });
        
        if (funcError) throw new Error(funcError.message);
        result = data as TokenMetrics;
        
        setTimeout(() => setProgress(80), 1500);
      } catch (edgeFunctionError) {
        console.warn("Edge function error, falling back to client-side scan:", edgeFunctionError);
        
        // Fall back to client-side token scanning
        result = await scanToken(tokenId);
      }
      
      setProgress(100);
      
      if (result) {
        toast({
          title: "Scan complete",
          description: `Health score: ${result.healthScore}/100`,
          variant: result.healthScore >= 80 ? "default" : result.healthScore >= 60 ? "warning" : "destructive",
        });
      } else {
        throw new Error("Failed to retrieve token data");
      }
      
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error occurred");
      toast({
        title: "Scan failed",
        description: error instanceof Error ? error.message : "Failed to retrieve token data",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { scan, isLoading, progress, error };
};
