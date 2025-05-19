
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Signup from "./pages/Signup";
import SignIn from "./pages/SignIn";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ScanResult from "./pages/ScanResult";
import TokenConfirmationPage from "./pages/TokenConfirmationPage";
import ScanLoading from "./pages/ScanLoading";
import HowItWorks from "./pages/HowItWorks";
import Docs from "./pages/Docs";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Subscription from "./pages/Subscription";

// Create App component with React functional component syntax
const App = () => {
  // Create a new QueryClient instance inside the component
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <SubscriptionProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/scan/confirm" element={<TokenConfirmationPage />} />
                <Route path="/scan/loading" element={<ScanLoading />} />
                <Route path="/scan/:tokenId" element={<ScanResult />} />
                <Route path="/scan" element={<ScanResult />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SubscriptionProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
