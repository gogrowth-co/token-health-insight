
import { Badge } from "@/components/ui/badge";
import { HealthScoreCard } from "@/components/HealthScoreCard";

interface TokenHeaderProps {
  tokenName: string;
  tokenSymbol: string;
  healthScore: number;
}

export const TokenHeader = ({ tokenName, tokenSymbol, healthScore }: TokenHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{tokenName}</h1>
        <Badge variant="outline" className="text-sm font-medium">
          ${tokenSymbol}
        </Badge>
      </div>
      <HealthScoreCard score={healthScore} />
    </div>
  );
};
