
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { TokenInput } from "@/components/TokenInput";
import { RecentScans } from "@/components/RecentScans";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Shield, Zap, Loader2, History, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CryptoTrivia } from "@/components/CryptoTrivia";

interface LastScan {
  id: string;
  token_id: string;
  token_name: string;
  token_symbol: string;
  created_at: string;
  health_score: number | null;
  metadata: {
    image?: string;
    blockchain?: string;
    description?: string;
  };
}

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const { status } = useSubscription();
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get("token");
  const navigate = useNavigate();
  const [lastScan, setLastScan] = useState<LastScan | null>(null);
  const [isLoadingLastScan, setIsLoadingLastScan] = useState(false);

  // Effect to redirect to scan page if token is present
  useEffect(() => {
    if (tokenParam && !isLoading) {
      navigate(`/scan?token=${encodeURIComponent(tokenParam)}`);
    }
  }, [tokenParam, isLoading, navigate]);

  // Fetch last scan
  useEffect(() => {
    const fetchLastScan = async () => {
      if (!user) return;
      
      try {
        setIsLoadingLastScan(true);
        
        const { data, error } = await supabase
          .from('token_scans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
          console.error('Error fetching last scan:', error);
        } else if (data) {
          setLastScan(data);
        }
      } catch (err) {
        console.error('Error in last scan fetch:', err);
      } finally {
        setIsLoadingLastScan(false);
      }
    };
    
    fetchLastScan();
  }, [user]);

  // Redirect to auth page if not authenticated
  if (!isLoading && !user) {
    return <Navigate to="/auth" />;
  }

  const isPro = status.tier === "Pro Monthly" || status.tier === "Pro Annual";

  // Helper function to truncate description
  const truncateDescription = (description: string, maxLength: number = 150) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Your Dashboard</h1>
              <p className="text-gray-600">
                Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}!
              </p>
            </header>
            
            {status.loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-brand-purple mb-4" />
                <p>Loading your subscription data...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Subscription Status Card */}
                <Card className="bg-white overflow-hidden">
                  <CardHeader className={`${isPro ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-gray-100'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center">
                          {isPro ? (
                            <Shield className="mr-2 h-5 w-5" />
                          ) : null}
                          {status.tier} Plan
                        </CardTitle>
                        <CardDescription className={isPro ? 'text-gray-100' : 'text-gray-500'}>
                          {isPro ? 'Full access to all pro features' : 'Basic access with limited features'}
                        </CardDescription>
                      </div>
                      <Link to="/subscription">
                        <Button 
                          variant={isPro ? "outline" : "default"} 
                          className={isPro ? "text-white border-white hover:bg-white/20" : ""}
                        >
                          {isPro ? 'Manage Plan' : 'Upgrade to Pro'}
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">Daily Scan Limit</h3>
                        <p className="text-gray-500 text-sm">Resets every 24 hours</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{status.scanCount} / {status.scanLimit}</p>
                        <p className="text-xs text-gray-500">Scans used today</p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div className="bg-brand-purple h-2.5 rounded-full" 
                          style={{ width: `${(status.scanCount / status.scanLimit) * 100}%` }}>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Last Scan Card */}
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <CardTitle className="flex items-center">
                      <History className="mr-2 h-5 w-5" />
                      Last Token Scan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isLoadingLastScan ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-brand-purple" />
                      </div>
                    ) : lastScan ? (
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-800 overflow-hidden flex-shrink-0">
                            {lastScan.metadata?.image ? (
                              <img 
                                src={lastScan.metadata.image} 
                                alt={lastScan.token_symbol} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              `$${lastScan.token_symbol.substring(0, 4)}`
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h2 className="text-xl font-bold">{lastScan.token_name} ({lastScan.token_symbol})</h2>
                              {lastScan.health_score ? (
                                <Badge className={lastScan.health_score >= 80 ? "bg-green-500 text-white" : 
                                  lastScan.health_score >= 60 ? "bg-yellow-500 text-white" : "bg-red-500 text-white"}>
                                  {lastScan.health_score}/100
                                </Badge>
                              ) : null}
                            </div>
                            {lastScan.metadata?.blockchain && (
                              <div className="mb-2">
                                <span className="text-sm bg-gray-100 rounded px-2 py-1 inline-block">
                                  {lastScan.metadata.blockchain}
                                </span>
                              </div>
                            )}
                            {lastScan.metadata?.description && (
                              <p className="text-gray-600 text-sm mb-3">
                                {truncateDescription(lastScan.metadata.description)}
                              </p>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Scanned on {new Date(lastScan.created_at).toLocaleDateString()}</span>
                              <Button asChild>
                                <Link to={`/scan?token=${lastScan.token_id}`}>View Full Results</Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500 mb-4">You haven't performed any token scans yet.</p>
                        <Button asChild>
                          <Link to="/token-search">Scan Your First Token</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* New Scan Section */}
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <CardTitle className="flex items-center">
                      <Search className="mr-2 h-5 w-5" />
                      Scan a Token
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <TokenInput />
                  </CardContent>
                </Card>
                
                {/* Recent Scans Section */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <History className="mr-2 h-5 w-5" />
                    Recent Scans
                  </h2>
                  <RecentScans userId={user?.id} limit={5} />
                </div>
                
                {/* Pro Features Teaser */}
                {!isPro && (
                  <Card className="bg-gray-100 border-0">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Upgrade to Pro for More Features</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                          <div>
                            <p className="font-medium">More Daily Scans</p>
                            <p className="text-sm text-gray-600">Run 5 pro scans per day instead of 3 basic scans</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                          <div>
                            <p className="font-medium">Detailed Token Analysis</p>
                            <p className="text-sm text-gray-600">Get deeper insights into tokenomics and risks</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                          <div>
                            <p className="font-medium">Advanced Security Checks</p>
                            <p className="text-sm text-gray-600">Detailed contract audit and security alerts</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Zap className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                          <div>
                            <p className="font-medium">Early Access to New Features</p>
                            <p className="text-sm text-gray-600">Be the first to try new analysis tools</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-center">
                        <Button className="px-8" asChild>
                          <Link to="/subscription">See Pro Plans</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Crypto Trivia */}
                <div className="mt-8">
                  <CryptoTrivia />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
