
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { TokenInput } from "@/components/TokenInput";
import { RecentScans } from "@/components/RecentScans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigate, useSearchParams, useNavigate, useEffect } from "react-router-dom";

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get("token");
  const navigate = useNavigate();

  // Effect to redirect to scan page if token is present
  useEffect(() => {
    if (tokenParam && !isLoading) {
      navigate(`/scan?token=${encodeURIComponent(tokenParam)}`);
    }
  }, [tokenParam, isLoading, navigate]);

  // Redirect to auth page if not authenticated
  if (!isLoading && !user) {
    return <Navigate to="/auth" />;
  }

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
            
            <div className="space-y-8">
              {/* New Scan Section */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <CardTitle>Scan a Token</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <TokenInput />
                </CardContent>
              </Card>
              
              {/* Recent Scans Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Recent Scans</h2>
                <RecentScans userId={user?.id} limit={5} />
              </div>
              
              {/* Pro Features Teaser */}
              <Card className="bg-gray-100 border-0">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Unlock Pro Features</h3>
                      <p className="text-gray-600">Get deeper insights, custom alerts, and priority scan queue.</p>
                    </div>
                    <button className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90 transition-colors">
                      See Pro Plans
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
