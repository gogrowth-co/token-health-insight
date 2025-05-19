
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
  
  // Initialize token metadata from URL params
  const [tokenMetadata, setTokenMetadata] = useState({
    id: token,
    name: searchParams.get("name") || undefined,
    symbol: searchParams.get("symbol") || undefined,
    logo: searchParams.get("logo") || undefined,
    marketCap: searchParams.get("market_cap") || undefined,
    price: searchParams.get("price") || undefined
  });

  // Log initial state to help debugging
  useEffect(() => {
    console.log("[ScanLoading] Initial token metadata:", tokenMetadata);
  }, []);
  
  // Fetch token info regardless of metadata for fallback purposes
  const { data: tokenInfo, isLoading: tokenInfoLoading, error: tokenInfoError } = useTokenInfo(token);
  
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
      
      // Only update fields that aren't already set from URL params
      setTokenMetadata(prev => ({
        id: token,
        name: prev.name || tokenInfo.name || undefined,
        symbol: prev.symbol || tokenInfo.symbol?.toUpperCase() || undefined,
        logo: prev.logo || tokenInfo.image || undefined,
        marketCap: prev.marketCap || (tokenInfo.market_cap?.toString() || undefined),
        price: prev.price || (tokenInfo.current_price?.toString() || undefined)
      }));
    }
    
    if (tokenInfoError && !tokenInfoLoading) {
      console.error("[ScanLoading] Error fetching token info:", tokenInfoError);
      
      // Only show error if we don't have metadata from the URL
      if (!tokenMetadata.name) {
        toast({
          title: "Error loading token data",
          description: "We couldn't load information for this token. Please try again.",
          variant: "destructive"
        });
      }
    }
    
  }, [token, tokenInfo, tokenInfoLoading, tokenInfoError, navigate, tokenMetadata.name]);
  
  // Redirect to auth page if not authenticated
  if (!authLoading && !user) {
    const authParams = new URLSearchParams({
      tab: 'signup',
      token: token
    });
    
    // Pass along all token metadata
    if (tokenMetadata.name) authParams.append('name', tokenMetadata.name);
    if (tokenMetadata.symbol) authParams.append('symbol', tokenMetadata.symbol);
    if (tokenMetadata.logo) authParams.append('logo', tokenMetadata.logo);
    
    return <Navigate to={`/auth?${authParams.toString()}`} />;
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
