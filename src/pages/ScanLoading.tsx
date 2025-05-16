
import { useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScanLoadingScreen } from "@/components/ScanLoadingScreen";
import { useAuth } from "@/contexts/AuthContext";

export default function ScanLoading() {
  const { user, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  
  // Track page view
  useEffect(() => {
    console.log("Loading scan for token:", token);
  }, [token]);
  
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
        <ScanLoadingScreen token={token} />
      </main>
      <Footer />
    </div>
  );
}
