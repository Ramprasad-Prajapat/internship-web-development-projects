import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Dumbbell,
  FileText,
  Bookmark
} from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import LessonFullView from "../components/lessons/LessonFullView";
import { usePolling } from "../hooks/usePolling";
import dailyLessonService from "../services/dailyLessonService";
import historyService from "../services/historyService";
import aiNotebookService from "../services/aiNotebookService";
import lessonService from "../services/lessonService";
import LessonSectionCard from "../components/lesson/LessonSectionCard";
import NextStepCard from "../components/lesson/NextStepCard";
import learnerInsightsService from "../services/learnerInsightsService";
import sectionProgressService from "../services/sectionProgressService";
import type { Lesson } from "../types/lesson.types";
import type { DailyLessonProgress } from "../types/dailyLesson.types";

export default function DailyLessonDetail() {
  const { dayNumber } = useParams<{ dayNumber: string }>();
  const dayNum = Number(dayNumber);
  const validDay = Number.isFinite(dayNum) && dayNum > 0;
  const navigate = useNavigate();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<DailyLessonProgress | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [sectionProgressList, setSectionProgressList] = useState<Array<{ heading: string; completed: boolean }>>([]);
  const [showRawContent, setShowRawContent] = useState(false);

  const refresh = useCallback(async () => {
    if (!validDay) {
      setLoaded(true);
      return;
    }
    const [l, p] = await Promise.all([
      dailyLessonService.getByDay(dayNum),
      dailyLessonService.getDayProgress(dayNum),
    ]);
    setLessons(l);
    setProgress(p);
    setLoaded(true);

    // Load section progress too
    const firstLesson = l[0];
    if (firstLesson) {
      const sections = lessonService.splitIntoSections(firstLesson.rawContent, dayNum);
      const list = [];
      for (const s of sections) {
        const secSlug = s.heading.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const secId = `${dayNum}_${secSlug}`;
        const prog = await sectionProgressService.getProgress(secId, "DAILY_LESSON");
        list.push({ heading: s.heading, completed: prog.completed });
      }
      setSectionProgressList(list);
    }
  }, [dayNum, validDay]);

  usePolling(refresh, 3000);

  // Reset + reload when the day changes (component is reused across the route).
  useEffect(() => {
    setLessons([]);
    setProgress(null);
    setLoaded(false);
    setSectionProgressList([]);
    setShowRawContent(false);
    refresh();
  }, [refresh]);

  // Log one DAILY_LESSON_VIEWED entry per day, once its lesson has loaded.
  const loggedDayRef = useRef<number | null>(null);
  useEffect(() => {
    if (!validDay || lessons.length === 0) return;
    if (loggedDayRef.current === dayNum) return;
    loggedDayRef.current = dayNum;
    void historyService.addEntry({
      type: "DAILY_LESSON_VIEWED",
      title: `Viewed Day ${dayNum}`,
      description: lessons[0]?.title ?? `Day ${dayNum} lesson`,
      dayNumber: dayNum,
    });
  }, [validDay, dayNum, lessons]);

  const onPractice = async () => {
    if (!validDay) return;
    await dailyLessonService.markDayPracticed(dayNum);
    // Practice runs per-lesson — open the first lesson saved under this day.
    const first = lessons[0];
    if (first) navigate(`/practice/daily/${first.id}`);
  };

  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (lessons.length > 0) {
      setIsBookmarked(learnerInsightsService.isBookmarked(`/daily-lessons/day/${dayNum}`));
    }
  }, [lessons, dayNum]);

  const onToggleBookmark = () => {
    if (lessons.length === 0) return;
    const lesson = lessons[0];
    const path = `/daily-lessons/day/${dayNum}`;
    const allBookmarks = learnerInsightsService.getBookmarks();
    const existing = allBookmarks.find(b => b.routePath === path);
    if (existing) {
      learnerInsightsService.removeBookmark(existing.id);
      setIsBookmarked(false);
    } else {
      learnerInsightsService.addBookmark(
        "lesson",
        lesson.title,
        path
      );
      setIsBookmarked(true);
    }
  };

  const [savedToNotebook, setSavedToNotebook] = useState(false);

  const onSaveToNotebook = async () => {
    if (lessons.length === 0) return;
    const lesson = lessons[0];
    await aiNotebookService.createNote({
      title: `Day ${dayNum} Lesson: ${lesson.title}`,
      sourceType: "Daily Lesson",
      originalContent: `Lesson Context: ${lesson.title}\n\nOriginal Lesson Content:\n${lesson.rawContent}`,
      tags: ["daily-lesson", `day-${dayNum}`]
    });
    setSavedToNotebook(true);
    alert("Saved successfully to AI Notebook! 🎉");
  };

  const onToggleCompleted = async () => {
    if (!validDay || !progress) return;
    const nextCompleted = !progress.completed;
    setProgress(await dailyLessonService.setDayCompleted(dayNum, nextCompleted));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
          <Link
            to="/english-course"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 bg-white hover:bg-indigo-50/30 px-2.5 py-1 rounded-lg transition-colors shadow-sm/30">
            <ArrowLeft size={12} /> Back to English Course
          </Link>
      </div>

      {!loaded ? (
        <Card>
          <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
        </Card>
      ) : !validDay || lessons.length === 0 ? (
        <Card>
          <EmptyState
            icon={<AlertTriangle size={24} />}
            title={validDay ? `No lesson saved for Day ${dayNum}` : "Invalid day"}
            message="Import a lesson with this day number to see it here."
            action={
              <Link
                to="/english-course"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                Back to English Course
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase">
                Day {dayNum} Learning Path
              </span>
              <h1 className="text-xl font-bold text-slate-800 mt-0.5">Day {dayNum}</h1>
              <p className="text-xs text-slate-400 mt-1">
                Practiced {progress?.practiceCount ?? 0}×
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={isBookmarked ? "secondary" : "outline"}
                onClick={onToggleBookmark}
                className="inline-flex items-center gap-1 text-xs"
              >
                <Bookmark size={13} className={isBookmarked ? "fill-current font-bold" : "font-bold"} />
                {isBookmarked ? "Bookmarked" : "Bookmark"}
              </Button>
              <Button variant="outline" size="sm" onClick={onSaveToNotebook} disabled={savedToNotebook} className="text-xs">
                {savedToNotebook ? "Saved ✓" : "Save to Notebook"}
              </Button>
            </div>
          </div>

          {lessons.map((lesson) => {
            const sections = lessonService.splitIntoSections(lesson.rawContent, dayNum);
            const completedCount = sectionProgressList.filter(p => p.completed).length;
            const totalCount = sections.length;

            return (
              <div key={lesson.id} className="space-y-5">
                {/* Lesson Header Title */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-2">
                  <h2 className="text-lg font-bold leading-tight text-slate-800">
                    {lesson.title}
                  </h2>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-xs">
                    <span className="font-bold text-slate-400">Progress:</span>
                    <span className="font-black text-indigo-600 bg-indigo-50/70 border border-indigo-100/50 px-2.5 py-1 rounded-xl">
                      {completedCount}/{totalCount} sections completed
                    </span>
                  </div>
                </div>

                {/* Today's Next Step Card */}
                {sections.length > 0 && (
                  <NextStepCard
                    sourceId={String(dayNum)}
                    sourceType="DAILY_LESSON"
                    sections={sections}
                  />
                )}

                {/* Section List */}
                {sections.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
                      Lesson Sections
                    </h3>
                    {sections.map((s, i) => (
                      <LessonSectionCard
                        key={i}
                        heading={s.heading}
                        body={s.body}
                        sourceType="Daily Lesson"
                        moduleKey="english-course"
                        dayNumber={dayNum}
                        sourceTitle={lesson.title}
                      />
                    ))}
                  </div>
                ) : (
                  <LessonFullView lesson={lesson} />
                )}

                {/* Bottom Actions */}
                <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={onPractice}
                    className="font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl px-4 py-2.5 text-xs flex items-center gap-1.5"
                  >
                    <Dumbbell size={14} /> Start Practice
                  </Button>
                  <Button
                    onClick={onToggleCompleted}
                    className={`${progress?.completed ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} font-bold rounded-xl px-4 py-2.5 text-xs flex items-center gap-1.5`}
                  >
                    <CheckCircle2 size={14} />
                    {progress?.completed ? "Mark not done" : "Mark Lesson Complete"}
                  </Button>
                </div>

                {/* Collapsible raw content block */}
                <div className="pt-4 border-t border-slate-100 mt-6">
                  <button
                    onClick={() => setShowRawContent(!showRawContent)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    <FileText size={14} />
                    {showRawContent ? "Hide Original Content" : "View Original Content"}
                  </button>
                  {showRawContent && (
                    <Card className="border border-slate-200 mt-2 p-4">
                      <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-slate-600 max-h-60 overflow-y-auto bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                        {lesson.rawContent}
                      </pre>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={onSaveToNotebook}
                          disabled={savedToNotebook}
                        >
                          {savedToNotebook ? "Saved to Notebook ✓" : "Save to Notebook"}
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
