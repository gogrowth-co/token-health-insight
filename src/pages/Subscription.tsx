
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSearchParams, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, Loader2, Clock, Shield, Zap, ArrowUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Subscription = () => {
  const { user, isLoading } = useAuth();
  const { status, refreshStatus, createCheckout, openCustomerPortal } = useSubscription();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const checkoutStatus = searchParams.get("status");

  // Show success/error message if redirected from checkout
  useEffect(() => {
    if (checkoutStatus === "success") {
      toast({
        title: "Subscription updated",
        description: "Thank you for your subscription! Your account has been updated.",
        variant: "default",
      });
      refreshStatus();
    } else if (checkoutStatus === "canceled") {
      toast({
        title: "Checkout canceled",
        description: "Your subscription checkout was canceled. No charges were made.",
        variant: "default",
      });
    }
  }, [checkoutStatus]);

  // Handle subscription checkout
  const handleCheckout = async (plan: 'monthly' | 'annual') => {
    setLoading({ ...loading, [plan]: true });
    try {
      const checkoutUrl = await createCheckout(plan);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } finally {
      setLoading({ ...loading, [plan]: false });
    }
  };

  // Handle customer portal for managing subscription
  const handleManageSubscription = async () => {
    setLoading({ ...loading, manage: true });
    try {
      await openCustomerPortal();
    } finally {
      setLoading({ ...loading, manage: false });
    }
  };

  // Format the subscription end date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Redirect to auth page if not authenticated
  if (!isLoading && !user) {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Pricing</h1>
              <p className="text-gray-600">
                Choose the right plan for your token health analysis needs
              </p>
            </header>
            
            {status.loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Current Subscription Status */}
                <Card className="border-2 border-brand-purple shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="mr-2 h-5 w-5 text-brand-purple" />
                      Current Plan: {status.tier || "Free"}
                    </CardTitle>
                    <CardDescription>
                      {status.subscribed ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle2 className="mr-1 h-4 w-4" /> Active subscription
                        </span>
                      ) : (
                        <span>Free tier with limited access</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Daily Scan Limit:</span>
                      <span className="font-medium">{status.scanLimit} scans</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Scans Used Today:</span>
                      <span className="font-medium">{status.scanCount} / {status.scanLimit}</span>
                    </div>
                    {status.endDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Renews On:</span>
                        <span className="font-medium flex items-center">
                          <Clock className="mr-1 h-4 w-4 text-gray-400" />
                          {formatDate(status.endDate)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    {status.subscribed ? (
                      <Button
                        onClick={handleManageSubscription}
                        variant="outline"
                        className="w-full"
                        disabled={loading.manage}
                      >
                        {loading.manage ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Manage Subscription
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Upgrade to a Pro plan to access more features and higher scan limits
                      </p>
                    )}
                  </CardFooter>
                </Card>

                {/* Subscription Plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Free Tier */}
                  <Card className={`border ${status.tier === "Free" ? 'border-2 border-brand-purple' : ''}`}>
                    <CardHeader>
                      <CardTitle>Free</CardTitle>
                      <CardDescription>Basic token scan access</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-3xl font-bold">$0<span className="text-sm font-normal text-gray-500">/forever</span></div>
                      
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <CheckCircle2 className="mr-2 h-5 w-5 text-green-500 shrink-0" />
                          <span>Limited to 3 token scans per day</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle2 className="mr-2 h-5 w-5 text-green-500 shrink-0" />
                          <span>Basic token metrics</span>
                        </li>
                        <li className="flex items-start text-gray-400">
                          <XCircle className="mr-2 h-5 w-5 shrink-0" />
                          <span>Detailed token analysis</span>
                        </li>
                        <li className="flex items-start text-gray-400">
                          <XCircle className="mr-2 h-5 w-5 shrink-0" />
                          <span>Tokenomics breakdown</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      {status.tier === "Free" ? (
                        <Button disabled className="w-full">Current Plan</Button>
                      ) : (
                        <Button variant="outline" className="w-full" onClick={handleManageSubscription}>
                          Downgrade
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                  
                  {/* Pro Monthly */}
                  <Card className={`border ${status.tier === "Pro Monthly" ? 'border-2 border-brand-purple' : ''}`}>
                    <CardHeader>
                      <CardTitle>Pro Monthly</CardTitle>
                      <CardDescription>Full access with monthly billing</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-3xl font-bold">$20<span className="text-sm font-normal text-gray-500">/month</span></div>
                      
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <CheckCircle2 className="mr-2 h-5 w-5 text-green-500 shrink-0" />
                          <span>5 pro scans per day</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle2 className="mr-2 h-5 w-5 text-green-500 shrink-0" />
                          <span>Detailed token analysis</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle2 className="mr-2 h-5 w-5 text-green-500 shrink-0" />
                          <span>Full tokenomics breakdown</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle2 className="mr-2 h-5 w-5 text-green-500 shrink-0" />
                          <span>Priority support</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      {status.tier === "Pro Monthly" ? (
                        <Button disabled className="w-full">Current Plan</Button>
                      ) : (
                        <Button 
                          onClick={() => handleCheckout('monthly')} 
                          className="w-full"
                          disabled={loading.monthly}
                        >
                          {loading.monthly && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {status.tier === "Pro Annual" ? "Switch to Monthly" : "Upgrade Now"}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                  
                  {/* Pro Annual */}
                  <Card className={`border ${status.tier === "Pro Annual" ? 'border-2 border-brand-purple' : ''} relative overflow-hidden`}>
                    <div className="absolute -right-12 top-7 bg-green-500 text-white px-12 py-1 rotate-45">
                      50% OFF
                    </div>
                    <CardHeader>
                      <CardTitle>Pro Annual</CardTitle>
                      <CardDescription>Founder's special offer</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-3xl font-bold">
                        $120<span className="text-sm font-normal text-gray-500">/year</span>
                        <div className="text-sm text-green-500 font-normal">$10/month (billed annually)</div>
                      </div>
                      
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <CheckCircle2 className="mr-2 h-5 w-5 text-green-500 shrink-0" />
                          <span>5 pro scans per day</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle2 className="mr-2 h-5 w-5 text-green-500 shrink-0" />
                          <span>Detailed token analysis</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle2 className="mr-2 h-5 w-5 text-green-500 shrink-0" />
                          <span>Full tokenomics breakdown</span>
                        </li>
                        <li className="flex items-start">
                          <Zap className="mr-2 h-5 w-5 text-amber-500 shrink-0" />
                          <span className="font-medium">Early access to new features</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      {status.tier === "Pro Annual" ? (
                        <Button disabled className="w-full">Current Plan</Button>
                      ) : (
                        <Button 
                          onClick={() => handleCheckout('annual')} 
                          className="w-full"
                          variant="default"
                          disabled={loading.annual}
                        >
                          {loading.annual && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {status.tier === "Pro Monthly" ? "Switch to Annual" : "Best Value"}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </div>
                
                {/* FAQ Section */}
                <div className="mt-12">
                  <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-md shadow-sm">
                      <h3 className="font-medium">Can I cancel my subscription anytime?</h3>
                      <p className="text-gray-600 mt-1">Yes, you can cancel at any time from your account dashboard. Your benefits will continue until the end of your billing period.</p>
                    </div>
                    <div className="p-4 bg-white rounded-md shadow-sm">
                      <h3 className="font-medium">Will I be charged automatically?</h3>
                      <p className="text-gray-600 mt-1">Yes, subscriptions auto-renew at the end of each billing cycle. You'll receive an email reminder before any charge.</p>
                    </div>
                    <div className="p-4 bg-white rounded-md shadow-sm">
                      <h3 className="font-medium">Do you offer refunds?</h3>
                      <p className="text-gray-600 mt-1">We offer a 7-day money back guarantee. Contact our support team if you're not satisfied with your subscription.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Fixed CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-brand-purple text-white py-4 shadow-lg z-50">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between">
          <div className="mb-3 sm:mb-0">
            <h3 className="text-lg font-medium">Ready to unlock the full power of Token Health Scan?</h3>
            <p className="text-sm text-white/80">Get deeper insights and higher scan limits</p>
          </div>
          <Button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            variant="outline" 
            className="bg-white text-brand-purple hover:bg-white/90 border-none"
          >
            Upgrade Now <ArrowUp className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Subscription;
