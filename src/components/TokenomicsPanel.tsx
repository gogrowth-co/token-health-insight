import React from "react";
import { LineChart } from "lucide-react";
import { TokenTokenomicsData } from "@/hooks/useTokenTokenomics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Skeleton } from "./ui/skeleton";

interface TokenomicsPanelProps {
  tokenomicsData: TokenTokenomicsData | null;
  isLoading?: boolean;
  tokenomicsScore?: number;
}

export const TokenomicsPanel: React.FC<TokenomicsPanelProps> = ({
  tokenomicsData,
  isLoading = false,
  tokenomicsScore = 0
}) => {
  // Format percentages for display
  const formatPercent = (value: number | null): string => {
    if (value === null) return "Unknown";
    return `${value.toFixed(2)}%`;
  };
  
  // Determine risk level based on top holder concentration
  const getConcentrationRisk = (percent: number | null): { label: string; variant: "success" | "warning" | "danger" | "default" } => {
    if (percent === null) return { label: "Unknown", variant: "default" };
    if (percent < 15) return { label: "Low", variant: "success" };
    if (percent < 30) return { label: "Medium", variant: "warning" };
    return { label: "High", variant: "danger" };
  };
  
  // Get top holder risk assessment
  const topHolderRisk = tokenomicsData?.topHolderPct 
    ? getConcentrationRisk(tokenomicsData.topHolderPct)
    : { label: "Unknown", variant: "default" };
  
  // Get top 5 holders risk assessment
  const top5HoldersRisk = tokenomicsData?.top5HoldersPct 
    ? getConcentrationRisk(tokenomicsData.top5HoldersPct / 2) // Adjusted threshold for multiple holders
    : { label: "Unknown", variant: "default" };

  return (
    <div className="space-y-8">
      {/* Tokenomics Score */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg flex items-center">
                <LineChart className="h-5 w-5 mr-2 text-indigo-500" />
                Tokenomics Score
              </CardTitle>
              <CardDescription>
                Based on token distribution, holders, and tax analysis
              </CardDescription>
            </div>
            <Badge 
              variant={tokenomicsScore >= 70 ? "success" : tokenomicsScore >= 40 ? "warning" : "destructive"}
              className="text-lg px-3 py-1"
            >
              {tokenomicsScore}/100
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress 
            value={tokenomicsScore} 
            className={`h-2 ${
              tokenomicsScore >= 70 ? 'bg-green-100' : 
              tokenomicsScore >= 40 ? 'bg-amber-100' : 
              'bg-red-100'
            }`}
          />
          <div className="mt-2 text-sm text-gray-500">
            {tokenomicsScore >= 70 ? 'Well-distributed token with fair tokenomics' : 
             tokenomicsScore >= 40 ? 'Some centralization concerns in token distribution' : 
             'High risk tokenomics with centralized distribution'}
          </div>
        </CardContent>
      </Card>
      
      {/* Holder Distribution */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Holder Distribution</CardTitle>
          <CardDescription>Token concentration and holder demographics</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium mb-1">Total Holders</p>
                  <p className="text-2xl font-bold">{tokenomicsData?.holdersCount?.toLocaleString() || "Unknown"}</p>
                  <p className="text-xs text-gray-500 mt-1">Number of unique addresses holding this token</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Total Supply</p>
                  <p className="text-2xl font-bold">
                    {tokenomicsData?.totalSupply 
                      ? (tokenomicsData.totalSupply > 1000000 
                          ? `${(tokenomicsData.totalSupply / 1000000).toFixed(2)}M` 
                          : tokenomicsData.totalSupply.toLocaleString())
                      : "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total tokens in circulation</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">Top Holder Concentration</p>
                    <Badge variant={topHolderRisk.variant}>{topHolderRisk.label} Risk</Badge>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        topHolderRisk.variant === "success" ? "bg-green-500" :
                        topHolderRisk.variant === "warning" ? "bg-amber-500" : 
                        topHolderRisk.variant === "danger" ? "bg-red-500" : "bg-gray-400"
                      }`} 
                      style={{ width: `${tokenomicsData?.topHolderPct || 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Largest wallet holds {formatPercent(tokenomicsData?.topHolderPct || null)} of supply
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">Top 5 Holders Concentration</p>
                    <Badge variant={top5HoldersRisk.variant}>{top5HoldersRisk.label} Risk</Badge>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        top5HoldersRisk.variant === "success" ? "bg-green-500" :
                        top5HoldersRisk.variant === "warning" ? "bg-amber-500" : 
                        top5HoldersRisk.variant === "danger" ? "bg-red-500" : "bg-gray-400"
                      }`} 
                      style={{ width: `${tokenomicsData?.top5HoldersPct || 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Top 5 wallets hold {formatPercent(tokenomicsData?.top5HoldersPct || null)} of supply
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Token Economics */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Token Economics</CardTitle>
          <CardDescription>Taxes and supply mechanics</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border rounded-md p-4">
                  <p className="text-sm font-medium text-gray-500">Buy Tax</p>
                  <p className="text-2xl font-bold">{tokenomicsData?.buyTax || 0}%</p>
                  {tokenomicsData?.buyTax ? (
                    tokenomicsData.buyTax > 5 ? (
                      <Badge variant="destructive" className="mt-1">High</Badge>
                    ) : tokenomicsData.buyTax > 1 ? (
                      <Badge variant="warning" className="mt-1">Medium</Badge>
                    ) : (
                      <Badge variant="success" className="mt-1">Low</Badge>
                    )
                  ) : null}
                </div>
                <div className="border rounded-md p-4">
                  <p className="text-sm font-medium text-gray-500">Sell Tax</p>
                  <p className="text-2xl font-bold">{tokenomicsData?.sellTax || 0}%</p>
                  {tokenomicsData?.sellTax ? (
                    tokenomicsData.sellTax > 5 ? (
                      <Badge variant="destructive" className="mt-1">High</Badge>
                    ) : tokenomicsData.sellTax > 1 ? (
                      <Badge variant="warning" className="mt-1">Medium</Badge>
                    ) : (
                      <Badge variant="success" className="mt-1">Low</Badge>
                    )
                  ) : null}
                </div>
                <div className="border rounded-md p-4">
                  <p className="text-sm font-medium text-gray-500">Mintable</p>
                  <p className="text-2xl font-bold">{tokenomicsData?.isMintable ? "Yes" : "No"}</p>
                  {tokenomicsData?.isMintable ? (
                    <Badge variant="destructive" className="mt-1">Supply Risk</Badge>
                  ) : (
                    <Badge variant="success" className="mt-1">Fixed Supply</Badge>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-gray-500 pt-2 border-t">
                <h4 className="font-medium mb-1">What This Means</h4>
                <ul className="list-disc list-inside space-y-1">
                  {tokenomicsData?.isMintable && (
                    <li>This token can have its supply increased by the contract owner</li>
                  )}
                  {(tokenomicsData?.buyTax || 0) + (tokenomicsData?.sellTax || 0) > 10 && (
                    <li>High combined taxes may impact trading liquidity and profitability</li>
                  )}
                  {tokenomicsData?.topHolderPct && tokenomicsData.topHolderPct > 20 && (
                    <li>High whale concentration increases price volatility risk</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
