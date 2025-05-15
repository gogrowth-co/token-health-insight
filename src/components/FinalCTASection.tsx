
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const FinalCTASection = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-r from-brand-purple/10 to-brand-teal/10">
      <div className="container mx-auto max-w-6xl text-center">
        <h2 className="text-4xl font-bold mb-6">Don't Guess. Scan It.</h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Find hidden risks before you invest. Free, fast, and no wallet required.
        </p>
        <Button onClick={scrollToTop} size="lg" className="gap-2">
          Start Scan <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
};
