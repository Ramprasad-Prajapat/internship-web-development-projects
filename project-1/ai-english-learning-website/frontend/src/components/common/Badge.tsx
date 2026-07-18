import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export type BadgeTone =
  | "indigo"
  | "emerald"
  | "violet"
  | "amber"
  | "rose"
  | "slate"
  | "sky";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const tones: Record<BadgeTone, string> = {
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-100/60",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100/60",
  violet: "bg-violet-50 text-violet-700 border-violet-100/60",
  amber: "bg-amber-50/80 text-amber-700 border-amber-100/60",
  rose: "bg-rose-50 text-rose-700 border-rose-100/60",
  slate: "bg-slate-50 text-slate-600 border-slate-200/60",
  sky: "bg-sky-50 text-sky-700 border-sky-100/60",
};

export function Badge({ children, tone = "slate", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-semibold select-none",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
