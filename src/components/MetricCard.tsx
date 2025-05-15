
import { ReactNode } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  icon: ReactNode;
  description: string;
  metrics: string[];
  color: string;
}

export const MetricCard = ({ title, icon, description, metrics, color }: MetricCardProps) => {
  return (
    <Card className="overflow-hidden card-gradient transition-all duration-300 hover:shadow-md">
      <CardHeader className="space-y-1 pb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm">{description}</p>
        <ul className="mt-4 space-y-2">
          {metrics.map((metric, index) => (
            <li key={index} className="flex items-center space-x-2 text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-purple"></span>
              <span>{metric}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="pt-2 text-xs text-gray-500">
        {title === "Security" ? "Basic + Pro metrics" : "Basic metrics shown"}
      </CardFooter>
    </Card>
  );
};
