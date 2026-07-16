import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";
import type { DayGroup } from "../../types/dailyLesson.types";

interface DayLessonTimelineProps {
  days: DayGroup[];
}

/** Compact vertical timeline overview of all days (Day 1 → Day N). */
export function DayLessonTimeline({ days }: DayLessonTimelineProps) {
  if (days.length === 0) return null;

  return (
    <ol className="relative ml-2 space-y-3 border-l-2 border-slate-100 pl-5">
      {days.map((d, i) => {
        const status = d.progress.completed
          ? "done"
          : d.progress.practiceCount > 0
            ? "active"
            : "todo";
        const dotColor =
          status === "done"
            ? "bg-emerald-500"
            : status === "active"
              ? "bg-amber-500"
              : "bg-slate-300";
        const title = d.lessons[0]?.title ?? `Day ${d.dayNumber}`;

        return (
          <li key={`${d.dayNumber}-${i}`} className="relative">
            <span
              className={cn(
                "absolute -left-[27px] top-1.5 h-3 w-3 rounded-full ring-4 ring-white",
                dotColor,
              )}
            />
            <Link
              to={`/daily-lessons/day/${d.dayNumber}`}
              className="group flex items-center justify-between gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-slate-50"
            >
              <span className="min-w-0">
                <span className="text-sm font-semibold text-slate-700">
                  Day {d.dayNumber}
                </span>
                <span className="ml-2 truncate text-xs text-slate-400">
                  {title}
                </span>
              </span>
              <span className="shrink-0 text-xs font-medium text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
                Open →
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export default DayLessonTimeline;
