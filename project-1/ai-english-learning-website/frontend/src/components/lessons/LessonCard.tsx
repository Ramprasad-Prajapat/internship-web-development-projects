import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Trash2 } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import {
  SOURCE_LABELS,
  TOPIC_LABELS,
  TOPIC_TONES,
  lessonService,
} from "../../services/lessonService";
import { shortDate } from "../../utils/dateUtils";
import type { Lesson } from "../../types/lesson.types";

interface LessonCardProps {
  lesson: Lesson;
  onDelete?: (id: string) => void;
}

export function LessonCard({ lesson, onDelete }: LessonCardProps) {
  const hasWeekDay = lesson.weekNumber != null || lesson.dayNumber != null;

  return (
    <Card className="flex flex-col">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Badge tone={TOPIC_TONES[lesson.topicType]}>
          {TOPIC_LABELS[lesson.topicType]}
        </Badge>
        {hasWeekDay && (
          <Badge tone="slate">
            <Calendar size={12} className="mr-1" />
            {lesson.weekNumber != null ? `W${lesson.weekNumber}` : ""}
            {lesson.weekNumber != null && lesson.dayNumber != null ? " · " : ""}
            {lesson.dayNumber != null ? `D${lesson.dayNumber}` : ""}
          </Badge>
        )}
        <span className="ml-auto text-xs text-slate-400">
          {SOURCE_LABELS[lesson.sourceType]} · {shortDate(lesson.createdAt)}
        </span>
      </div>

      <h3 className="font-semibold leading-snug text-slate-800">
        {lesson.title}
      </h3>

      <p className="mt-1 line-clamp-3 text-sm text-slate-500">
        {lessonService.previewText(lesson.rawContent)}
      </p>

      {lesson.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {lesson.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 pt-1">
        <Link
          to={`/lesson/${lesson.id}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          View lesson <ArrowRight size={15} />
        </Link>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(lesson.id)}
            aria-label="Delete lesson"
            className="ml-auto rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </Card>
  );
}

export default LessonCard;
