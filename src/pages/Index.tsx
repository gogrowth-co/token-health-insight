
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TokenInput } from "@/components/TokenInput";
import { Button } from "@/components/ui/button";
import { StepCard } from "@/components/StepCard";
import { MetricCard } from "@/components/MetricCard";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Hero section */}
        <section className="bg-gradient-to-b from-white to-gray-100 py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Improve Your Crypto Project's Health
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Uncover what's holding your crypto project back — from security risks to social traction with our comprehensive analysis
              </p>
              
              {user ? (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="text-lg px-8">
                    <Link to="/dashboard">Go to Dashboard</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-lg px-8">
                    <Link to="/how-it-works">Learn How It Works</Link>
                  </Button>
                </div>
              ) : (
                <TokenInput />
              )}
            </div>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <MetricCard 
                title="Security Score" 
                icon="shield-check" 
                description="Identify vulnerabilities and security risks in your contract" 
              />
              <MetricCard 
                title="Liquidity Health" 
                icon="trending-up" 
                description="Analyze token distribution and liquidity stability" 
              />
              <MetricCard 
                title="Community Growth" 
                icon="users" 
                description="Evaluate social sentiment and community engagement" 
              />
            </div>
          </div>
        </section>
        
        {/* How it works */}
        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Get a comprehensive health check for your crypto project in minutes
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              <StepCard 
                number={1}
                title="Enter Your Token"
                description="Enter your token ticker or contract address to begin the scan"
              />
              <StepCard 
                number={2}
                title="Analyze Results"
                description="Review key metrics across security, liquidity, and community"
              />
              <StepCard 
                number={3}
                title="Take Action"
                description="Follow our recommendations to improve your project's health"
              />
            </div>
          </div>
        </section>
        
        {/* CTA section */}
        <section className="bg-indigo-600 py-16 px-4 text-white">
          <div className="container mx-auto max-w-6xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Improve Your Token's Health?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Get started with a free health scan and receive actionable insights
            </p>
            {user ? (
              <Button asChild size="lg" variant="secondary" className="text-lg px-8">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="secondary" className="text-lg px-8">
                <Link to="/auth">Create Free Account</Link>
              </Button>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
