
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface ReportCardProps {
  title: string;
  value: string;
  status: "success" | "warning" | "error" | "neutral";
  className?: string;
}

const ReportCard = ({ title, value, status, className }: ReportCardProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <span className="text-green-500">✓</span>;
      case "warning":
        return <span className="text-amber-500">⚠️</span>;
      case "error":
        return <span className="text-red-500">❌</span>;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "border-green-100 bg-green-50";
      case "warning":
        return "border-amber-100 bg-amber-50";
      case "error":
        return "border-red-100 bg-red-50";
      default:
        return "border-gray-100 bg-gray-50";
    }
  };

  return (
    <Card className={`overflow-hidden ${getStatusColor()} ${className}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          <div>{getStatusIcon()}</div>
        </div>
        <div className="text-xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};

export const SampleReportSection = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <section className="py-16 px-4 bg-white" id="sample-report">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-4">What You'll See</h2>
        <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
          A comprehensive breakdown of key health metrics for any token
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto blur-sm hover:blur-none transition-all duration-300">
          <ReportCard title="Security Score" value="65/100" status="warning" />
          <ReportCard title="Liquidity Locked" value="Unlocked" status="error" />
          <ReportCard title="Community Growth" value="-12%" status="error" />
          <ReportCard title="GitHub" value="Stale" status="error" />
          <ReportCard title="Top Holders" value="89.1%" status="warning" />
          <ReportCard title="Health Score" value="63/100" status="warning" />
        </div>
        
        <div className="text-center mt-12">
          <Button onClick={scrollToTop} size="lg" className="gap-2">
            Start Scan <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
