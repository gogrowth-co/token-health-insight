
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const TokenInput = () => {
  const [tokenInput, setTokenInput] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tokenInput.trim()) {
      toast({
        title: "Please enter a token",
        description: "Enter a token symbol or contract address to continue",
        variant: "destructive",
      });
      return;
    }
    
    // Navigate to dashboard if authenticated, otherwise to signup with token as URL param
    if (user) {
      navigate(`/dashboard?token=${encodeURIComponent(tokenInput)}`);
    } else {
      navigate(`/auth?token=${encodeURIComponent(tokenInput)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl">
      <div className="flex flex-col space-y-2">
        <label htmlFor="token" className="text-sm font-medium text-gray-700">
          Enter your token (e.g. $TOKEN or contract address)
        </label>
        <div className="flex w-full flex-col sm:flex-row gap-2">
          <Input
            id="token"
            type="text"
            placeholder="e.g. $ETH or 0x1234..."
            className="flex-1 h-12 text-base"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
          <Button type="submit" size="lg" className="h-12 px-6">
            Start Scan <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </form>
  );
};
