import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier: string;
  subscription_end: string | null;
  scan_count: number;
  scan_limit: number;
  canScan: boolean;
}

/**
 * Protected scan hook that validates subscription status before allowing scans
 * This provides centralized subscription checking to prevent bypass attempts
 */
export const useProtectedScan = () => {
  const { session, user } = useAuth();

  // Fetch subscription status
  const { data: subscription, isLoading, error, refetch } = useQuery<SubscriptionStatus>({
    queryKey: ['subscription-status', user?.id],
    queryFn: async () => {
      if (!session) {
        throw new Error('User must be authenticated to scan tokens');
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('[useProtectedScan] Error checking subscription:', error);
        throw new Error(`Failed to check subscription: ${error.message}`);
      }

      if (!data) {
        throw new Error('No subscription data returned');
      }

      return data as SubscriptionStatus;
    },
    enabled: !!session,
    staleTime: 30 * 1000, // 30 seconds - short cache to ensure up-to-date scan counts
    gcTime: 60 * 1000, // 1 minute
    retry: 2,
  });

  const canScan = subscription?.canScan ?? false;
  const scansRemaining = subscription ? subscription.scan_limit - subscription.scan_count : 0;
  const isFreeTier = subscription?.subscription_tier === 'Free';
  const isProTier = subscription?.subscription_tier?.startsWith('Pro') ?? false;

  /**
   * Perform a protected action that requires scan quota
   * @param scanFn - The scan function to execute
   * @returns Promise<T> - Result of the scan function
   * @throws Error if scan limit is reached or user is not authenticated
   */
  const performProtectedScan = async <T,>(scanFn: () => Promise<T>): Promise<T> => {
    // Validate authentication
    if (!session || !user) {
      throw new Error('You must be logged in to scan tokens. Please sign in or create an account.');
    }

    // Validate subscription status
    if (!subscription) {
      throw new Error('Unable to verify subscription status. Please try again.');
    }

    // Check scan limit
    if (!canScan) {
      const upgradeMessage = isFreeTier
        ? 'You have reached your free scan limit. Upgrade to Pro for unlimited scans!'
        : 'You have reached your daily scan limit. Please try again tomorrow or upgrade your plan.';

      throw new Error(upgradeMessage);
    }

    // Log the protected scan attempt
    console.log(`[useProtectedScan] Performing protected scan for user ${user.id}`, {
      tier: subscription.subscription_tier,
      scansRemaining,
      scanCount: subscription.scan_count,
      scanLimit: subscription.scan_limit
    });

    // Execute the scan function
    try {
      const result = await scanFn();

      // Refresh subscription status after successful scan to update count
      setTimeout(() => {
        refetch();
      }, 1000);

      return result;
    } catch (error) {
      console.error('[useProtectedScan] Error during protected scan:', error);
      throw error;
    }
  };

  /**
   * Check if a scan is allowed without performing it
   * Useful for UI state management (enabling/disabling scan buttons)
   */
  const checkScanAllowed = (): { allowed: boolean; reason?: string } => {
    if (!session) {
      return {
        allowed: false,
        reason: 'You must be logged in to scan tokens'
      };
    }

    if (!subscription) {
      return {
        allowed: false,
        reason: 'Unable to verify subscription status'
      };
    }

    if (!canScan) {
      return {
        allowed: false,
        reason: isFreeTier
          ? `Free scan limit reached (${subscription.scan_limit}/${subscription.scan_limit}). Upgrade to Pro!`
          : `Daily scan limit reached (${subscription.scan_limit}/${subscription.scan_limit}). Try again tomorrow.`
      };
    }

    return { allowed: true };
  };

  return {
    // Subscription data
    subscription,
    isLoading,
    error,

    // Scan status
    canScan,
    scansRemaining,
    isFreeTier,
    isProTier,

    // Actions
    performProtectedScan,
    checkScanAllowed,
    refreshSubscription: refetch,

    // User info
    isAuthenticated: !!session,
    userId: user?.id,
  };
};

/**
 * Higher-order function to wrap any async function with scan protection
 * Usage: const protectedFetch = withScanProtection(fetchTokenData);
 */
export const withScanProtection = <T extends (...args: any[]) => Promise<any>>(
  fn: T
): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    // This would need to be called from within a React component that has access to useProtectedScan
    // For now, this is a placeholder for future implementation
    console.warn('[withScanProtection] This HOF should be used within a component with useProtectedScan context');
    return fn(...args);
  };
};
