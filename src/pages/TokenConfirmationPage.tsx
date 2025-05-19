
import { useSearchParams, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TokenConfirmation } from "@/components/TokenConfirmation";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Loader2 } from "lucide-react";

export default function TokenConfirmationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { status } = useSubscription();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  
  // Redirect to auth page if not authenticated
  if (!authLoading && !user) {
    return <Navigate to={`/auth?tab=signup&token=${encodeURIComponent(token)}`} />;
  }
  
  // Redirect to home if no token provided
  if (!token) {
    return <Navigate to="/" />;
  }

  // Show loading state while checking subscription
  if (status.loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 bg-gray-50 py-12 px-4 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-purple mx-auto mb-4" />
            <p>Checking subscription status...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <TokenConfirmation 
            token={token} 
            canScan={status.canScan}
            scanCount={status.scanCount}
            scanLimit={status.scanLimit}
            tier={status.tier}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
