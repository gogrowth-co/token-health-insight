
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CryptoTrivia } from "@/components/CryptoTrivia";
import { X, Loader } from "lucide-react";
import { useTokenInfo } from "@/hooks/useTokenInfo";

interface ScanLoadingScreenProps {
  token: string;
}

export function ScanLoadingScreen({ token }: ScanLoadingScreenProps) {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing scan");
  
  // We don't want to modify the token ID from CoinGecko at all
  // Just pass it directly to the hook to maintain consistency
  const { data: tokenInfo } = useTokenInfo(token);
  
  console.log(`[ScanLoading] Processing token: ${token}, resolved name: ${tokenInfo?.name || 'Pending...'}`);
  
  const displayName = tokenInfo?.name || token.toUpperCase();
  const displaySymbol = tokenInfo?.symbol?.toUpperCase();
  
  // Simulate scanning process
  useEffect(() => {
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
        setTimeout(() => {
          navigate(`/scan?token=${encodeURIComponent(token)}`);
        }, 1000);
      }
    }, 2200); // Each step takes ~2.2 seconds
    
    return () => clearInterval(intervalId);
  }, [token, navigate]);
  
  const handleCancel = () => {
    navigate("/");
  };
  
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
            <p className="text-lg font-medium">
              {displayName} {displaySymbol && `(${displaySymbol})`}
            </p>
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
