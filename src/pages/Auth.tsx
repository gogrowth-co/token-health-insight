
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SignUpForm } from "@/components/SignUpForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignInForm } from "@/components/SignInForm";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');
  const tokenParam = queryParams.get('token');
  
  // Default to signup if there's a token parameter or if tab=signup is explicitly set
  // Otherwise, default to signin
  const defaultTab = tokenParam ? 'signup' : (tabParam === 'signup' ? 'signup' : 'signin');
  
  // Effect to redirect to scan page if user is already logged in and has a token
  useEffect(() => {
    if (user && tokenParam) {
      console.log("User already logged in with token param, redirecting to scan:", tokenParam);
      navigate(`/scan?token=${encodeURIComponent(tokenParam)}`);
    }
  }, [user, tokenParam, navigate]);
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Slim header with logo and sign-in link */}
      <header className="border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-md bg-brand-purple flex items-center justify-center">
              <span className="text-white font-bold text-sm">TH</span>
            </div>
            <span className="font-bold text-lg">Token Health Scan</span>
          </Link>
          
          {defaultTab === 'signin' ? (
            <div className="text-sm">
              Don't have an account?{" "}
              <Link to={tokenParam ? `/auth?tab=signup&token=${encodeURIComponent(tokenParam)}` : "/auth?tab=signup"} className="text-brand-purple font-medium">
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="text-sm">
              Already have an account?{" "}
              <Link to={tokenParam ? `/auth?tab=signin&token=${encodeURIComponent(tokenParam)}` : "/auth?tab=signin"} className="text-brand-purple font-medium">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-md">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="hidden">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="mt-0">
            <SignInForm redirectToken={tokenParam} />
          </TabsContent>
          
          <TabsContent value="signup" className="mt-0">
            <SignUpForm redirectToken={tokenParam} />
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default Auth;
