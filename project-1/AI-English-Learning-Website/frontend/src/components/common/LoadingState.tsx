import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

/** Centered loading spinner with an optional message. */
export function LoadingState({
  message = "Loading…",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-4 py-10 text-center",
        className,
      )}
    >
      <Loader2 className="animate-spin text-indigo-500" size={28} />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

export default LoadingState;
