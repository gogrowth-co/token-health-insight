
import { useEffect, useState } from "react";
import { useSearchParams, Navigate, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScanLoadingScreen } from "@/components/ScanLoadingScreen";
import { useAuth } from "@/contexts/AuthContext";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { toast } from "@/components/ui/use-toast";

export default function ScanLoading() {
  const { user, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get token from URL directly without normalization
  const token = searchParams.get("token") || "";
  
  // Fetch token info as early as possible
  const { data: tokenInfo, isLoading: tokenInfoLoading, error: tokenInfoError } = useTokenInfo(token);
  
  // Store token metadata once received
  const [tokenMetadata, setTokenMetadata] = useState({
    id: token,
    name: undefined,
    symbol: undefined,
    logo: undefined
  });
  
  // Track page view and update metadata when available
  useEffect(() => {
    console.log("[ScanLoading] Loading scan for token:", token);
    
    if (!token) {
      toast({
        title: "No token selected",
        description: "Please select a token to scan",
        variant: "destructive"
      });
      navigate("/");
      return;
    }
    
    // Update metadata when token info is available
    if (tokenInfo && !tokenInfoLoading) {
      console.log("[ScanLoading] Token info received:", tokenInfo.name);
      setTokenMetadata({
        id: token,
        name: tokenInfo.name || undefined,
        symbol: tokenInfo.symbol?.toUpperCase() || undefined,
        logo: tokenInfo.image || undefined
      });
    }
    
  }, [token, tokenInfo, tokenInfoLoading, navigate]);
  
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
        <ScanLoadingScreen 
          token={token} 
          tokenMetadata={tokenMetadata}
        />
      </main>
      <Footer />
    </div>
  );
}
