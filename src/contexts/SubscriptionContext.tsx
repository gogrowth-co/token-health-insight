
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type SubscriptionStatus = {
  subscribed: boolean;
  tier: string | null;
  endDate: string | null;
  scanCount: number;
  scanLimit: number;
  loading: boolean;
  canScan: boolean;
};

type SubscriptionContextType = {
  status: SubscriptionStatus;
  refreshStatus: () => Promise<void>;
  createCheckout: (plan: 'monthly' | 'annual') => Promise<string | null>;
  openCustomerPortal: () => Promise<void>;
  incrementScanCount: () => Promise<boolean>;
};

const defaultStatus: SubscriptionStatus = {
  subscribed: false,
  tier: null,
  endDate: null,
  scanCount: 0,
  scanLimit: 3,
  loading: true,
  canScan: true,
};

export const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { session, user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>(defaultStatus);

  const refreshStatus = async () => {
    if (!session) {
      setStatus({
        ...defaultStatus,
        loading: false,
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Error checking subscription:", error);
        toast({
          title: "Subscription check failed",
          description: "Could not verify your subscription status",
          variant: "destructive",
        });
        return;
      }

      setStatus({
        subscribed: data.subscribed,
        tier: data.subscription_tier || "Free",
        endDate: data.subscription_end,
        scanCount: data.scan_count || 0,
        scanLimit: data.scan_limit || 3,
        loading: false,
        canScan: (data.scan_count || 0) < (data.scan_limit || 3),
      });
    } catch (error) {
      console.error("Error refreshing subscription status:", error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const createCheckout = async (plan: 'monthly' | 'annual'): Promise<string | null> => {
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upgrade your subscription",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { plan },
      });

      if (error) {
        console.error("Error creating checkout:", error);
        toast({
          title: "Checkout error",
          description: "Could not create checkout session",
          variant: "destructive",
        });
        return null;
      }

      return data.url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Checkout error",
        description: "Could not process your subscription",
        variant: "destructive",
      });
      return null;
    }
  };

  const openCustomerPortal = async () => {
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to manage your subscription",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Error opening customer portal:", error);
        toast({
          title: "Portal error",
          description: "Could not open subscription management",
          variant: "destructive",
        });
        return;
      }

      window.open(data.url, "_self");
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Portal error",
        description: "Could not access subscription management",
        variant: "destructive",
      });
    }
  };

  const incrementScanCount = async (): Promise<boolean> => {
    if (!session || !user) return false;
    
    try {
      // First, refresh status to get the latest count
      await refreshStatus();
      
      if (status.scanCount >= status.scanLimit) {
        toast({
          title: "Scan limit reached",
          description: `You've reached your daily limit of ${status.scanLimit} scans. Upgrade for more!`,
          variant: "destructive",
        });
        return false;
      }
      
      // Update the local state first for immediate feedback
      setStatus(prev => ({
        ...prev,
        scanCount: prev.scanCount + 1,
        canScan: prev.scanCount + 1 < prev.scanLimit
      }));
      
      // Then update the database
      const { data, error } = await supabase
        .from("subscribers")
        .update({ scan_count: status.scanCount + 1 })
        .eq("user_id", user.id);
        
      if (error) {
        console.error("Error updating scan count:", error);
      }
      
      return true;
    } catch (error) {
      console.error("Error incrementing scan count:", error);
      return false;
    }
  };

  // Initial load and refresh when session changes
  useEffect(() => {
    refreshStatus();
  }, [session]);
  
  const value = {
    status,
    refreshStatus,
    createCheckout,
    openCustomerPortal,
    incrementScanCount,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};
