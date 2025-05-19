
import { useSearchParams, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TokenSearchResults } from "@/components/TokenSearchResults";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function TokenSearchPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  
  // Redirect to home if no query provided
  if (!query) {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {authLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-purple mx-auto mb-4" />
              <p>Loading...</p>
            </div>
          ) : (
            <TokenSearchResults query={query} isAuthenticated={!!user} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
