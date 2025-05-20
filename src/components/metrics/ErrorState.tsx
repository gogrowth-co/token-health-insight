
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  error: Error;
  isConnectionError?: boolean;
  refetch?: () => Promise<void>;
  title?: string;  // We're adding the title property
}

export const ErrorState = ({ error, isConnectionError, refetch, title }: ErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-md bg-red-50 border border-red-200">
      <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
      <h3 className="text-lg font-semibold text-red-700 mb-1">{title || "Error"}</h3>
      <p className="text-sm text-red-600 mb-2">
        {isConnectionError
          ? "Could not connect to server. Please check your internet connection."
          : error.message || "An unexpected error occurred."}
      </p>
      {refetch && (
        <Button variant="outline" size="sm" onClick={refetch}>
          Retry
        </Button>
      )}
    </div>
  );
};
