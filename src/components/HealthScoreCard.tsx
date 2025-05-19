
import { CircleHelp } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HealthScoreCardProps {
  score: number;
}

export const HealthScoreCard = ({ score }: HealthScoreCardProps) => {
  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreText = () => {
    if (score >= 80) return "Healthy";
    if (score >= 60) return "Moderate";
    return "At Risk";
  };

  // Ensure the score is rounded to a whole number
  const displayScore = Math.round(score);

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-center">
        <div className={`rounded-full ${getScoreColor()} text-white font-bold px-4 py-2 flex items-center justify-center`}>
          <span className="text-xl">{displayScore}</span>
          <span className="text-sm">/100</span>
        </div>
        <span className="text-xs text-gray-600 mt-1">Health Score</span>
      </div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-gray-400 hover:text-gray-600">
              <CircleHelp size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-sm">
              The Health Score is calculated based on security, liquidity, tokenomics, 
              community, and development metrics. A higher score indicates a healthier project.
              <br /><br />
              Score Rating:<br />
              80-100: Healthy<br />
              60-79: Moderate<br />
              0-59: At Risk
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
