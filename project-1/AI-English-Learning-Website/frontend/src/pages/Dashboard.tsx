import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  ClipboardPaste,
  NotebookText,
  Sparkles,
  PenTool,
  Mic,
  AlertTriangle,
  Save,
  Lock,
  BookOpen,
  History as HistoryIcon,
  TrendingUp,
  FileText,
  ShieldAlert,
  GraduationCap,
  Flame,
  Bookmark,
  PlusCircle,
  HelpCircle,
  FileCheck
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import learningService from "../services/mockLearningService";
import lessonService from "../services/lessonService";
import clipboardImportService from "../services/clipboardImportService";
import dailyLessonService from "../services/dailyLessonService";
import sectionProgressService from "../services/sectionProgressService";
import historyService from "../services/historyService";
import aiPracticeService from "../services/aiPracticeService";
import extensionImportService from "../services/extensionImportService";
import aiNotebookService from "../services/aiNotebookService";
import mistakeService from "../services/mistakeService";
import authService from "../services/authService";
import learnerInsightsService, { type LearnerInsights } from "../services/learnerInsightsService";
import practiceCenterService from "../services/practiceCenterService";
import englishAssessmentService from "../services/englishAssessmentService";
import type { DashboardData } from "../types/learning.types";
import sectionTimeService from "../services/sectionTimeService";
import type { Lesson } from "../types/lesson.types";
import type { ImportDraft } from "../types/import.types";
import type { HistoryEntry } from "../types/history.types";
import type { PracticeSession } from "../types/ai.types";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";

