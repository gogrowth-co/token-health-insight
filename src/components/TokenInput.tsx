
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const TokenInput = () => {
  const [tokenInput, setTokenInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tokenInput.trim()) {
      toast({
        title: "Please enter a token",
        description: "Enter a token name, symbol, or contract address to continue",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    try {
      // Normalize input - strip '$' prefix if present
      const normalizedInput = tokenInput.trim();
      
      // Navigate to token search results page that will handle the API calls
      navigate(`/token/search?query=${encodeURIComponent(normalizedInput)}`);
    } catch (error) {
      console.error("Error processing token input:", error);
      toast({
        title: "Search error",
        description: "An error occurred while searching for the token. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col space-y-2">
        <label htmlFor="token" className="text-sm font-medium text-gray-700 text-left">
          Enter a token name, symbol (e.g. $PEPE), or contract address
        </label>
        <div className="flex w-full flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Input
              id="token"
              type="text"
              placeholder="e.g. Pepe, $ETH, or 0x1234..."
              className="flex-1 h-12 text-base pl-10"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <Button 
            type="submit" 
            size="lg" 
            className="h-12 px-6" 
            disabled={isSearching}
          >
            {isSearching ? (
              <>Searching...</>
            ) : (
              <>Find Token <ArrowRight className="ml-2 h-5 w-5" /></>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
