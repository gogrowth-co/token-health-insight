
import { WifiOff, ServerCrash } from "lucide-react";

interface ErrorStateProps {
  connectionError: boolean;
  onRetry: () => void;
}

export const ErrorState = ({ connectionError, onRetry }: ErrorStateProps) => {
  if (connectionError) {
    return (
      <div className="col-span-full bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex items-center gap-2">
        <WifiOff className="text-amber-500" size={20} />
        <div className="text-sm text-amber-700">
          Unable to connect to our servers. Please check your internet connection.
          <button 
            onClick={onRetry} 
            className="ml-2 underline text-indigo-600 hover:text-indigo-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-2">
      <ServerCrash className="text-red-500" size={20} />
      <div className="text-sm text-red-700">
        Error loading metrics. Some data may be unavailable.
        <button 
          onClick={onRetry} 
          className="ml-2 underline text-indigo-600 hover:text-indigo-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
};
