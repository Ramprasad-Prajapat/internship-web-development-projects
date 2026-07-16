import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  AlertTriangle,
  BookOpen,
  Mic,
  PenLine
} from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import dailyLessonService from "../services/dailyLessonService";
import sectionTimeService from "../services/sectionTimeService";
import type { Lesson } from "../types/lesson.types";
import learnerInsightsService, { type LearnerInsights } from "../services/learnerInsightsService";

export default function EnglishCourse() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<any>({});
  const [mistakesCount, setMistakesCount] = useState(0);
  const [studyTime, setStudyTime] = useState(0);
  const [streak, setStreak] = useState(5);
  const [insights, setInsights] = useState<LearnerInsights | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    Promise.all([
      dailyLessonService.listDailyLessons(),
      dailyLessonService.getProgress(),
      learnerInsightsService.getInsights()
    ])
      .then(([l, p, ins]) => {
        setLessons(l);
        setProgress(p);
        setStreak(ins.currentStreak);
        setStudyTime(Math.round(sectionTimeService.getTotalTimeToday() / 60));
        setInsights(ins);
        setMistakesCount(ins.mistakesCount);
      })
      .catch(() => { });
  };

  const totalDaysCount = lessons.length || 1;
  const completedDays = Object.values(progress).filter((p: any) => p && p.completed).length;

  // Unlock logic: Day 1 & Day 2 unlocked by default. Day N (N > 2) unlocked if Day N - 2 is completed.
  const isDayUnlocked = (dayNum: number) => {
    if (dayNum <= 2) return true;
    return !!progress[dayNum - 2]?.completed;
  };

  const sortedLessons = [...lessons].sort((a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0));
  const activeLessonObj = sortedLessons.find(l => {
    const d = l.dayNumber ?? 1;
    return isDayUnlocked(d) && !progress[d]?.completed;
  }) || sortedLessons[0];

  const todayDayNumber = activeLessonObj?.dayNumber ?? 1;
  const todayTitle = activeLessonObj ? activeLessonObj.title.replace(/^Week \d+ Day \d+ — /, "") : "Daily Lesson";
  const todayFocus = activeLessonObj?.tags.map(t => t.toUpperCase()).join(" • ") || "VOCABULARY • GRAMMAR • SPEAKING";

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Back Button */}
      <div className="flex flex-col gap-4">
        <div>
          <Link
            to="/modules"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 bg-white hover:bg-indigo-50/30 px-2.5 py-1 rounded-lg transition-colors shadow-sm/30"
          >
            ← Back to Modules
          </Link>
        </div>
      </div>

      {/* Course Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-800 p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 h-36 w-36 rounded-full bg-white/10 blur-xl animate-pulse" />
        <div className="absolute left-1/3 bottom-0 -mb-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              English Course
            </h1>
            <p className="mt-2 text-xs text-indigo-100 font-medium max-w-xl leading-relaxed">
              Learn English step by step with daily lessons, vocabulary, speaking, reading, writing, grammar, notebook practice, and revision.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur text-right">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-200">Published Lessons</span>
            <span className="block text-lg font-extrabold">{lessons.length} Days</span>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Day</span>
          <span className="text-xl font-black text-indigo-600 mt-2 block">Day {todayDayNumber}</span>
          <span className="text-[10px] text-slate-400 font-medium mt-1 truncate">{todayTitle}</span>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Study Time</span>
          <span className="text-xl font-black text-indigo-600 mt-2 block">{studyTime} Mins</span>
          <span className="text-[10px] text-slate-400 font-medium mt-1">Goal: 30 Mins/day</span>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Streak</span>
          <span className="text-xl font-black text-amber-600 mt-2 block">{streak} Days 🔥</span>
          <span className="text-[10px] text-slate-400 font-medium mt-1">Keep learning daily!</span>
        </div>
      </div>

      {/* Week Progress Bar & Small Review Mistakes Button */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="flex justify-between items-center mb-2 text-xs font-bold text-slate-700">
              <span>Course Progress</span>
              <span className="text-indigo-600 font-extrabold">{completedDays}/{totalDaysCount} days completed</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (completedDays / totalDaysCount) * 100)}%` }}
              />
            </div>
          </div>
          {mistakesCount > 0 && (
            <Link to="/mistakes" className="shrink-0">
              <Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all duration-200">
                <AlertTriangle size={12} /> Review Mistakes ({mistakesCount})
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Continue Learning card near top */}
      {insights?.lastLessonTitle ? (
        <Card className="border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Continue Learning</span>
              <h3 className="font-extrabold text-slate-800 text-sm mt-1">
                Last Studied: {insights.lastLessonTitle}
                {insights.lastSectionTitle && ` — ${insights.lastSectionTitle}`}
              </h3>
            </div>
            <Link
              to={
                insights.lastLessonDay && insights.lastSectionId
                  ? `/daily-lessons/day/${insights.lastLessonDay}/section/${insights.lastSectionId}`
                  : insights.lastLessonDay
                    ? `/daily-lessons/day/${insights.lastLessonDay}`
                    : "/daily-lessons"
              }
            >
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
                Resume Now <ArrowRight size={13} />
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="border border-slate-100 bg-white p-5 shadow-sm text-center py-6">
          <p className="text-xs text-slate-500 font-semibold">No study history found. Ready to start your first lesson?</p>
          <Link to={`/daily-lessons/day/${todayDayNumber}`} className="mt-3 inline-block">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm">
              Start Day {todayDayNumber} <ArrowRight size={13} />
            </Button>
          </Link>
        </Card>
      )}

      {/* Today's English Plan */}
      <Card className="p-5 border border-indigo-100 bg-gradient-to-br from-indigo-50/20 to-purple-50/10 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Today's English Plan</span>
          </div>
          <h2 className="mt-2 text-xl font-extrabold text-slate-800 tracking-tight">
            Day {todayDayNumber} — {todayTitle}
          </h2>
          <div className="mt-3 grid gap-2.5 text-xs text-slate-600">
            <div>
              <span className="font-bold text-slate-500">Est. Time Needed:</span> 30–35 minutes
            </div>
            <div>
              <span className="font-bold text-slate-500">Main Focus:</span> {todayFocus}
            </div>
            <div className="bg-white/60 border border-slate-100 rounded-xl p-3">
              <span className="font-bold text-indigo-600">Suggested Next Action:</span> Read lesson sections and complete exercises.
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-4">
          <Link to={`/daily-lessons/day/${todayDayNumber}`}>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              Continue Today's Lesson <ArrowRight size={13} />
            </Button>
          </Link>
          <Link to="/practice-center">
            <Button size="sm" className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              Start Practice
            </Button>
          </Link>
          <Link to="/ai-notebook">
            <Button size="sm" variant="outline" className="text-slate-600 font-bold px-4 py-2.5 rounded-xl flex items-center gap-1">
              Open Notebook
            </Button>
          </Link>
        </div>
      </Card>

      {/* Today's Practice Section */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Today's Practice
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/reading">
            <Button variant="outline" className="w-full text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-50/50 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-200">
              <BookOpen size={16} /> Read
            </Button>
          </Link>
          <Link to="/speaking">
            <Button variant="outline" className="w-full text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-50/50 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-200">
              <Mic size={16} /> Speak
            </Button>
          </Link>
          <Link to="/writing">
            <Button variant="outline" className="w-full text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-50/50 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-200">
              <PenLine size={16} /> Write
            </Button>
          </Link>
        </div>
      </div>

      {/* Day Roadmap Section */}
      <div className="space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Published Daily Lessons
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedLessons.map((lesson) => {
            const d = lesson.dayNumber ?? 1;
            const isCompleted = !!progress[d]?.completed;
            const unlocked = isDayUnlocked(d);
            const isToday = d === todayDayNumber;
            const secCount = (lesson as any).sections ? (lesson as any).sections.length : 0;
            const title = lesson.title.replace(/^Week \d+ Day \d+ — /, "");

            return (
              <Card
                key={lesson.id || d}
                className={`p-4 border flex flex-col justify-between transition-all duration-200 ${
                  isCompleted
                    ? "border-emerald-100 bg-emerald-50/10"
                    : isToday && unlocked
                    ? "border-indigo-200 bg-indigo-50/5 ring-2 ring-indigo-500/20"
                    : unlocked
                    ? "border-slate-100 bg-white"
                    : "border-slate-100 bg-slate-50/50 opacity-80"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">Day {d}</span>
                    <Badge
                      tone={isCompleted ? "emerald" : unlocked ? (isToday ? "indigo" : "sky") : "slate"}
                      className="text-[8px] uppercase tracking-wider py-0"
                    >
                      {isCompleted ? "Completed" : unlocked ? (isToday ? "Active" : "Unlocked") : "Locked"}
                    </Badge>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm mt-1.5">{title}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Est. time: 30 mins</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[9.5px] text-slate-400 font-bold">
                    {unlocked ? `${secCount} Sections` : `🔒 Complete Day ${d - 2} to Unlock`}
                  </span>
                  {unlocked ? (
                    <Link to={`/daily-lessons/day/${d}`}>
                      <Button size="sm" className="text-[9px] font-black h-7 px-3 py-1">
                        {isCompleted ? "Review" : "Start"}
                      </Button>
                    </Link>
                  ) : (
                    <Button size="sm" disabled className="text-[9px] font-black h-7 px-3 py-1 bg-slate-150 text-slate-400 cursor-not-allowed border border-slate-200 opacity-60">
                      Locked
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
