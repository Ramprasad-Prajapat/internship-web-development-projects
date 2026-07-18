import { cn } from "../../utils/cn";

export type ProgressBarTone = "indigo" | "emerald" | "violet" | "rose" | "sky" | "amber";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  tone?: ProgressBarTone;
  showPercent?: boolean;
  className?: string;
}

const toneClasses: Record<ProgressBarTone, { bar: string; track: string }> = {
  indigo: { bar: "bg-indigo-600", track: "bg-indigo-100/50" },
  emerald: { bar: "bg-emerald-500", track: "bg-emerald-100/50" },
  violet: { bar: "bg-violet-500", track: "bg-violet-100/50" },
  rose: { bar: "bg-rose-500", track: "bg-rose-100/50" },
  sky: { bar: "bg-sky-500", track: "bg-sky-100/50" },
  amber: { bar: "bg-amber-500", track: "bg-amber-100/50" },
};

export function ProgressBar({
  value,
  max = 100,
  label,
  tone = "indigo",
  showPercent = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  const colors = toneClasses[tone];

  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          {label && <span className="truncate">{label}</span>}
          {showPercent && <span>{percentage}%</span>}
        </div>
      )}
      <div className={cn("h-2.5 w-full rounded-full overflow-hidden", colors.track)}>
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", colors.bar)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
