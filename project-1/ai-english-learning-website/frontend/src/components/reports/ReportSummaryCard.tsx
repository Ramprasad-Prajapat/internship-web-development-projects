import type { ReactNode } from "react";
import Card from "../common/Card";

interface ReportSummaryCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
}

export function ReportSummaryCard({ title, value, description, icon }: ReportSummaryCardProps) {
  return (
    <Card className="p-4 border border-slate-100/80 bg-white shadow-sm flex items-center justify-between gap-4">
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          {title}
        </span>
        <span className="text-xl font-extrabold text-slate-800 block tracking-tight">
          {value}
        </span>
        {description && (
          <span className="text-[11px] font-semibold text-slate-500 block leading-normal">
            {description}
          </span>
        )}
      </div>
      {icon && (
        <div className="rounded-xl bg-slate-50 p-2.5 text-slate-400 border border-slate-100/50 shrink-0">
          {icon}
        </div>
      )}
    </Card>
  );
}

export default ReportSummaryCard;
