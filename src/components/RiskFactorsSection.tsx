
import React from "react";
import { ShieldAlert, Users, FileX, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RiskFactorProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  tooltipText: string;
}

const RiskFactor = ({ icon, title, description, tooltipText }: RiskFactorProps) => (
  <TooltipProvider>
    <div className="p-6 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="p-2 bg-red-50 text-red-500 rounded-lg">{icon}</div>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-1">{title}</h3>
          <p className="text-gray-600 text-sm">{description}</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="inline-flex items-center mt-2 text-xs text-gray-500 hover:text-gray-700">
                <Info className="h-3 w-3 mr-1" /> Learn more
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  </TooltipProvider>
);

export const RiskFactorsSection = () => {
  const riskFactors = [
    {
      icon: <ShieldAlert className="h-6 w-6" />,
      title: "Ownership not renounced",
      description: "Team can rug",
      tooltipText: "When contract ownership isn't renounced, the team can make changes that might harm investors, including stealing all funds."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Top 10 wallets hold 90%",
      description: "High manipulation risk",
      tooltipText: "Concentration of tokens in few wallets means those holders can coordinate to manipulate prices and dump on smaller investors."
    },
    {
      icon: <Info className="h-6 w-6" />,
      title: "Token launched yesterday",
      description: "No history",
      tooltipText: "New tokens with minimal history are higher risk since there isn't enough data to establish patterns or trustworthiness."
    },
    {
      icon: <FileX className="h-6 w-6" />,
      title: "No GitHub commits",
      description: "Dead project",
      tooltipText: "Lack of active development suggests the project may be abandoned or was never intended for long-term growth."
    }
  ];

  return (
    <section className="py-16 px-4 bg-gray-50" id="risk-factors">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-4">Why DYOR Isn't Enough</h2>
        <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
          Even experienced investors miss these critical red flags
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {riskFactors.map((factor, index) => (
            <RiskFactor
              key={index}
              icon={factor.icon}
              title={factor.title}
              description={factor.description}
              tooltipText={factor.tooltipText}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
