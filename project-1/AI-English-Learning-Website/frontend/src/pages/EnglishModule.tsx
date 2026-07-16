import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  CalendarDays,
  Plus,
  Play,
  FileText,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import dailyLessonService from "../services/dailyLessonService";
import lessonService from "../services/lessonService";
import learningService from "../services/mockLearningService";
import historyService from "../services/historyService";
import type { Lesson } from "../types/lesson.types";
import type { Mistake } from "../types/learning.types";
import type { HistoryEntry } from "../types/history.types";

export default function EnglishModule() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<any>({});
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [recentActivity, setRecentActivity] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    Promise.all([
      dailyLessonService.listDailyLessons(),
      dailyLessonService.getProgress(),
      learningService.listMistakes(),
      historyService.list(),
    ])
      .then(([l, p, m, h]) => {
        setLessons(l);
        setProgress(p);
        setMistakes(m.filter((item) => !item.source.startsWith("Preposition")));
        
        const englishEventTypes = [
          "DAILY_LESSON_VIEWED",
          "LESSON_VIEWED",
          "DAILY_LESSON_PRACTICED",
          "IMPORT_FINAL_SAVED",
          "LESSON_SAVED",
        ];
        const filteredHistory = h.filter((item) => 
          englishEventTypes.includes(item.type) || 
          (item.type === "MISTAKE_SAVED" && item.description && !item.description.includes("Preposition"))
        );
        setRecentActivity(filteredHistory.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  const summary = dailyLessonService.summarize(lessons, progress);
  const totalDays = lessons.length;
  const completedDays = Object.values(progress).filter((status) => status === "completed").length;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
            English Lessons Module
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
            Follow a daily structured beginner study path, review mistakes, and check your progress logs.
          </p>
        </div>
        <Link to="/english/report">
          <Button className="inline-flex items-center gap-1.5 shadow-sm">
            <FileSpreadsheet size={16} /> View Analytics Report
          </Button>
        </Link>
      </div>

      {/* Grid of Shortcuts / Metrics */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Daily Lessons Card */}
        <Card className="p-5 border border-slate-100/80 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 border border-indigo-100/30">
                <CalendarDays size={20} />
              </div>
              <h3 className="font-extrabold text-slate-800 tracking-tight">Daily Lessons</h3>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">
              Structured Day 1 to 7 unit roadmap for beginners.
            </p>
            <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <span>Progress:</span>
              <span>{completedDays} / {totalDays} days completed</span>
            </div>
          </div>
          <div className="mt-5">
            <Link to="/english-course">
              <Button size="sm" variant="outline" className="w-full text-xs font-bold h-9 inline-flex items-center justify-center gap-1">
                Go to Path <ArrowRight size={13} />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Lesson Library Card */}
        <Card className="p-5 border border-slate-100/80 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600 border border-violet-100/30">
                <FileText size={20} />
              </div>
              <h3 className="font-extrabold text-slate-800 tracking-tight">Lesson Library</h3>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">
              Browse all stored lesson materials and content details.
            </p>
            <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <span>Total Lessons:</span>
              <span>{lessons.length} articles</span>
            </div>
          </div>
          <div className="mt-5">
            {user?.role === "admin" ? (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/lesson-library" className="w-full">
                  <Button size="sm" variant="outline" className="w-full text-xs font-bold h-9">
                    Library
                  </Button>
                </Link>
                <Link to="/lesson-import" className="w-full">
                  <Button size="sm" className="w-full text-xs font-bold h-9 inline-flex items-center justify-center gap-1">
                    <Plus size={13} /> Import
                  </Button>
                </Link>
              </div>
            ) : (
              <Link to="/lesson-library" className="w-full">
                <Button size="sm" variant="outline" className="w-full text-xs font-bold h-9">
                  Library
                </Button>
              </Link>
            )}
          </div>
        </Card>

        {/* Practice & Mistakes Card */}
        <Card className="p-5 border border-slate-100/80 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600 border border-rose-100/30">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-extrabold text-slate-800 tracking-tight">Practice & Mistakes</h3>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">
              Generate practice questions and correct saved mistakes.
            </p>
            <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <span>Active Mistakes:</span>
              <span className={mistakes.length > 0 ? "text-rose-600 font-extrabold" : "text-emerald-600"}>
                {mistakes.length} errors
              </span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link to="/english/practice" className="w-full">
              <Button size="sm" variant="outline" className="w-full text-xs font-bold h-9 inline-flex items-center justify-center gap-1">
                <Sparkles size={12} className="text-violet-500" /> Practice
              </Button>
            </Link>
            <Link to="/mistakes" className="w-full">
              <Button size="sm" className="w-full text-xs font-bold h-9">
                Mistakes
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent activity & Actions split */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Recent English Activity */}
        <Card className="p-5 border border-slate-100/80 bg-white shadow-sm">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4">
            Recent Activity
          </h3>
          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-xs font-semibold text-slate-400">
              No recent English lesson activity recorded.
            </div>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((act) => (
                <li
                  key={act.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/10 p-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div>
                    <span className="block text-xs font-bold text-slate-700">
                      {act.title}
                    </span>
                    {act.description && (
                      <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                        {act.description}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-slate-400">
                    {new Date(act.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Suggestion & Info Card */}
        <Card className="p-5 border border-slate-100/80 bg-indigo-50/15 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4">
              Study Suggestion
            </h3>
            <div className="rounded-xl border border-indigo-100/80 bg-white p-4 space-y-2">
              <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-600 border border-indigo-100">
                Next Recommended Step
              </span>
              <p className="text-xs font-bold text-slate-800 leading-relaxed mt-2">
                {completedDays > 0 
                  ? `You have completed ${completedDays} lesson(s). Practice is recommended for key sentence builder structures.`
                  : "Start Week 1 Day 1: Basic Sentences lesson to begin your path!"}
              </p>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-1">
                Make sure you check grammar structures, read examples out loud, and run mock practice drills.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <Link to="/english-course">
              <Button className="w-full inline-flex items-center justify-center gap-1">
                <Play size={14} className="fill-white" /> Start Studying Now
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
