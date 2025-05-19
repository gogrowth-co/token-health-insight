
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CryptoTrivia } from "@/components/CryptoTrivia";
import { X, Loader } from "lucide-react";
import { useTokenInfo } from "@/hooks/useTokenInfo";

interface TokenMetadata {
  id: string;
  name?: string;
  symbol?: string;
  logo?: string;
  marketCap?: string;
  price?: string;
  contract_address?: string;
  blockchain?: string;
}

interface ScanLoadingScreenProps {
  token: string;
  tokenMetadata?: TokenMetadata;
}

export function ScanLoadingScreen({ token, tokenMetadata }: ScanLoadingScreenProps) {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing scan");
  
  // Always call useTokenInfo for consistent hook behavior
  const { data: tokenInfo } = useTokenInfo(token);
  
  // Choose best available display data - ensure consistent rendering
  const displayName = tokenMetadata?.name || tokenInfo?.name || "Loading token data...";
  const displaySymbol = tokenMetadata?.symbol || tokenInfo?.symbol?.toUpperCase() || "";
  
  console.log(`[ScanLoading] Processing token: ${token}, resolved name: ${displayName}, symbol: ${displaySymbol}`);
  console.log(`[ScanLoading] Token metadata:`, tokenMetadata);
  console.log(`[ScanLoading] Token API data:`, tokenInfo);
  
  // Simulate scanning process with progress steps
  useEffect(() => {
    if (!token) {
      console.error("[ScanLoadingScreen] No token provided");
      navigate("/");
      return;
    }

    const steps = [
      { progress: 10, text: "Fetching token data" },
      { progress: 25, text: "Analyzing smart contract" },
      { progress: 40, text: "Checking liquidity pools" },
      { progress: 55, text: "Evaluating tokenomics" },
      { progress: 70, text: "Auditing holder distribution" },
      { progress: 85, text: "Scanning community metrics" },
      { progress: 95, text: "Finalizing health report" },
      { progress: 100, text: "Scan complete!" },
    ];
    
    let stepIndex = 0;
    
    // Process each step
    const intervalId = setInterval(() => {
      if (stepIndex < steps.length) {
        const step = steps[stepIndex];
        setProgress(step.progress);
        setStatusText(step.text);
        stepIndex++;
      } else {
        clearInterval(intervalId);
        
        // Navigate to results page after completing - maintain token ID exactly as is
        console.log(`[ScanLoading] Scan complete, navigating to results with token: ${token}`);
        
        // Pass token metadata in URL to ensure consistency
        const queryParams = new URLSearchParams({
          token: token
        });
        
        // Add all available metadata from search and API results
        if (tokenMetadata?.name) queryParams.append('name', tokenMetadata.name);
        if (tokenMetadata?.symbol) queryParams.append('symbol', tokenMetadata.symbol);
        if (tokenMetadata?.logo) queryParams.append('logo', tokenMetadata.logo);
        if (tokenMetadata?.marketCap) queryParams.append('market_cap', tokenMetadata.marketCap);
        if (tokenMetadata?.price) queryParams.append('price', tokenMetadata.price);
        if (tokenMetadata?.contract_address) queryParams.append('contract_address', tokenMetadata.contract_address);
        if (tokenMetadata?.blockchain) queryParams.append('blockchain', tokenMetadata.blockchain);
        
        // Add any fresh data from tokenInfo as fallback
        if (!tokenMetadata?.name && tokenInfo?.name) queryParams.append('name', tokenInfo.name);
        if (!tokenMetadata?.symbol && tokenInfo?.symbol) queryParams.append('symbol', tokenInfo.symbol.toUpperCase());
        if (!tokenMetadata?.logo && tokenInfo?.image) queryParams.append('logo', tokenInfo.image);
        if (!tokenMetadata?.contract_address && tokenInfo?.contract_address) queryParams.append('contract_address', tokenInfo.contract_address);
        if (!tokenMetadata?.blockchain && tokenInfo?.blockchain) queryParams.append('blockchain', tokenInfo.blockchain);
        
        console.log(`[ScanLoading] Navigating to results with params: ${queryParams.toString()}`);
        
        // Navigate with all params
        setTimeout(() => {
          navigate(`/scan?${queryParams.toString()}`);
        }, 1000);
      }
    }, 2200); // Each step takes ~2.2 seconds
    
    return () => clearInterval(intervalId);
  }, [token, navigate, tokenMetadata, tokenInfo]);
  
  const handleCancel = () => {
    navigate("/");
  };
  
  // Determine if we should show loading state or actual token data
  const isLoadingToken = !displayName || displayName === "Loading token data...";
  
  return (
    <div className="flex flex-col max-w-3xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Scanning Token Health</h2>
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Loader className="h-4 w-4 animate-spin text-indigo-600" />
            {isLoadingToken ? (
              <div className="flex items-center">
                <div className="h-5 w-32 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ) : (
              <p className="text-lg font-medium">
                {displayName} {displaySymbol && `(${displaySymbol})`}
              </p>
            )}
          </div>
          
          <Progress value={progress} className="h-2 mb-3" />
          
          <p className="text-sm text-gray-600">{statusText}...</p>
        </div>
        
        <div className="text-sm text-gray-500 italic">
          This might take a minute as we analyze on-chain data, liquidity metrics, and community signals.
        </div>
      </div>
      
      <CryptoTrivia />
    </div>
  );
}
