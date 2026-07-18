import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Sparkles,
  ArrowRight,
  History,
  Dumbbell,
  NotebookText,
  ArrowLeft,
  FileSpreadsheet,
} from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import PracticeRunner from "../components/practice/PracticeRunner";
import dailyLessonService from "../services/dailyLessonService";
import aiPracticeService from "../services/aiPracticeService";
import type { Lesson } from "../types/lesson.types";
import type { PracticeSession, Question } from "../types/ai.types";

export default function EnglishPractice() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [latestSession, setLatestSession] = useState<PracticeSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<PracticeSession[]>([]);

  // Inline practice states
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const loadDashboard = () => {
    Promise.all([
      dailyLessonService.listDailyLessons(),
      aiPracticeService.getLatestSession("DAILY_LESSON"),
      aiPracticeService.listSessions(),
    ])
      .then(([l, latest, allSessions]) => {
        setLessons(l);
        setLatestSession(latest);
        setRecentSessions(allSessions.filter((s) => s.sourceType === "DAILY_LESSON").slice(0, 5));
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleStartPractice = async (lesson: Lesson) => {
    setLoadingQuestions(true);
    setSelectedLesson(lesson);
    try {
      const qs = await aiPracticeService.generateDailyLessonQuestions(lesson.id);
      setQuestions(qs);
    } catch (e) {
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleStopPractice = () => {
    setSelectedLesson(null);
    setQuestions([]);
    loadDashboard(); // Refresh stats/recent sessions
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* 1. Header & Back Navigation Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {selectedLesson ? (
          <button
            onClick={handleStopPractice}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 bg-white hover:bg-indigo-50/30 px-2.5 py-1 rounded-lg transition-colors shadow-sm/30"
          >
            ← Change Lesson
          </button>
        ) : (
          <Link
            to="/modules/english-course"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 bg-white hover:bg-indigo-50/30 px-2.5 py-1 rounded-lg transition-colors shadow-sm/30"
          >
            ← Back to English Course
          </Link>
        )}
        <Link
          to="/english/report"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 border border-indigo-100 bg-indigo-50/20 px-2.5 py-1 rounded-lg transition-colors"
        >
          <FileSpreadsheet size={12} /> View English Report
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
            {selectedLesson ? `Practice: ${selectedLesson.title}` : "English Practice"}
          </h1>
          <Badge tone="indigo" className="text-[9px] font-bold">
            Mock AI practice
          </Badge>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
          {selectedLesson
            ? "Submit answers below to get instant corrections under frontend practice mode."
            : "Select a daily lesson, generate custom mock questions, and get instant corrections on your sentence structure."}
        </p>
      </div>

      {selectedLesson ? (
        <div className="space-y-4">
          {loadingQuestions ? (
            <Card className="p-8 text-center text-sm font-semibold text-slate-400">
              Generating questions in Frontend practice mode…
            </Card>
          ) : questions.length === 0 ? (
            <Card className="p-8 text-center text-sm font-semibold text-slate-400">
              Could not generate questions. Please pick another lesson.
            </Card>
          ) : (
            <PracticeRunner
              sourceType="DAILY_LESSON"
              sourceId={selectedLesson.id}
              sourceTitle={selectedLesson.title}
              questions={questions}
              practicedEvent="DAILY_LESSON_PRACTICED"
            />
          )}
        </div>
      ) : (
        <>
          {/* Hero / Continue study shortcut */}
          {latestSession ? (
            <Card className="border-indigo-100 bg-indigo-50/25 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <span className="rounded-xl bg-indigo-600 p-2.5 text-white shadow-md shadow-indigo-600/10">
                  <Dumbbell size={20} />
                </span>
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Continue Practicing
                  </span>
                  <h4 className="font-extrabold text-slate-800 mt-1 tracking-tight">
                    {latestSession.sourceTitle}
                  </h4>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                    Answered: {latestSession.answered} · Last Score: {latestSession.lastScore}%
                  </p>
                </div>
              </div>
              <Button
                onClick={() =>
                  handleStartPractice({
                    id: latestSession.sourceId,
                    title: latestSession.sourceTitle,
                    dayNumber: 1,
                  } as Lesson)
                }
                className="inline-flex items-center gap-1"
              >
                Resume Practice <ArrowRight size={14} />
              </Button>
            </Card>
          ) : lessons.length > 0 ? (
            <Card className="border-indigo-100 bg-indigo-50/25 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <span className="rounded-xl bg-indigo-600 p-2.5 text-white shadow-md shadow-indigo-600/10">
                  <Dumbbell size={20} />
                </span>
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Getting Started
                  </span>
                  <h4 className="font-extrabold text-slate-800 mt-1 tracking-tight">
                    {lessons[0].title}
                  </h4>
                </div>
              </div>
              <Button
                onClick={() => handleStartPractice(lessons[0])}
                className="inline-flex items-center gap-1"
              >
                Start Lesson 1 Practice <ArrowRight size={14} />
              </Button>
            </Card>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            {/* Choose a Lesson Card */}
            <Card className="p-5 border border-slate-100/80 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
                Select a Lesson to Practice
              </h3>
              {lessons.length === 0 ? (
                <div className="py-6 text-center text-xs font-semibold text-slate-400">
                  No lessons available to practice. Please import or add lessons first.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {lessons.map((les) => (
                    <div
                      key={les.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/10 p-3 hover:bg-indigo-50/5 hover:border-indigo-100/60 transition-all duration-200"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <NotebookText size={15} className="text-slate-400 shrink-0" />
                        <span className="truncate text-xs font-bold text-slate-700">
                          {les.title}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartPractice(les)}
                        className="text-[11px] font-bold h-8"
                      >
                        Start
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Practice History */}
            <Card className="p-5 border border-slate-100/80 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
                Recent Practice Sessions
              </h3>
              {recentSessions.length === 0 ? (
                <div className="py-8 text-center text-xs font-semibold text-slate-400">
                  No recent practice sessions found. Start a practice quiz to view history logs here!
                </div>
              ) : (
                <ul className="space-y-3">
                  {recentSessions.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/20 p-3"
                    >
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-700 truncate">
                          {s.sourceTitle}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                          {s.answered} items · score {s.lastScore}%
                        </span>
                      </div>
                      <Badge tone={s.lastScore >= 80 ? "emerald" : "indigo"} className="text-[9px] font-bold shrink-0">
                        {s.lastScore >= 80 ? "Pass" : "Review"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
