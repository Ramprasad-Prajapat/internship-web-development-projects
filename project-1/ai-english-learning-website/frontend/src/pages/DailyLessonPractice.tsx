import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Dumbbell } from "lucide-react";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingState from "../components/common/LoadingState";
import PracticeRunner from "../components/practice/PracticeRunner";
import lessonService from "../services/lessonService";
import aiPracticeService from "../services/aiPracticeService";
import type { Question } from "../types/ai.types";

export default function DailyLessonPractice() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoaded(false);
    setNotFound(false);
    (async () => {
      if (!lessonId) {
        if (active) {
          setNotFound(true);
          setLoaded(true);
        }
        return;
      }
      const lesson = await lessonService.getLesson(lessonId);
      if (!lesson) {
        if (active) {
          setNotFound(true);
          setLoaded(true);
        }
        return;
      }
      const qs = await aiPracticeService.generateDailyLessonQuestions(lessonId);
      if (!active) return;
      setTitle(lesson.title);
      setQuestions(qs);
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [lessonId]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        to="/english-course"
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 bg-white hover:bg-indigo-50/30 px-2.5 py-1 rounded-lg transition-colors shadow-sm/30"
      >
        <ArrowLeft size={12} /> Back to English Course
      </Link>

      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-indigo-100 p-2 text-indigo-700">
          <Dumbbell size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daily Lesson practice</h1>
          {title && <p className="text-sm text-slate-500">{title}</p>}
        </div>
      </div>

      {!loaded ? (
        <LoadingState message="Preparing your practice questions…" />
      ) : notFound ? (
        <Card>
          <EmptyState
            title="Lesson not found"
            message="This daily lesson no longer exists. Pick another from Daily Lessons."
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
      ) : questions.length === 0 ? (
        <Card>
          <EmptyState
            title="No questions to practice"
            message="We couldn't build questions for this lesson. Try another day lesson."
          />
        </Card>
      ) : (
        <PracticeRunner
          sourceType="DAILY_LESSON"
          sourceId={lessonId!}
          sourceTitle={title}
          questions={questions}
          practicedEvent="DAILY_LESSON_PRACTICED"
        />
      )}
    </div>
  );
}
