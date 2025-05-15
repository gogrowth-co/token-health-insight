
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TokenMetrics } from "@/api/types";
import { scanToken } from "@/api/tokenScanner";
import { useToast } from "@/hooks/use-toast";

/**
 * Custom hook for scanning a token and tracking the progress
 */
export const useScanToken = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const scan = useCallback(async (tokenId: string): Promise<TokenMetrics | null> => {
    try {
      setIsLoading(true);
      setError(null);
      setProgress(10);

      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second total timeout
      
      toast({
        title: "Scanning token",
        description: "Fetching token information...",
      });

      // Try edge function first, fall back to client if needed
      let result: TokenMetrics | null = null;
      
      try {
        setProgress(30);
        toast({
          title: "Analyzing token",
          description: "Examining on-chain metrics...",
        });
        
        // Call the edge function with timeout
        const { data, error: funcError } = await supabase.functions.invoke('scan-token', {
          body: { tokenId },
          abortSignal: controller.signal,
        });
        
        if (funcError) throw new Error(funcError.message);
        result = data as TokenMetrics;
        
        setProgress(80);
        toast({
          title: "Processing data",
          description: "Compiling token health metrics...",
        });
      } catch (edgeFunctionError) {
        console.warn("Edge function error, falling back to client-side scan:", edgeFunctionError);
        
        // Update UI to show fallback status
        setProgress(40);
        toast({
          title: "Using fallback scanner",
          description: "Our primary scanner is busy. Using alternative scan method...",
        });
        
        // Fall back to client-side token scanning with progress updates
        const scanProgress = (progress: number) => {
          setProgress(40 + Math.floor(progress * 0.4)); // 40% to 80% range
        };
        
        result = await scanToken(tokenId, scanProgress);
      }
      
      setProgress(100);
      
      if (result) {
        // Create a variable for variant that only uses the allowed types
        const toastVariant: "default" | "destructive" = 
          result.healthScore >= 80 ? "default" : "destructive";
        
        toast({
          title: "Scan complete",
          description: `Health score: ${result.healthScore}/100`,
          variant: toastVariant,
        });
      } else {
        throw new Error("Failed to retrieve token data");
      }
      
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      
      toast({
        title: "Scan failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  return { scan, isLoading, progress, error };
};
