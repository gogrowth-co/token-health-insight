
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
  
  // Store token metadata once received
  const [tokenMetadata, setTokenMetadata] = useState({
    id: token,
    name: searchParams.get("name") || undefined,
    symbol: searchParams.get("symbol") || undefined,
    logo: searchParams.get("logo") || undefined
  });

  // Fetch token info only if no metadata name is present
  const { data: tokenInfo, isLoading: tokenInfoLoading, error: tokenInfoError } = 
    useTokenInfo(token && !tokenMetadata.name ? token : null);
  
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
      setTokenMetadata(prev => ({
        id: token,
        name: prev.name || tokenInfo.name || undefined,
        symbol: prev.symbol || tokenInfo.symbol?.toUpperCase() || undefined,
        logo: prev.logo || tokenInfo.image || undefined
      }));
    }
    
    if (tokenInfoError && !tokenInfoLoading && !tokenMetadata.name) {
      console.error("[ScanLoading] Error fetching token info:", tokenInfoError);
      toast({
        title: "Error loading token data",
        description: "We couldn't load information for this token. Please try again.",
        variant: "destructive"
      });
    }
    
  }, [token, tokenInfo, tokenInfoLoading, tokenInfoError, navigate, tokenMetadata.name]);
  
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
