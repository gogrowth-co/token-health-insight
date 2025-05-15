
import React from "react";
import { Search, ShieldAlert, ChartBar } from "lucide-react";

interface ProcessStepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ProcessStep = ({ number, title, description, icon }: ProcessStepProps) => (
  <div className="flex flex-col items-center text-center">
    <div className="bg-brand-purple bg-opacity-10 rounded-full p-4 mb-4">
      {icon}
    </div>
    <div className="bg-brand-purple text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-3">
      {number}
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export const ScoringProcessSection = () => {
  return (
    <section className="py-16 px-4 bg-white" id="scoring-process">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-4">How the Score Works</h2>
        <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
          Our three-step process delivers accurate, actionable insights
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <ProcessStep 
            number={1}
            title="Pull Trusted Data"
            description="We gather data from 7+ established sources covering both on-chain and off-chain metrics"
            icon={<Search className="h-8 w-8 text-brand-purple" />}
          />
          <ProcessStep 
            number={2}
            title="Run Safety Checks"
            description="Our algorithms analyze security, liquidity, community engagement and development activity"
            icon={<ShieldAlert className="h-8 w-8 text-brand-purple" />} 
          />
          <ProcessStep 
            number={3}
            title="Score By Category"
            description="Results are compiled into actionable scores and insights across key risk categories"
            icon={<ChartBar className="h-8 w-8 text-brand-purple" />}
          />
        </div>
      </div>
    </section>
  );
};
