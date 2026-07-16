import type { ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import Button from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  action?: ReactNode;
}

/**
 * Friendly error block with an optional retry button. Use when a data load
 * fails so the app shows a calm message instead of breaking (golden rule:
 * the app must not fully break when something fails).
 */
export function ErrorState({
  title = "Something went wrong",
  message = "Please try again in a moment.",
  onRetry,
  action,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-3 rounded-full bg-rose-100 p-3 text-rose-500">
        <AlertCircle size={24} />
      </div>
      <h3 className="font-semibold text-slate-700">{title}</h3>
      {message && (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      )}
      {(action || onRetry) && (
        <div className="mt-4">
          {action ?? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCcw size={15} /> Try again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default ErrorState;
