import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Plus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LessonFilters from "../components/lessons/LessonFilters";
import LessonList from "../components/lessons/LessonList";
import { usePolling } from "../hooks/usePolling";
import lessonService from "../services/lessonService";
import {
  TOPIC_TYPES,
  type Lesson,
  type LessonFilter,
  type TopicType,
} from "../types/lesson.types";

export default function LessonLibrary() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filter, setFilter] = useState<LessonFilter>({
    topicType: "all",
    search: "",
  });

  // Auto-refresh every 3s so lessons saved elsewhere (e.g. the future
  // browser extension) show up without a manual reload (Rule §17).
  const refresh = useCallback(() => {
    lessonService.listLessons().then(setLessons);
  }, []);
  usePolling(refresh, 3000);

  const counts = useMemo(() => {
    const c = { all: lessons.length } as Record<TopicType | "all", number>;
    for (const t of TOPIC_TYPES) c[t] = 0;
    for (const l of lessons) c[l.topicType] = (c[l.topicType] ?? 0) + 1;
    return c;
  }, [lessons]);

  // If the selected topic runs out of lessons (deleted here or via §17
  // polling), its chip disappears — reset to "All" so the user is not
  // stranded on an empty "No lessons match" view with no chip to deselect.
  useEffect(() => {
    if (filter.topicType !== "all" && counts[filter.topicType] === 0) {
      setFilter((f) => ({ ...f, topicType: "all" }));
    }
  }, [counts, filter.topicType]);

  const shown = useMemo(() => {
    const q = filter.search.trim().toLowerCase();
    return lessons.filter((l) => {
      if (filter.topicType !== "all" && l.topicType !== filter.topicType)
        return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.rawContent.toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [lessons, filter]);

  const onDelete = async (id: string) => {
    if (!window.confirm("Delete this lesson? This cannot be undone.")) return;
    setLessons(await lessonService.deleteLesson(id));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lesson Library</h1>
          <p className="mt-1 text-slate-500">
            All your saved lessons, day-wise and topic-wise.
          </p>
        </div>
        {user?.role === "admin" && (
          <Link
            to="/lesson-import"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus size={16} /> Import lesson
          </Link>
        )}
      </div>

      {lessons.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen size={24} />}
            title="No lessons yet"
            message="No lessons are currently available. Check back soon!"
            action={
              user?.role === "admin" ? (
                <Link
                  to="/lesson-import"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
                >
                  <Plus size={16} /> Import lesson
                </Link>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          <Card>
            <LessonFilters filter={filter} onChange={setFilter} counts={counts} />
          </Card>

          {shown.length === 0 ? (
            <Card>
              <EmptyState
                title="No lessons match"
                message="Try a different topic or clear the search box."
              />
            </Card>
          ) : (
            <LessonList lessons={shown} onDelete={user?.role === "admin" ? onDelete : undefined} />
          )}
        </>
      )}
    </div>
  );
}
