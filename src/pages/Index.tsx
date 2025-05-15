
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TokenInput } from "@/components/TokenInput";
import { StepCard } from "@/components/StepCard";
import { MetricCard } from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero-gradient py-16 md:py-24">
        <div className="container px-4 mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 max-w-3xl mx-auto leading-tight">
            Is Your Project Scaring Off Investors?
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Run a free scan and uncover what's holding your crypto project back — from security risks to social traction.
          </p>
          <div className="flex justify-center">
            <TokenInput />
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard
              number={1}
              title="Enter token"
              description="Input your token symbol or contract address to begin analysis"
              icon={<svg className="h-8 w-8 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>}
            />
            <StepCard
              number={2}
              title="Sign up"
              description="Create a free account to access your scan results and dashboard"
              icon={<svg className="h-8 w-8 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>}
            />
            <StepCard
              number={3}
              title="View your scan"
              description="Get comprehensive insights on your project's health and performance"
              icon={<svg className="h-8 w-8 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>}
            />
          </div>
        </div>
      </section>
      
      {/* Preview Cards Section */}
      <section className="py-16 bg-gray-50">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Comprehensive Health Analysis</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Get detailed insights into what makes or breaks your crypto project
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <MetricCard 
              title="Security"
              icon={<svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>}
              description="Evaluate security risks and contract vulnerabilities"
              metrics={[
                "Contract audit status",
                "Ownership controls",
                "Known vulnerabilities"
              ]}
              color="bg-red-500"
            />
            <MetricCard 
              title="Tokenomics"
              icon={<svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>}
              description="Analyze token distribution and economic model"
              metrics={[
                "Supply distribution",
                "Liquidity metrics",
                "Holder concentration"
              ]}
              color="bg-purple-500"
            />
            <MetricCard 
              title="Community"
              icon={<svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>}
              description="Measure social engagement and community health"
              metrics={[
                "Social media presence",
                "Developer activity",
                "Community growth"
              ]}
              color="bg-blue-500"
            />
          </div>
        </div>
      </section>
      
      {/* Pro Upgrade Teaser */}
      <section className="py-16 bg-brand-darkBlue text-white">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Unlock Advanced Insights with Pro</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Get deeper analysis, historical data tracking, and competitive benchmarking with our premium features
          </p>
          <Button asChild variant="secondary" size="lg" className="bg-white text-brand-darkBlue hover:bg-gray-100">
            <Link to="/pricing">
              See Pro Features <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
