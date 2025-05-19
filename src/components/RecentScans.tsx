
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface ScanData {
  id: string;
  token_id: string;
  token_symbol: string;
  token_name: string;
  created_at: string;
  health_score: number | null;
  metadata: {
    image?: string;
    blockchain?: string;
  };
  category_scores?: any;
  token_address?: string;
  user_id?: string;
}

interface RecentScansProps {
  userId?: string;
  limit?: number;
}

export const RecentScans = ({ userId, limit = 5 }: RecentScansProps) => {
  const [recentScans, setRecentScans] = useState<ScanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentScans = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let query = supabase
          .from('token_scans')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        // If userId is provided, filter by user_id
        if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch recent scans: ${error.message}`);
        }

        // Transform the data to match ScanData type
        const transformedData: ScanData[] = data?.map(item => ({
          id: item.id,
          token_id: item.token_id,
          token_symbol: item.token_symbol,
          token_name: item.token_name || item.token_symbol,
          created_at: item.created_at,
          health_score: item.health_score,
          metadata: item.metadata as { image?: string; blockchain?: string } || {},
          category_scores: item.category_scores,
          token_address: item.token_address,
          user_id: item.user_id
        })) || [];

        setRecentScans(transformedData);
      } catch (err) {
        console.error('Error fetching recent scans:', err);
        setError('Failed to load recent scans');
      } finally {
        setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-6 w-16" />
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">{error}</p>
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
            <Link to={`/scan?token=${scan.token_id}`} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-800 overflow-hidden">
                  {scan.metadata?.image ? (
                    <img 
                      src={scan.metadata.image} 
                      alt={scan.token_symbol} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    `$${scan.token_symbol.substring(0, 4)}`
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{scan.token_name}</h3>
                  <p className="text-sm text-gray-500">
                    Scanned {formatDate(scan.created_at)}
                    {scan.metadata?.blockchain && (
                      <span className="ml-2 text-xs bg-gray-100 rounded px-1 py-0.5">
                        {scan.metadata.blockchain}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {scan.health_score ? (
                  <Badge className={getScoreColor(scan.health_score)}>
                    {scan.health_score}/100
                  </Badge>
                ) : (
                  <Badge variant="outline">No Score</Badge>
                )}
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
