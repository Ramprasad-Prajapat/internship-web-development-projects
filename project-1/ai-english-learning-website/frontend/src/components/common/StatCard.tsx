import type { ReactNode } from "react";
import Card from "./Card";
import Badge, { type BadgeTone } from "./Badge";
import { cn } from "../../utils/cn";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  description?: string;
  trend?: {
    text: string;
    tone?: BadgeTone;
  };
  tone?: "indigo" | "emerald" | "violet" | "rose" | "sky" | "amber" | "slate";
  className?: string;
}

const toneClasses = {
  indigo: "bg-indigo-50/50 text-indigo-600 border-indigo-100/30",
  emerald: "bg-emerald-50/50 text-emerald-600 border-emerald-100/30",
  violet: "bg-violet-50/50 text-violet-600 border-violet-100/30",
  rose: "bg-rose-50/50 text-rose-600 border-rose-100/30",
  sky: "bg-sky-50/50 text-sky-600 border-sky-100/30",
  amber: "bg-amber-50/50 text-amber-600 border-amber-100/30",
  slate: "bg-slate-50/50 text-slate-600 border-slate-200/30",
};

export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  tone = "slate",
  className,
}: StatCardProps) {
  const colors = toneClasses[tone];

  return (
    <Card hoverable className={cn("flex flex-col justify-between p-5 border border-slate-100/80 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </span>
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight sm:text-3xl">
            {value}
          </h3>
        </div>
        {icon && (
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", colors)}>
            {icon}
          </div>
        )}
      </div>
      {(description || trend) && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
          {trend && (
            <Badge tone={trend.tone ?? "slate"} className="text-[10px] py-0.5 px-1.5 font-bold">
              {trend.text}
            </Badge>
          )}
          {description && (
            <p className="text-xs font-medium text-slate-500 truncate">
              {description}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

export default StatCard;
