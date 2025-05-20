
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";

interface ProUpgradeCTAProps {
  isBlurred?: boolean;
  freeScansRemaining?: number;
}

export const ProUpgradeCTA = ({ isBlurred = false, freeScansRemaining = 0 }: ProUpgradeCTAProps) => {
  if (!isBlurred) {
    // If not blurred, show a simple CTA card
    return (
      <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-none">
        <CardHeader>
          <CardTitle>Unlock More Token Scans</CardTitle>
          <CardDescription>
            You have {freeScansRemaining > 0 ? freeScansRemaining : 'no'} free scans remaining.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Upgrade to Pro for unlimited token scans, historical data tracking, and deeper analysis.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link to="/pricing">View Plans</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // If blurred, it's an overlay on blurred content
  return (
    <div className="relative w-full">
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg z-10">
        <div className="text-center p-6">
          <div className="mx-auto w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center mb-4">
            <Lock size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">Upgrade to View Details</h3>
          <p className="text-gray-600 mb-4 max-w-md">
            You've used all your free scans. Upgrade to Pro to unlock detailed metrics and unlimited scans.
          </p>
          <Button asChild>
            <Link to="/pricing">Upgrade Now</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
