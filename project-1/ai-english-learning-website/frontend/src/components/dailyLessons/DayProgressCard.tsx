import { CalendarCheck } from "lucide-react";
import Card from "../common/Card";
import type { DailyProgressSummary } from "../../types/dailyLesson.types";

interface DayProgressCardProps {
  summary: DailyProgressSummary;
}

/** Small day-wise progress summary with a simple bar. */
export function DayProgressCard({ summary }: DayProgressCardProps) {
  const { totalDays, completedDays, practicedDays } = summary;
  const pct = totalDays ? Math.round((completedDays / totalDays) * 100) : 0;

  return (
    <Card>
      <div className="flex items-center gap-2">
        <div className="rounded-xl bg-indigo-100 p-2 text-indigo-700">
          <CalendarCheck size={18} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">Day-wise progress</h3>
          <p className="text-sm text-slate-500">
            {completedDays} of {totalDays} day{totalDays === 1 ? "" : "s"}{" "}
            completed
          </p>
        </div>
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-slate-400">
        {practicedDays} day{practicedDays === 1 ? "" : "s"} practiced ·{" "}
        {pct}% complete
      </p>
    </Card>
  );
}

export default DayProgressCard;