const practiceTileClass =
  "flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-indigo-200 hover:bg-indigo-50/10";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [, setLatest] = useState<Lesson | null>(null);
  const [, setDraft] = useState<ImportDraft | null>(null);
  const [, setRecentHistory] = useState<HistoryEntry[]>([]);
  const [, setRecentSessions] = useState<PracticeSession[]>([]);
  const [, setLatestDaily] = useState<PracticeSession | null>(null);
  const [, setLatestPrep] = useState<PracticeSession | null>(null);
  const [, setPendingCount] = useState(0);
  const [, setLatestClip] = useState<any>(null);
  const [, setWeekAvg] = useState(0);
  const [error, setError] = useState(false);

  // Dynamic Insight States
  const [insights, setInsights] = useState<LearnerInsights | null>(null);
  const [isSetupMissing, setIsSetupMissing] = useState(false);
  const [actualTodayTime, setActualTodayTime] = useState(0);
  const [lastImportedTitle, setLastImportedTitle] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<any[]>([]);

  // Text Import Form States
  const [importTitle, setImportTitle] = useState("");
  const [importContent, setImportContent] = useState("");
  const [importNote, setImportNote] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);
  const [importing, setImporting] = useState(false);

  // Learner Roadmap/Plan Flow
  const [learningFlow, setLearningFlow] = useState<{
    dayNum: number;
    lessonTitle: string;
    completedCount: number;
    totalCount: number;
    nextSectionHeading: string | null;
    nextSectionSlug: string | null;
    nextActionTip: string;
    lessonExists: boolean;
  } | null>(null);

  // Read-only local variables mapping to insights to avoid state duplication
  const completedDays = insights?.lessonsCompletedCount ?? 0;
  const completedSections = insights?.sectionsCompletedCount ?? 0;
  const notebookCount = insights?.notebookNotesCount ?? 0;
  const userImportCount = insights?.userImportsCount ?? 0;
  const mistakesCount = insights?.mistakesCount ?? 0;
  const writingChecks = insights?.writingChecksCount ?? 0;
  const speakingChecks = insights?.speakingChecksCount ?? 0;
  const latestQuizScore = insights?.latestQuizScore ?? null;
  const pendingPracticeCount = insights?.pendingMistakesCount ?? 0;

  const load = useCallback(() => {
    setError(false);
    learningService
      .getDashboard()
      .then(setData)
      .catch(() => setError(true));
    lessonService
      .listLessons()
      .then((list) => setLatest(list[0] ?? null))
      .catch(() => setLatest(null));
    setDraft(clipboardImportService.getImportDraft());
    historyService
      .recent(4)
      .then(setRecentHistory)
      .catch(() => setRecentHistory([]));
    aiPracticeService
      .getRecentSessions(3)
      .then(setRecentSessions)
      .catch(() => setRecentSessions([]));
    aiPracticeService
      .getLatestSession("DAILY_LESSON")
      .then(setLatestDaily)
      .catch(() => setLatestDaily(null));
    aiPracticeService
      .getLatestSession("PREPOSITION")
      .then(setLatestPrep)
      .catch(() => setLatestPrep(null));
    extensionImportService
      .listItems()
      .then((list) => {
        setPendingCount(list.filter((i) => i.convertedStatus === "PENDING").length);
        setLatestClip(list[0] ?? null);
      })
      .catch(() => {
        setPendingCount(0);
        setLatestClip(null);
      });
    learningService
      .getWeekly()
      .then((w) => {
        const avg = w.length > 0 ? Math.round(w.reduce((s, pt) => s + pt.score, 0) / w.length) : 0;
        setWeekAvg(avg);
      })
      .catch(() => setWeekAvg(0));

    // Load insights (centralized calculations)
    learnerInsightsService.getInsights().then((ins) => {
      setInsights(ins);
      setLocalTasks(ins.dailyTasks);
      const currUser = authService.getUser();
      const missing = !currUser?.weakAreas || currUser.weakAreas.length === 0 || !currUser?.preferredPracticeFocus;
      setIsSetupMissing(missing);
      setActualTodayTime(sectionTimeService.getTotalTimeToday());
    }).catch(() => { });

    // Load notes for last imported note title
    aiNotebookService.listNotes().then((n) => {
      const userImports = n.filter(item => item.sourceType === "User Import");
      if (userImports.length > 0) {
        const sortedImports = [...userImports].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setLastImportedTitle(sortedImports[0].title);
      } else {
        setLastImportedTitle(null);
      }
    }).catch(() => { });

    // Fetch learning flow info
    (async () => {
      try {
        const allDaily = await dailyLessonService.listDailyLessons();
        if (allDaily.length === 0) {
          setLearningFlow(null);
          return;
        }

        const progressMap = await dailyLessonService.getProgress();
        const sortedDaily = [...allDaily].sort((a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0));

        // Find the first day that is not fully completed, skipping lower days if they haven't started any lessons yet and have an assessment recommendation
        const assessmentData = englishAssessmentService.getAssessmentResult();
        const currUser = authService.getUser();
        const levelStartDay = currUser?.level === "INTERMEDIATE" ? 5 : currUser?.level === "BASIC" ? 3 : 1;
        const startDay = assessmentData?.recommendedStartDay || levelStartDay;
        const incompleteDay = sortedDaily.find(l => {
          const day = l.dayNumber ?? 1;
          if (day < startDay) {
            const hasStartedAny = Object.values(progressMap).some((p: any) => p?.completed || p?.practiceCount > 0);
            if (!hasStartedAny) {
              return false;
            }
          }
          return !progressMap[day]?.completed;
        });

        const activeLesson = incompleteDay || sortedDaily[sortedDaily.length - 1];
        const dayNum = activeLesson.dayNumber ?? 1;
        const lessonTitle = activeLesson.title;
        const sections = lessonService.splitIntoSections(activeLesson.rawContent, activeLesson.dayNumber);

        if (sections.length === 0) {
          setLearningFlow({
            dayNum,
            lessonTitle,
            completedCount: 0,
            totalCount: 0,
            nextSectionHeading: null,
            nextSectionSlug: null,
            nextActionTip: "Read the full lesson content.",
            lessonExists: true,
          });
          return;
        }

        const sectionProgressList = [];
        for (const sec of sections) {
          const secId = `${dayNum}_${sec.heading.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
          const p = await sectionProgressService.getProgress(secId, "DAILY_LESSON");
          sectionProgressList.push(p);
        }

        const completedCount = sectionProgressList.filter(p => p.completed).length;
        const totalCount = sections.length;

        const nextIndex = sectionProgressList.findIndex(p => !p.completed);
        const nextSec = nextIndex >= 0 ? sections[nextIndex] : null;

        let nextActionTip = "Read content and practice in Write Mode or Speak Mode.";
        let nextSectionHeading = null;
        let nextSectionSlug = null;

        if (nextSec) {
          nextSectionHeading = nextSec.heading;
          nextSectionSlug = nextSec.heading.toLowerCase().replace(/[^a-z0-9]/g, "-");
          const h = nextSec.heading.toLowerCase();
          if (h.includes("vocab") || h.includes("word")) {
            nextActionTip = "Read words and save at least 3 words to your AI Notebook.";
          } else if (h.includes("grammar") || h.includes("rule") || h.includes("prep")) {
            nextActionTip = "Study grammar rules and write 3 examples in Write Mode.";
          } else if (h.includes("speaking") || h.includes("drill") || h.includes("pronun")) {
            nextActionTip = "Practice pronunciation using Speak Mode and save attempt.";
          } else if (h.includes("mistake")) {
            nextActionTip = "Review wrong sentences and note corrections in Notebook.";
          } else if (h.includes("quiz")) {
            nextActionTip = "Complete practice quiz and review results.";
          }
        }

        setLearningFlow({
          dayNum,
          lessonTitle,
          completedCount,
          totalCount,
          nextSectionHeading,
          nextSectionSlug,
          nextActionTip,
          lessonExists: true,
        });
      } catch (err) {
        console.error("Error loading learning flow dashboard stats:", err);
      }
    })();
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleImportText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTitle.trim() || !importContent.trim()) {
      alert("Please fill in both Title and Content.");
      return;
    }
    setImporting(true);
    try {
      await aiNotebookService.createNote({
        title: importTitle.trim(),
        sourceType: "User Import",
        originalContent: importContent.trim(),
        note: importNote.trim(),
        tags: ["user-notebook", "import"],
        isUserCreated: true,
        isAdminContent: false,
        contentOwner: "user",
        moduleKey: "user-notebook"
      });
      setImportSuccess(true);
      setImportTitle("");
      setImportContent("");
      setImportNote("");
      window.setTimeout(() => setImportSuccess(false), 3000);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  if (error && !data) {
    return (
      <ErrorState
        message="We couldn't load your dashboard. Please try again."
        onRetry={load}
      />
    );
  }

  if (!data || !insights) {
    return <LoadingState message="Loading your dashboard…" />;
  }

  const firstName = user?.name?.split(" ")[0] ?? "Learner"; return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12 px-4 sm:px-6">




















      {/* 1. Welcome Card (Consolidated Welcome + daily goal + streak) */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        
        

        <div className="relative z-10 space-y-6">


          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Welcome back, {firstName}! 👋
              </h1>
              <p className="mt-1.5 text-xs text-slate-300 font-medium max-w-xl leading-relaxed">
                Step into your daily language training workflow. Study course plans, perform interactive exercises, and log custom texts.
              </p>
              {user?.learningGoal && (
                <p className="mt-2 text-xs text-indigo-200 font-bold">
                  🎯 Target Goal: <span className="font-medium text-slate-300">{user.learningGoal}</span>
                </p>
              )}
            </div>

            <div className="flex gap-3 shrink-0">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3 backdrop-blur text-right min-w-[85px]">
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Level</span>
                <span className="block text-base font-black text-indigo-300 mt-0.5">{isSetupMissing ? "BASIC" : insights.calculatedLevel}</span>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3 backdrop-blur text-right min-w-[85px]">
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Streak</span>
                <span className="block text-base font-black text-amber-400 mt-0.5">🔥 {insights.currentStreak} Days</span>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3 backdrop-blur text-right min-w-[85px]">
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Daily Target</span>
                <span className="block text-base font-black text-indigo-300 mt-0.5">{insights.dailyGoalMinutes}m</span>
              </div>
            </div>
          </div>

          {/* Daily Goal progress integrated directly here */}
          {!isSetupMissing && (
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur max-w-xl">
              <div className="flex justify-between items-center mb-1.5 text-xs font-bold">
                <span className="text-slate-300">Daily Study Goal Progress</span>
                <span className="text-indigo-300">
                  {Math.floor(actualTodayTime / 60)}m {actualTodayTime % 60}s / {insights.dailyGoalMinutes} mins target
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round(((actualTodayTime / 60) / insights.dailyGoalMinutes) * 100))}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400 block pt-1 font-semibold">
                {Math.min(100, Math.round(((actualTodayTime / 60) / insights.dailyGoalMinutes) * 100))}% completed today
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2 & 3. Today's Plan & Continue Learning Section */}
      <div className="space-y-6">
  <Card className="border-indigo-100 bg-white p-5 shadow-sm flex flex-col justify-between">
    <div>
      <h3 className="font-extrabold text-slate-800 text-base">Today's Plan</h3>
      <p className="mt-2 text-sm text-slate-600">Day {learningFlow?.dayNum || 5}: {learningFlow?.lessonTitle || "Lesson"}</p>
      {learningFlow?.nextSectionHeading && (
        <p className="mt-1 text-xs text-slate-500">Next: {learningFlow.nextSectionHeading}</p>
      )}
      <div className="flex gap-2.5 pt-5 border-t border-slate-50 mt-5">
        <Link to={learningFlow?.nextSectionSlug ? `/daily-lessons/day/${learningFlow.dayNum}/section/${learningFlow.nextSectionSlug}` : `/daily-lessons/day/${learningFlow?.dayNum || 5}`}>
          <Button className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 w-full sm:w-auto justify-center">
            Continue Lesson <ArrowRight size={13} />
          </Button>
        </Link>
      </div>
    </div>
  </Card>
      </div>

      {/* 4. Practice Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Practice Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/practice-center?tab=speaking" className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-emerald-200 hover:bg-emerald-50/10">
            <span className="rounded-xl bg-emerald-50 p-3 text-emerald-600 border border-emerald-100/50 shrink-0">
              <Mic size={20} />
            </span>
            <div className="min-w-0">
              <span className="block text-sm font-bold text-slate-800 tracking-tight">Speak</span>
            </div>
          </Link>

          <Link to="/practice-center?tab=writing" className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-indigo-200 hover:bg-indigo-50/10">
            <span className="rounded-xl bg-indigo-50 p-3 text-indigo-600 border border-indigo-100/50 shrink-0">
              <PenTool size={20} />
            </span>
            <div className="min-w-0">
              <span className="block text-sm font-bold text-slate-800 tracking-tight">Write</span>
            </div>
          </Link>

          <Link to="/practice-center?tab=listening" className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-indigo-200 hover:bg-indigo-50/10">
            <span className="rounded-xl bg-violet-50 p-3 text-violet-600 border border-violet-100/50 shrink-0">
              <BookOpen size={20} />
            </span>
            <div className="min-w-0">
              <span className="block text-sm font-bold text-slate-800 tracking-tight">Listen</span>
            </div>
          </Link>
        </div>
      </div>

      {/* 5 & 6. AI Notebook Summary & Mistakes Summary */}
      <div className="grid gap-6 md:grid-cols-2">


        {/* Progress Summary */}
        <Card className="p-5 border-slate-100 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-3">
              <h3 className="font-extrabold text-slate-800 tracking-tight text-xs flex items-center gap-1.5">
                Progress Summary
              </h3>
              <Badge tone="indigo" className="text-[8px] font-bold">{mistakesCount} Mistakes</Badge>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
              Completed sections and overall progress.
            </p>
            <div className="text-sm font-medium mb-2">
              {completedSections}/{learningFlow?.totalCount ?? completedSections} sections completed
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.round((completedSections / (learningFlow?.totalCount ?? completedSections)) * 100))}%` }}></div>
            </div>
          </div>
        </Card>
      </div>





    </div>
  );
}

