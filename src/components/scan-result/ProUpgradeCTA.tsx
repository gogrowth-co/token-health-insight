
import { Button } from "@/components/ui/button";

export const ProUpgradeCTA = () => {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          <h3 className="text-xl font-bold mb-2">Unlock Advanced Analytics</h3>
          <p>Get deep tokenomics breakdowns, video walkthroughs, and expert insights.</p>
        </div>
        <Button className="bg-white text-indigo-600 hover:bg-gray-100">Upgrade to Pro →</Button>
      </div>
    </div>
  );
};
