import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "../../utils/cn";

interface AutoDetectBadgeProps {
  label: string;
  value: ReactNode;
  className?: string;
}

/** Small chip showing an auto-detected field, e.g. "Day 4". */
export function AutoDetectBadge({
  label,
  value,
  className,
}: AutoDetectBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700",
        className,
      )}
    >
      <Sparkles size={12} />
      <span className="text-indigo-400">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

export default AutoDetectBadge;
