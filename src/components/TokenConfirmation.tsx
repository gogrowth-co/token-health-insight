
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, Loader2 } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Link } from "react-router-dom";

interface TokenConfirmationProps {
  token: string;
  canScan: boolean;
  scanCount: number;
  scanLimit: number;
  tier: string | null;
}

export const TokenConfirmation = ({ token, canScan, scanCount, scanLimit, tier }: TokenConfirmationProps) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const { incrementScanCount } = useSubscription();
  const isPro = tier === "Pro Monthly" || tier === "Pro Annual";

  const handleScanStart = async () => {
    setIsProcessing(true);
    try {
      // Increment scan count
      const success = await incrementScanCount();
      
      if (success) {
        // Redirect to scan loading page
        navigate(`/scan/loading?token=${encodeURIComponent(token)}`);
      } else {
        // Scan limit reached, navigate to subscription page
        navigate("/subscription");
      }
    } catch (error) {
      console.error("Error starting scan:", error);
      setIsProcessing(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Confirm Token Scan</CardTitle>
        <CardDescription>
          You're about to scan token information for:
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Token Display */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <code className="text-lg font-mono break-all">{token}</code>
        </div>
        
        {/* Scan Credit Information */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold flex items-center">
                {isPro && <Shield className="h-4 w-4 mr-1 text-brand-purple" />}
                {tier} Plan Scan Credits
              </h3>
              <p className="text-sm text-gray-500">Resets daily</p>
            </div>
            <p className="text-lg font-bold">{scanCount} / {scanLimit}</p>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-brand-purple h-2.5 rounded-full" 
              style={{ width: `${(scanCount / scanLimit) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Warning if almost out of credits */}
        {scanCount >= scanLimit - 1 && !isPro && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Almost out of scans</p>
              <p className="text-sm text-amber-700">
                You'll have {scanLimit - scanCount - 1} scan remaining after this one. 
                <Link to="/subscription" className="text-brand-purple hover:underline ml-1">
                  Upgrade to Pro for more.
                </Link>
              </p>
            </div>
          </div>
        )}
        
        {/* Scan limit reached */}
        {!canScan && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Daily scan limit reached</p>
              <p className="text-sm text-red-700">
                You've used all your daily scans. 
                <Link to="/subscription" className="text-brand-purple hover:underline ml-1">
                  Upgrade to Pro for more.
                </Link>
              </p>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-500">
          <p>This will analyze on-chain data for the specified token. Full analysis may take a moment to complete.</p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          disabled={isProcessing}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        
        {canScan ? (
          <Button
            onClick={handleScanStart}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              <>Start Scan</>
            )}
          </Button>
        ) : (
          <Button
            asChild
            className="w-full sm:w-auto"
          >
            <Link to="/subscription">Upgrade to Pro</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
