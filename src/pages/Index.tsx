
import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TokenInput } from "@/components/TokenInput";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight } from "lucide-react";
import { RiskFactorsSection } from "@/components/RiskFactorsSection";
import { SampleReportSection } from "@/components/SampleReportSection";
import { TrustedSourcesSection } from "@/components/TrustedSourcesSection";
import { ScoringProcessSection } from "@/components/ScoringProcessSection";
import { FAQSection } from "@/components/FAQSection";
import { FinalCTASection } from "@/components/FinalCTASection";

const Index = () => {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-white to-gray-50 pt-20 pb-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12 max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Find Hidden Risks Before You Dive In
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Scan any project and uncover critical risks — from contract flaws to liquidity traps — in seconds.
              </p>
              
              <div className="max-w-xl mx-auto">
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
                  <div className="w-full">
                    <TokenInput />
                    <p className="text-sm text-gray-500 mt-3">
                      No wallet needed · Free to use
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        
        {/* Risk Factors Section */}
        <RiskFactorsSection />
        
        {/* Sample Report Section */}
        <SampleReportSection />
        
        {/* Trusted Sources Section */}
        <TrustedSourcesSection />
        
        {/* Scoring Process Section */}
        <ScoringProcessSection />
        
        {/* FAQ Section */}
        <FAQSection />
        
        {/* Final CTA Section */}
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
