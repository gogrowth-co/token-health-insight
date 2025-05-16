
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader, Info, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTokenInfo } from "@/hooks/useTokenInfo";

interface TokenConfirmationProps {
  token: string;
}

export const TokenConfirmation = ({ token }: TokenConfirmationProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Clean token input (remove $ if present)
  const cleanToken = token.replace(/^\$/, '');
  
  // Get basic token info to display
  const { data: tokenInfo, isLoading, error } = useTokenInfo(cleanToken);
  
  const handleConfirm = () => {
    setIsConfirming(true);
    navigate(`/scan/loading?token=${encodeURIComponent(cleanToken)}`);
  };
  
  const handleBack = () => {
    navigate("/");
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Confirm Token Scan</h2>
      
      <Alert className="mb-6">
        <Info className="h-5 w-5" />
        <AlertTitle>Beta Feature</AlertTitle>
        <AlertDescription>
          Token Health Scan is currently in beta. We only support scanning tokens on the Ethereum blockchain at this time.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4 mb-6">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Token</span>
          <span className="font-medium">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                <span>Loading token information...</span>
              </div>
            ) : error ? (
              <span className="text-red-500">Unable to verify token: {cleanToken}</span>
            ) : (
              <span>
                {tokenInfo?.name || cleanToken.toUpperCase()} 
                {tokenInfo?.symbol && `(${tokenInfo.symbol.toUpperCase()})`}
              </span>
            )}
          </span>
        </div>
        
        {tokenInfo?.contract_address && (
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Contract Address</span>
            <span className="font-mono text-sm break-all">{tokenInfo.contract_address}</span>
          </div>
        )}
        
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Network</span>
          <span className="font-medium">Ethereum Mainnet</span>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline" 
          onClick={handleBack} 
          disabled={isConfirming}
          className="flex-1 sm:flex-none"
        >
          Go Back
        </Button>
        <Button 
          onClick={handleConfirm} 
          disabled={isConfirming || isLoading}
          className="flex-1 sm:flex-none"
        >
          {isConfirming ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Preparing Scan
            </>
          ) : (
            <>
              Confirm & Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
