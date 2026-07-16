import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import LessonFullView from "../components/lessons/LessonFullView";
import { usePolling } from "../hooks/usePolling";
import lessonService from "../services/lessonService";
import historyService from "../services/historyService";
import type { Lesson } from "../types/lesson.types";

export default function LessonDetail() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loaded, setLoaded] = useState(false);
  // Tracks the last lesson we logged a view for, so polling doesn't re-log.
  const viewedRef = useRef<string | null>(null);

  const refresh = useCallback(() => {
    if (!id) return;
    lessonService.getLesson(id).then((l) => {
      setLesson(l);
      setLoaded(true);
      if (l && viewedRef.current !== l.id) {
        viewedRef.current = l.id;
        historyService.addEntry({
          type: "LESSON_VIEWED",
          title: `Viewed: ${l.title}`,
          lessonId: l.id,
          dayNumber: l.dayNumber,
        });
      }
    });
  }, [id]);
  usePolling(refresh, 3000);

  // Reset + reload when the lesson id changes (the component is reused across
  // /lesson/:id routes), so polling never briefly shows the previous lesson.
  useEffect(() => {
    setLesson(null);
    setLoaded(false);
    refresh();
  }, [id, refresh]);

  const onDelete = async () => {
    if (!lesson) return;
    if (!window.confirm("Delete this lesson? This cannot be undone.")) return;
    await lessonService.deleteLesson(lesson.id);
    navigate("/lesson-library");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/lesson-library"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 bg-white hover:bg-indigo-50/30 px-2.5 py-1 rounded-lg transition-colors shadow-sm/30"
        >
          <ArrowLeft size={12} /> Back to Lesson Library
        </Link>
        {lesson && user?.role === "admin" && (
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 size={15} /> Delete
          </Button>
        )}
      </div>

      {!loaded ? (
        <Card>
          <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
        </Card>
      ) : !lesson ? (
        <Card>
          <EmptyState
            title="Lesson not found"
            message="This lesson may have been deleted."
            action={
              <Link
                to="/lesson-library"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                Go to Library
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <h1 className="text-2xl font-bold leading-tight text-slate-800">
            {lesson.title}
          </h1>
          <LessonFullView lesson={lesson} />
        </>
      )}
    </div>
  );
}
