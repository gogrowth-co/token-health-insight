
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SourceLogoProps {
  name: string;
  tooltip: string;
}

const SourceLogo = ({ name, tooltip }: SourceLogoProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="h-12 flex items-center justify-center bg-white rounded-md p-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-gray-800 font-semibold">{name}</div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const TrustedSourcesSection = () => {
  const sources = [
    {
      name: "CoinGecko",
      tooltip: "Market data and token information provider"
    },
    {
      name: "GeckoTerminal",
      tooltip: "Advanced analytics for DEX trading data"
    },
    {
      name: "Etherscan",
      tooltip: "Blockchain explorer and analytics platform"
    },
    {
      name: "DeFiLlama",
      tooltip: "DeFi TVL and protocol analytics aggregator"
    },
    {
      name: "GitHub",
      tooltip: "Development activity and code repository metrics"
    },
    {
      name: "GoPlus",
      tooltip: "Smart contract security analysis"
    },
    {
      name: "X/Twitter",
      tooltip: "Social sentiment and engagement metrics"
    }
  ];

  return (
    <section className="py-16 px-4 bg-gray-50" id="trusted-sources">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-4">Powered by Trusted Sources</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-8">
          {sources.map((source, index) => (
            <SourceLogo key={index} name={source.name} tooltip={source.tooltip} />
          ))}
        </div>
        
        <p className="text-center text-gray-600 mt-8">
          We aggregate and score public data — updated every minute.
        </p>
      </div>
    </section>
  );
};
