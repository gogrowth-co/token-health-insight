
import { AlertTriangle, Wifi, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ErrorStateProps {
  connectionError: boolean;
  onRetry: () => Promise<void>;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ connectionError, onRetry }) => {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center">
        {connectionError ? (
          <>
            <Wifi className="mr-2 h-4 w-4" />
            Connection Error
          </>
        ) : (
          <>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Data Fetch Error
          </>
        )}
      </AlertTitle>
      <AlertDescription className="flex flex-col space-y-2">
        <p>
          {connectionError 
            ? "We're having trouble connecting to our servers. Please check your internet connection." 
            : "We're having trouble loading some metrics data. This might be due to API rate limits or temporary service issues."}
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="self-start flex items-center gap-1"
          onClick={() => onRetry()} 
        >
          <RefreshCw className="h-4 w-4 mr-1" /> 
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  );
};
