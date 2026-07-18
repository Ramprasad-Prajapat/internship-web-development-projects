import { Search } from "lucide-react";
import { cn } from "../../utils/cn";
import { TOPIC_LABELS } from "../../services/lessonService";
import {
  TOPIC_TYPES,
  type LessonFilter,
  type TopicType,
} from "../../types/lesson.types";

interface LessonFiltersProps {
  filter: LessonFilter;
  onChange: (filter: LessonFilter) => void;
  /** Number of lessons per topic, so chips can show counts. */
  counts: Record<TopicType | "all", number>;
}

export function LessonFilters({ filter, onChange, counts }: LessonFiltersProps) {
  const chips: (TopicType | "all")[] = ["all", ...TOPIC_TYPES];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          className="input-base pl-9"
          placeholder="Search lessons by title, content or tag..."
          value={filter.search}
          onChange={(e) => onChange({ ...filter, search: e.target.value })}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {chips
          .filter((c) => c === "all" || counts[c] > 0)
          .map((c) => {
            const active = filter.topicType === c;
            const label = c === "all" ? "All" : TOPIC_LABELS[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => onChange({ ...filter, topicType: c })}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100",
                )}
              >
                {label}
                <span
                  className={cn(
                    "ml-1.5 text-xs",
                    active ? "text-indigo-100" : "text-slate-400",
                  )}
                >
                  {counts[c] ?? 0}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}

export default LessonFilters;
