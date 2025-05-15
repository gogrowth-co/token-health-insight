
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cleanTokenId } from "@/api/tokenScanner";

export const TokenInput = () => {
  const [tokenInput, setTokenInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tokenInput.trim()) {
      toast({
        title: "Please enter a token",
        description: "Enter a token symbol or contract address to continue",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("TokenInput: Submitting token:", tokenInput);
      console.log("TokenInput: User authenticated:", !!user);
      
      // Check if input is an Ethereum address
      const isEthereumAddress = /^0x[a-fA-F0-9]{40}$/i.test(tokenInput.trim());
      
      // Clean token input to ensure compatibility with APIs
      const cleanedToken = isEthereumAddress ? tokenInput.trim() : cleanTokenId(tokenInput);
      
      // Use consistent parameter name 'token' instead of 'tokenId'
      // Navigate to scan results if authenticated, otherwise to auth signup page with token as URL param
      if (user) {
        console.log("TokenInput: User logged in, navigating to scan with token:", cleanedToken);
        navigate(`/scan?token=${encodeURIComponent(cleanedToken)}`);
      } else {
        console.log("TokenInput: User not logged in, navigating to auth with token:", cleanedToken);
        navigate(`/auth?tab=signup&token=${encodeURIComponent(cleanedToken)}`);
      }
    } catch (error) {
      console.error("Error processing token input:", error);
      toast({
        title: "Error",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col space-y-2">
        <label htmlFor="token" className="text-sm font-medium text-gray-700 text-left">
          Enter a token (e.g. ETH, $PEPE, or a contract address)
        </label>
        <div className="flex w-full flex-col sm:flex-row gap-2">
          <Input
            id="token"
            type="text"
            placeholder="e.g. ETH, $PEPE or 0x1234..."
            className="flex-1 h-12 text-base"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
          <Button 
            type="submit" 
            size="lg" 
            className="h-12 px-6" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Scanning..." : "Start Scan"} 
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </form>
  );
};
