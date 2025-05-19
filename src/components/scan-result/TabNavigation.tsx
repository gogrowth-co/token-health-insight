
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabNavigationProps {
  activeTab: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export const TabNavigation = ({ activeTab, onValueChange, className }: TabNavigationProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onValueChange} className={className}>
      <TabsList className="w-full sm:w-auto overflow-x-auto">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
        <TabsTrigger value="tokenomics">Tokenomics</TabsTrigger>
        <TabsTrigger value="community">Community</TabsTrigger>
        <TabsTrigger value="development">Development</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
