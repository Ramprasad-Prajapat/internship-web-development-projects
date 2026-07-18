import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import aiPracticeService from "../services/aiPracticeService";
import learningService from "../services/mockLearningService";
import extensionImportService from "../services/extensionImportService";
import historyService from "../services/historyService";
import dailyLessonService from "../services/dailyLessonService";
import type { PracticeSession } from "../types/ai.types";
import type { HistoryEntry } from "../types/history.types";
import type { Mistake } from "../types/learning.types";
import { shortDate } from "../utils/dateUtils";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import {
  AlertTriangle,
  Inbox,
  TrendingUp,
  ArrowRight,
  History as HistoryIcon,
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  User,
  BookOpen,
  Shapes,
  Lock,
  CalendarDays,
  Library,
  Mic,
  PenLine,
  GraduationCap,
  Sparkles,
  FileText,
  BarChart3,
  Calendar,
} from "lucide-react";

export default function Modules() {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [inboxItems, setInboxItems] = useState<any[]>([]);
  const [historyList, setHistoryList] = useState<HistoryEntry[]>([]);
  const [streak, setStreak] = useState(0);

  // English Course details state
  const [lessonsViewed, setLessonsViewed] = useState(0);
  const [lessonsPracticed, setLessonsPracticed] = useState(0);
  const [englishProgressCount, setEnglishProgressCount] = useState(0);
  const [englishLastActive, setEnglishLastActive] = useState("Never active");
  const [englishStudyMinutes, setEnglishStudyMinutes] = useState(15);
  const [daysCompleted, setDaysCompleted] = useState(0);
  const [totalDays, setTotalDays] = useState(7);

  // Prepositions details state
  const [prepPracticedCount, setPrepPracticedCount] = useState(0);
  const [prepLastActive, setPrepLastActive] = useState("Never active");
  const [prepStudyMinutes, setPrepStudyMinutes] = useState(15);
  const [prepWeakList, setPrepWeakList] = useState<string[]>([]);
  const [prepLastTitle, setPrepLastTitle] = useState("");
  const [prepLastTime, setPrepLastTime] = useState("");
  const [prepAccuracy, setPrepAccuracy] = useState(85);

  // English Course Tab state
  const [englishTab, setEnglishTab] = useState<"skills" | "progress" | "history">("skills");

  useEffect(() => {
    Promise.all([
      aiPracticeService.listSessions(),
      learningService.listMistakes(),
      extensionImportService.listItems(),
      learningService.getDashboard(),
      historyService.list(),
      dailyLessonService.listDailyLessons(),
      dailyLessonService.getProgress(),
    ])
      .then(([s, m, ext, dbData, h, lessonsList, dailyProgress]) => {
        setSessions(s);
        setMistakes(m);
        setInboxItems(ext);
        setStreak(dbData.streak || 0);
        setHistoryList(h);

        // Daily path count
        setTotalDays(lessonsList.length || 7);
        const completed = Object.values(dailyProgress).filter((status: any) => status === "completed").length;
        setDaysCompleted(completed);

        // English Course Stats
        const englishViews = h.filter(
          (item) => item.type === "DAILY_LESSON_VIEWED" || item.type === "LESSON_VIEWED"
        ).length;
        const englishPractices = h.filter((item) => item.type === "DAILY_LESSON_PRACTICED").length;
        setLessonsViewed(englishViews);
        setLessonsPracticed(englishPractices);

        const englishSessionsList = s.filter((sess) => sess.sourceType === "DAILY_LESSON");
        setEnglishProgressCount(englishSessionsList.length);
        if (englishSessionsList.length > 0) {
          setEnglishLastActive(shortDate(englishSessionsList[0].updatedAt));
          // Calculate study minutes roughly (e.g. 5 minutes per session + 2 mins per view)
          setEnglishStudyMinutes(englishSessionsList.length * 8 + englishViews * 3 || 15);
        }

        // Preposition Stats
        const prepEvents = h.filter(
          (item) =>
            item.type === "PREPOSITION_PRACTICED" ||
            item.type === "PREPOSITION_VIEWED" ||
            (item.type === "MISTAKE_SAVED" && item.description && item.description.includes("Preposition"))
        );
        const prepPractices = h.filter((item) => item.type === "PREPOSITION_PRACTICED").length;
        setPrepPracticedCount(prepPractices);

        const prepositionSessions = s.filter((sess) => sess.sourceType === "PREPOSITION");
        if (prepositionSessions.length > 0) {
          // Average score of preamp quizzes
          const totalScore = prepositionSessions.reduce((sum, current) => sum + current.lastScore, 0);
          setPrepAccuracy(Math.round(totalScore / prepositionSessions.length));
          setPrepStudyMinutes(prepositionSessions.length * 6 || 12);
        }

        if (prepEvents.length > 0) {
          setPrepLastActive(shortDate(prepEvents[0].createdAt));
          const lastPractice = h.find((item) => item.type === "PREPOSITION_PRACTICED");
          if (lastPractice) {
            setPrepLastTitle(lastPractice.title.replace("Practiced preposition ", ""));
            setPrepLastTime(
              new Date(lastPractice.createdAt).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })
            );
          }
        }

        // Weak prepositions
        const prepMistakes = m.filter((item) => item.source.startsWith("Preposition"));
        const weakPreps = Array.from(
          new Set(
            prepMistakes
              .map((item) => {
                const parts = item.source.split(" ");
                return parts[parts.length - 1]?.toUpperCase();
              })
              .filter(Boolean)
          )
        );
        setPrepWeakList(weakPreps);
      })
      .catch(() => { });
  }, []);

  const mistakesCount = mistakes.length;
  const pendingInboxCount = inboxItems.filter((i) => i.convertedStatus === "PENDING").length;

  // Preposition items checklist config
  const prepositionTopics = [
    { name: "IN", status: "Active", link: "/prepositions/in" },
    { name: "ON", status: "Active", link: "/prepositions/on" },
    { name: "AT", status: "Active", link: "/prepositions/at" },
    { name: "TO", status: "Active", link: "/prepositions/to" },
    { name: "FROM", status: "Active", link: "/prepositions/from" },
    { name: "BY", status: "Active", link: "/prepositions/by" },
    { name: "WITH", status: "Active", link: "/prepositions/with" },
    { name: "FOR", status: "Active", link: "/prepositions/for" },
    { name: "ABOUT", status: "Active", link: "/prepositions/about" },
    { name: "BETWEEN", status: "Active", link: "/prepositions/between" },
  ];

  // Reports link mapping
  const reportsRoute = "/reports";

  return (
    <div className="space-y-7 animate-fade-in pb-12">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
          Learning Modules
        </h1>
        <p className="mt-1.5 text-xs text-slate-500 font-medium leading-relaxed max-w-2xl">
          Choose a module and continue your English learning with progress, practice, history, reports, and timer tracking.
        </p>
      </div>

      {/* 3. Main Module Cards (Two big main cards) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card 1: English Course */}
        <Card className="p-5 border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 border border-indigo-100/30">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">English Course</h2>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 mt-1 border border-emerald-100">
                    Active Module
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
              Daily English learning path with lessons, vocabulary, speaking, reading, writing, grammar, notebook, revision, and reports.
            </p>

            {/* Inner Feature Sections */}
            <div className="border-t border-slate-100 pt-4">
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-indigo-50/40 text-indigo-700 border border-indigo-100/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  <span>Daily Lessons</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/50 text-slate-400 border border-dashed border-slate-150">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  <span>Practice</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/50 text-slate-400 border border-dashed border-slate-150">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  <span>Notebook
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/50 text-slate-400 border border-dashed border-slate-150">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  <span>Reports</span>
                </div>

              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-50">
            <Link to="/modules/english-course">
              <Button className="w-full text-xs font-extrabold h-9 inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                Open English Course <ArrowRight size={13} />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Card 2: Prepositions */}
        <Card className="p-5 border border-slate-150 bg-slate-50/40 shadow-sm opacity-80 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-2.5 text-slate-400 border border-slate-200/40">
                  <Shapes size={22} className="text-slate-400" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-500 tracking-tight">Prepositions</h2>
                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-1 border border-slate-200">
                    Paused / Coming Soon
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-400 leading-relaxed">
              Prepositions module will be improved after English Course completion. Practice in, on, at, to, from, by, with and other common prepositions.
            </p>

            <div className="border-t border-slate-200/60 pt-4">
              <div className="rounded-xl bg-slate-100/60 p-3 text-center text-[10px] font-bold text-slate-500">
                🔒 Focus on the active English Course syllabus first.
              </div>
            </div>
          </div>
        </Card>
      </div>


    </div>
  );
}
