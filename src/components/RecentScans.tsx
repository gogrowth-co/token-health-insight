
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

// Sample data for recent scans
// In a real app, this would come from a database
const sampleRecentScans = [
  {
    id: 1,
    token: "ZEN",
    projectName: "ZenoFi Protocol",
    scanDate: "2025-05-12T14:23:12Z",
    healthScore: 78,
  },
  {
    id: 2,
    token: "LUNA",
    projectName: "Luna Classic",
    scanDate: "2025-05-10T09:15:45Z",
    healthScore: 62,
  },
  {
    id: 3,
    token: "PEPE",
    projectName: "Pepe Token",
    scanDate: "2025-05-08T18:30:22Z",
    healthScore: 71,
  }
];

interface RecentScansProps {
  userId?: string;
  limit?: number;
}

export const RecentScans = ({ userId, limit = 5 }: RecentScansProps) => {
  // In a real app, we would fetch the recent scans from an API
  const recentScans = sampleRecentScans.slice(0, limit);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500 text-white";
    if (score >= 60) return "bg-yellow-500 text-white";
    return "bg-red-500 text-white";
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: 'numeric'
    }).format(date);
  };

  if (recentScans.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">You have no recent scans. Start by scanning a token above.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {recentScans.map((scan) => (
        <Card key={scan.id} className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <Link to={`/scan/${scan.token}`} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-800">
                  ${scan.token.substring(0, 4)}
                </div>
                <div>
                  <h3 className="font-medium">{scan.projectName}</h3>
                  <p className="text-sm text-gray-500">Scanned {formatDate(scan.scanDate)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className={getScoreColor(scan.healthScore)}>
                  {scan.healthScore}/100
                </Badge>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
