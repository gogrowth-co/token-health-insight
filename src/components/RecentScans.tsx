
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TokenScanHistoryItem } from "@/api/types";

interface RecentScansProps {
  userId?: string;
  limit?: number;
}

export const RecentScans = ({ userId, limit = 5 }: RecentScansProps) => {
  const [recentScans, setRecentScans] = useState<TokenScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRecentScans = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('token_scans')
          .select('id, token_id, token_symbol, token_name, created_at, health_score')
          .order('created_at', { ascending: false })
          .limit(limit);
          
        // If userId is provided, get only that user's scans
        if (userId) {
          query = query.eq('user_id', userId);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        // Transform the data to match our component's expected format
        const formattedScans: TokenScanHistoryItem[] = data.map(scan => ({
          id: scan.id,
          token: scan.token_symbol,
          projectName: scan.token_name || scan.token_symbol,
          scanDate: scan.created_at,
          healthScore: scan.health_score || 0
        }));
        
        setRecentScans(formattedScans);
      } catch (error) {
        console.error("Error fetching recent scans:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentScans();
  }, [userId, limit]);
  
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Loading recent scans...</p>
        </CardContent>
      </Card>
    );
  }

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
