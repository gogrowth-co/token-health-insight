
import { ReactNode } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryCardProps {
  title: string;
  icon: ReactNode;
  description: string;
  metrics: string[];
  color: string;
  score: number;
  onViewDetails: () => void;
}

export const CategoryCard = ({ 
  title, 
  icon, 
  description, 
  metrics = [], 
  color, 
  score, 
  onViewDetails 
}: CategoryCardProps) => {
  return (
    <Card className="overflow-hidden card-gradient transition-all duration-300 hover:shadow-md">
      <CardHeader className="space-y-1 pb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <div className="text-sm font-medium px-2 py-0.5 rounded-full bg-gray-100">
            {score}/100
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm">{description}</p>
        <ul className="mt-4 space-y-2">
          {metrics && metrics.map((metric, index) => (
            <li key={index} className="flex items-center space-x-2 text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-purple"></span>
              <span>{metric}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="pt-2 text-xs text-gray-500">
        <button 
          onClick={onViewDetails}
          className="text-brand-purple hover:underline hover:text-brand-purple/90"
        >
          View detailed analysis →
        </button>
      </CardFooter>
    </Card>
  );
};
