import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Dumbbell,
  HelpCircle,
  History,
} from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import Badge from "../common/Badge";
import type { DayGroup } from "../../types/dailyLesson.types";

interface DayLessonCardProps {
  group: DayGroup;
  onPractice: (dayNumber: number) => void;
}

/** One card per day, with progress, actions and "coming soon" placeholders. */
export function DayLessonCard({ group, onPractice }: DayLessonCardProps) {
  const { dayNumber, lessons, progress } = group;
  const title = lessons[0]?.title ?? `Day ${dayNumber}`;
  const extra = lessons.length - 1;

  return (
    <Card className="flex flex-col">
      <div className="mb-1 flex items-center gap-2">
        <Badge tone="indigo">Day {dayNumber}</Badge>
        {progress.completed ? (
          <Badge tone="emerald">
            <CheckCircle2 size={12} className="mr-1" /> Completed
          </Badge>
        ) : progress.practiceCount > 0 ? (
          <Badge tone="amber">Practiced {progress.practiceCount}×</Badge>
        ) : (
          <Badge tone="slate">Not started</Badge>
        )}
      </div>

      <h3 className="font-semibold leading-snug text-slate-800">{title}</h3>
      <p className="mt-0.5 text-xs text-slate-400">
        {lessons.length} lesson{lessons.length === 1 ? "" : "s"} saved
        {extra > 0 ? ` · +${extra} more` : ""}
      </p>

      {/* Placeholders for upcoming per-day features (next phase) */}
      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5">
          <AlertTriangle size={11} /> Mistakes: soon
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5">
          <HelpCircle size={11} /> Questions: soon
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5">
          <History size={11} /> History: soon
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 pt-1">
        <Link
          to={`/daily-lessons/day/${dayNumber}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          View Day Lesson
        </Link>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onPractice(dayNumber)}
        >
          <Dumbbell size={15} /> Practice Day
        </Button>
      </div>
    </Card>
  );
}

export default DayLessonCard;
