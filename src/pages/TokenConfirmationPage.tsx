
import { useSearchParams, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TokenConfirmation } from "@/components/TokenConfirmation";
import { useAuth } from "@/contexts/AuthContext";

export default function TokenConfirmationPage() {
  const { user, isLoading: authLoading } = useAuth();
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
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <TokenConfirmation token={token} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
