
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Search, AlertTriangle } from "lucide-react";
import { useTokenSearch, TokenSearchResult } from "@/hooks/useTokenSearch";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { formatCurrency } from "@/lib/utils";

interface TokenSearchResultsProps {
  query: string;
  isAuthenticated: boolean;
}

export function TokenSearchResults({ query, isAuthenticated }: TokenSearchResultsProps) {
  const navigate = useNavigate();
  const { status, incrementScanCount } = useSubscription();
  const { data: tokens, isLoading, error } = useTokenSearch(query);
  const [processingTokenId, setProcessingTokenId] = useState<string | null>(null);
  
  const handleBackClick = () => {
    navigate("/");
  };
  
  const handleTokenSelect = async (token: TokenSearchResult) => {
    setProcessingTokenId(token.id);
    console.log(`[TokenSearch] Selected token: ${token.id} (${token.symbol})`);
    
    try {
      // If user is not authenticated, redirect to auth with token in query params
      if (!isAuthenticated) {
        navigate(`/auth?tab=signup&token=${encodeURIComponent(token.id)}`);
        return;
      }
      
      // Check if user can scan (has available scan credits)
      if (!status.canScan) {
        navigate("/pricing");
        return;
      }
      
      // Increment scan count and proceed to scan
      const success = await incrementScanCount();
      
      if (success) {
        // Redirect to scan loading page - use the token ID exactly as it comes from CoinGecko
        console.log(`[TokenSearch] Navigating to scan with token ID: ${token.id}`);
        navigate(`/scan/loading?token=${encodeURIComponent(token.id)}`);
      } else {
        // Scan limit reached, navigate to subscription page
        navigate("/pricing");
      }
    } catch (error) {
      console.error("Error selecting token:", error);
    } finally {
      setProcessingTokenId(null);
    }
  };
  
  // Format display name
  const displayQuery = query.startsWith('$') ? query : query;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={handleBackClick}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Search Results</h1>
          <p className="text-gray-500">Results for "{displayQuery}"</p>
        </div>
      </div>
      
      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple mx-auto mb-4" />
          <p>Searching for tokens...</p>
        </div>
      )}
      
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Error searching for tokens</h3>
                <p className="text-sm text-red-600">{error.message || "Please try again later."}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {!isLoading && !error && tokens && tokens.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex gap-3 items-start">
              <Search className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800">No tokens found</h3>
                <p className="text-sm text-amber-600">We couldn't find any tokens matching "{displayQuery}". Try another search term.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {!isLoading && !error && tokens && tokens.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            We found {tokens.length} token{tokens.length !== 1 ? 's' : ''} matching your search. Select one to scan:
          </p>
          
          <div className="grid grid-cols-1 gap-4">
            {tokens.map((token) => (
              <Card key={token.id} className="overflow-hidden transition-all hover:shadow-md">
                <div className="flex items-center p-4 sm:p-6">
                  <div className="flex-shrink-0 mr-4">
                    {token.image ? (
                      <img src={token.image} alt={token.name} className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        {token.symbol?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <h3 className="font-medium text-lg">{token.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <span className="text-gray-500 text-sm">{token.symbol}</span>
                      {token.market_cap_rank && (
                        <span className="text-gray-500 text-sm">Rank #{token.market_cap_rank}</span>
                      )}
                      {token.market_cap ? (
                        <span className="text-gray-500 text-sm">
                          Market Cap: {formatCurrency(token.market_cap)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Market Cap: N/A</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleTokenSelect(token)}
                      disabled={processingTokenId === token.id}
                    >
                      {processingTokenId === token.id ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Processing
                        </>
                      ) : (
                        "Scan Now"
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      <div className="pt-6">
        <Button variant="outline" onClick={handleBackClick}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>
      </div>
    </div>
  );
}
