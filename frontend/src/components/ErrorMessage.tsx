import { Button } from "@/components/ui/button";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div
      className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive"
      role="alert"
    >
      <p className="font-medium">Something went wrong</p>
      <p className="mt-1 text-sm">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 border-destructive/50 text-destructive hover:bg-destructive/20"
          onClick={onRetry}
        >
          Try again
        </Button>
      )}
    </div>
  );
}
