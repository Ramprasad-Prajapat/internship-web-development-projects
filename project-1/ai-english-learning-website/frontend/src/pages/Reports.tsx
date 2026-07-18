import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Shapes,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Award,
  Bookmark,
  CheckCircle,
  Copy,
  Printer,
  Sparkles,
  Flame,
  Clock,
  RefreshCw,
  BookOpen,
  Inbox,
  ShieldAlert,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import dailyLessonService from "../services/dailyLessonService";
import prepositionService from "../services/prepositionService";
import aiPracticeService from "../services/aiPracticeService";
import historyService from "../services/historyService";
import mistakeService from "../services/mistakeService";
import { aiNotebookService } from "../services/aiNotebookService";
import learningService from "../services/mockLearningService";
import { useAuth } from "../hooks/useAuth";
import type { Lesson } from "../types/lesson.types";
import type { ProgressMap } from "../types/dailyLesson.types";
import learnerInsightsService from "../services/learnerInsightsService";
import practiceCenterService from "../services/practiceCenterService";

export default function Reports() {
  const { user } = useAuth();

  // Data State
  const [streak, setStreak] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [dailyProgress, setDailyProgress] = useState<ProgressMap>({});
  const [stats, setStats] = useState({
    lessonsCompleted: 0,
    sectionsCompleted: 0,
    writingChecks: 0,
    speakingChecks: 0,
    notebookCount: 0,
    mistakesSaved: 0,
    revisionCount: 0,
    notebookReviewedCount: 0,
    quizzesTaken: 0,
    avgQuizScore: 0,
  });

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [insights, setInsights] = useState<any>(null);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [
        insights,
        dailyLsnList,
        dailyProgList,
        histList,
        allNotes,
        allMistakes,
      ] = await Promise.all([
        learnerInsightsService.getInsights(),
        dailyLessonService.listDailyLessons(),
        dailyLessonService.getProgress(),
        historyService.list(),
        aiNotebookService.listNotes(),
        mistakeService.getMistakes(),
      ]);

      setStreak(insights.currentStreak);
      setLessons(dailyLsnList);
      setDailyProgress(dailyProgList);
      setInsights(insights);

      const writingAttempts = insights.writingChecksCount;
      const speakingAttempts = insights.speakingChecksCount;
      const revisionCompleted = histList.filter((h) => String(h.type).includes("REVISION") || h.title?.toLowerCase().includes("revision")).length;

      const savedSentences = learnerInsightsService.getSavedSentences();
      const reviewedCount =
        allNotes.filter((n) => n.reviewedAt).length +
        savedSentences.filter((s) => s.reviewedAt).length +
        allMistakes.filter((m) => m.reviewedAt).length;

      const quizAttempts = await practiceCenterService.getQuizAttempts();
      const quizzesCount = quizAttempts.length;
      const avgScore = quizzesCount > 0
        ? Math.round(quizAttempts.reduce((acc, q) => acc + q.score, 0) / quizzesCount)
        : 0;

      setStats({
        lessonsCompleted: insights.lessonsCompletedCount,
        sectionsCompleted: insights.sectionsCompletedCount,
        writingChecks: writingAttempts,
        speakingChecks: speakingAttempts,
        notebookCount: insights.notebookNotesCount + insights.savedSentencesCount,
        mistakesSaved: insights.mistakesCount,
        revisionCount: revisionCompleted,
        notebookReviewedCount: reviewedCount,
        quizzesTaken: quizzesCount,
        avgQuizScore: avgScore,
      });
    } catch (e) {
      console.error("Failed to load report stats:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const handleGenerateMockReport = async () => {
    setLoading(true);
    try {
      // Seed a log to history
      await historyService.addEntry({
        type: "DAILY_LESSON_VIEWED",
        title: "Studied Lesson: Past Progressive",
        description: "Reviewed grammar rules and typical examples.",
        sourceType: "DAILY_LESSON",
        sourceId: "w1d4",
        dayNumber: 4,
      });

      // Save a checked answer
      await aiPracticeService.saveAnswer({
        questionId: "mock-q-" + Date.now(),
        sourceType: "DAILY_LESSON",
        sourceId: "w1d4",
        sourceTitle: "Past Progressive",
        questionText: "Complete the sentence: While she was reading, he ___ (sleep).",
        userAnswer: "was sleeping",
        result: {
          wrongSentence: "",
          correctSentence: "While she was reading, he was sleeping.",
          simpleRule: "Use past progressive for simultaneous actions in the past.",
          practiceAgain: "",
          score: 100,
          isCorrect: true,
        },
      });

      alert("New mock study activity successfully generated! Stats have been refreshed.");
      loadReportData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onCopy = () => {
    const text = `
=========================================
MY ENGLISH REPORT - LEARNERS DASHBOARD
=========================================
- Study Streak: ${streak} Days
- Lessons Completed: ${stats.lessonsCompleted}
- Sections Completed: ${stats.sectionsCompleted}
- Writing Checks: ${stats.writingChecks}
- Speaking Checks: ${stats.speakingChecks}
- Notebook Notes: ${stats.notebookCount} (${stats.notebookReviewedCount} Reviewed)
- Saved Mistakes: ${stats.mistakesSaved}
- Revision Completed: ${stats.revisionCount}

Generated on: ${new Date().toLocaleString()}
=========================================
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // English Course Progress calculations
  const maxDay = Object.keys(dailyProgress).reduce((max, dayNum) => Math.max(max, Number(dayNum)), 0);
  const currentDay = maxDay > 0 ? maxDay : 1;
  const completedDaysCount = Object.values(dailyProgress).filter((p) => p.completed).length;

  const currentLesson = lessons.find((l) => l.dayNumber === currentDay) || lessons[0];
  const nextLesson = lessons.find((l) => l.dayNumber === currentDay + 1) || lessons[0];

  // Skill percentages formulas
  const speakingPercent = Math.min(100, stats.speakingChecks * 20);
  const writingPercent = Math.min(100, stats.writingChecks * 20);
  const grammarPercent = Math.min(100, stats.sectionsCompleted * 10);
  const vocabPercent = Math.min(100, stats.notebookCount * 10);
  const readingPercent = Math.min(100, stats.lessonsCompleted * 20);
  const notebookPercent = Math.min(100, stats.notebookReviewedCount * 20);
  const revisionPercent = Math.min(100, stats.revisionCount * 25);

  const recentWeakArea = user?.weakAreas && user.weakAreas.length > 0 ? user.weakAreas[0] : "Prepositions";

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* 1. Report Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <Link
            to="/modules"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 bg-white hover:bg-indigo-50/30 px-2.5 py-1 rounded-lg transition-colors shadow-sm/30 mb-2"
          >
            ← Back to Modules
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
              My English Report
            </h1>

          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Track your lessons, practice, notebook, mistakes, and daily progress.
          </p>
        </div>

        {/* Action Panel Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateMockReport}
            className="inline-flex items-center gap-1 text-xs h-8.5 font-bold border-indigo-100 text-indigo-600 hover:bg-indigo-50/40"
          >
            Generate Mock Report
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onCopy}
            className="inline-flex items-center gap-1 text-xs h-8.5 font-bold"
          >
            {copied ? (
              <>
                <CheckCircle size={13} className="text-emerald-600" /> Copied!
              </>
            ) : (
              <>
                <Copy size={13} /> Copy Report
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1 text-xs h-8.5 font-bold"
          >
            <Printer size={13} /> Print
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs font-semibold text-slate-400">
          Gathering report stats from local mock database...
        </div>
      ) : (
        <div className="space-y-6">
          {/* 2. Summary Cards */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <Card className="p-4 border border-slate-100 bg-white shadow-sm hover:border-indigo-100 transition-colors">
              <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Lessons Completed</span>
              <span className="block text-2xl font-black text-slate-800 mt-1">{stats.lessonsCompleted}</span>
              <span className="block text-[8.5px] font-bold text-indigo-500/80 mt-1">Admin-controlled</span>
            </Card>

            <Card className="p-4 border border-slate-100 bg-white shadow-sm hover:border-indigo-100 transition-colors">
              <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Sections Completed</span>
              <span className="block text-2xl font-black text-slate-800 mt-1">{stats.sectionsCompleted}</span>
              <span className="block text-[8.5px] font-bold text-indigo-500/80 mt-1">Admin-controlled</span>
            </Card>

            <Card className="p-4 border border-slate-100 bg-white shadow-sm hover:border-indigo-100 transition-colors">
              <span className="block text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider">Writing Checks</span>
              <span className="block text-2xl font-black text-indigo-600 mt-1">{stats.writingChecks}</span>
              <span className="block text-[8.5px] font-bold text-indigo-500 mt-1">User learning content</span>
            </Card>

            <Card className="p-4 border border-slate-100 bg-white shadow-sm hover:border-indigo-100 transition-colors">
              <span className="block text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider">Speaking Checks</span>
              <span className="block text-2xl font-black text-indigo-600 mt-1">{stats.speakingChecks}</span>
              <span className="block text-[8.5px] font-bold text-indigo-500 mt-1">User learning content</span>
            </Card>

            <Card className="p-4 border border-slate-100 bg-white shadow-sm hover:border-indigo-100 transition-colors">
              <span className="block text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider">Notebook Notes</span>
              <span className="block text-2xl font-black text-indigo-600 mt-1">{stats.notebookCount}</span>
              <span className="block text-[8.5px] font-bold text-indigo-500 mt-1">
                User learning content · {stats.notebookReviewedCount} Reviewed
              </span>
            </Card>

            <Card className="p-4 border border-slate-100 bg-white shadow-sm hover:border-indigo-100 transition-colors">
              <span className="block text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider">Mistakes Saved</span>
              <span className="block text-2xl font-black text-indigo-600 mt-1">{stats.mistakesSaved}</span>
              <span className="block text-[8.5px] font-bold text-indigo-500 mt-1">User learning content</span>
            </Card>

            <Card className="p-4 border border-slate-100 bg-white shadow-sm hover:border-indigo-100 transition-colors">
              <span className="block text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider">Revision Completed</span>
              <span className="block text-2xl font-black text-indigo-600 mt-1">{stats.revisionCount}</span>
              <span className="block text-[8.5px] font-bold text-indigo-500 mt-1">User learning content</span>
            </Card>

            <Card className="p-4 border border-slate-100 bg-white shadow-sm hover:border-indigo-100 transition-colors">
              <span className="block text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider">Quizzes Completed</span>
              <span className="block text-2xl font-black text-indigo-600 mt-1">{stats.quizzesTaken}</span>
              <span className="block text-[8.5px] font-bold text-indigo-500 mt-1">User learning content</span>
            </Card>

            <Card className="p-4 border border-slate-100 bg-white shadow-sm hover:border-indigo-100 transition-colors">
              <span className="block text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider">Avg Practice Score</span>
              <span className="block text-2xl font-black text-indigo-600 mt-1">{stats.avgQuizScore}%</span>
              <span className="block text-[8.5px] font-bold text-indigo-500 mt-1">User learning content</span>
            </Card>

            <Card className="p-4 border border-indigo-100 bg-indigo-50/20 shadow-sm flex flex-col justify-between">
              <div>
                <span className="block text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider">Study Streak</span>
                <span className="block text-2xl font-black text-indigo-950 mt-1">{streak} Days</span>
              </div>
              <span className="self-end text-amber-500">
                <Flame size={18} className="fill-amber-400 animate-pulse" />
              </span>
            </Card>
          </div>

          {/* Weekly Performance Review Card */}
          {insights?.weeklyReport && (
            <Card className="p-6 border border-indigo-100 bg-gradient-to-r from-indigo-50/10 via-transparent to-indigo-50/5 shadow-sm space-y-4">
              <div className="border-b border-indigo-100/40 pb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 uppercase tracking-wider text-indigo-600">
                    <Sparkles size={16} className="text-indigo-500 animate-pulse" />
                    Weekly Review
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    Your learning efficiency summary and AI recommendations for this week.
                  </p>
                </div>

              </div>

              <div className="grid gap-4 grid-cols-2 sm:grid-cols-5 text-center">
                <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Study Time</span>
                  <span className="block text-lg font-black text-slate-800 mt-1">{insights.weeklyReport.studyMinutes || 45} mins</span>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Lessons Studied</span>
                  <span className="block text-lg font-black text-slate-800 mt-1">{insights.weeklyReport.lessonsViewed || 2} Units</span>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Drills Done</span>
                  <span className="block text-lg font-black text-slate-800 mt-1">{insights.weeklyReport.practiceCompleted || 6} practices</span>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Mistakes Solved</span>
                  <span className="block text-lg font-black text-slate-800 mt-1">{insights.weeklyReport.mistakesReviewed || 3} mistakes</span>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm col-span-2 sm:col-span-1">
                  <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Notes Saved</span>
                  <span className="block text-lg font-black text-slate-800 mt-1">{insights.weeklyReport.notesSaved || 4} cards</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 pt-1">
                <div className="p-3.5 bg-indigo-50/20 border border-indigo-100/30 rounded-2xl">
                  <span className="text-[9px] font-extrabold text-indigo-700 uppercase tracking-wider block">Weekly Diagnostics</span>
                  <div className="mt-2 space-y-1.5 text-xs font-semibold text-slate-700">
                    <p>💪 <b className="text-slate-500">Strongest Area:</b> <span className="text-indigo-700 font-extrabold">{insights.weeklyReport.strongestArea || "Reading Comprehension"}</span></p>
                    <p>🎯 <b className="text-slate-500">Weakest Area:</b> <span className="text-rose-600 font-extrabold">{insights.weeklyReport.weakArea || "Prepositions"}</span></p>
                  </div>
                </div>

                <div className="p-3.5 bg-purple-50/20 border border-purple-100/30 rounded-2xl">
                  <span className="text-[9px] font-extrabold text-purple-700 uppercase tracking-wider block">Focus Suggestion</span>
                  <div className="mt-2 text-xs font-semibold text-slate-700 leading-normal">
                    <p>💡 {insights.weeklyReport.nextWeekFocus || "Next week, focus on daily writing correction drills and listen to speaker pronunciations."}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              {/* 3. English Course Progress */}
              <Card className="p-5 border border-slate-100 bg-white shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 uppercase tracking-wider text-indigo-600">
                      <BookOpen size={16} /> English Course Progress
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                      Completed roadmap stages for admin-controlled syllabus days.
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded font-medium">Read-Only</span>
                </div>

                <div className="grid gap-3 grid-cols-3 text-center">
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Current Day</span>
                    <span className="block text-lg font-black text-indigo-950 mt-0.5">Day {currentDay}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Completed Days</span>
                    <span className="block text-lg font-black text-indigo-950 mt-0.5">{completedDaysCount} Days</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Completed Sections</span>
                    <span className="block text-lg font-black text-indigo-950 mt-0.5">{stats.sectionsCompleted} Units</span>
                  </div>
                </div>

                <div className="bg-indigo-50/20 p-3.5 rounded-2xl border border-indigo-100/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider block">Recommended Lesson</span>
                    <span className="text-xs font-bold text-slate-700 block mt-0.5">
                      {currentLesson?.title || "Daily Grammar Study"}
                    </span>
                  </div>
                  <Link to={`/daily-lessons/day/${currentDay}`}>
                    <Button size="sm" className="text-xs font-bold h-8 px-4 whitespace-nowrap">
                      Continue Lesson
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* 5. Mistake Report */}
              <Card className="p-5 border border-slate-100 bg-white shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 uppercase tracking-wider text-rose-600">
                    <ShieldAlert size={16} /> Mistake Report
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    Recent mistakes logs tracked across study units.
                  </p>
                </div>

                <div className="grid gap-3 grid-cols-2 text-center">
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Total Mistakes</span>
                    <span className="block text-lg font-black text-rose-600 mt-0.5">{stats.mistakesSaved} saved</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Recent Weak Area</span>
                    <span className="block text-sm font-black text-slate-700 mt-1 truncate">{recentWeakArea}</span>
                  </div>
                </div>

                <div className="border border-rose-100 rounded-2xl p-4 bg-rose-50/20 space-y-2">
                  <span className="text-[9px] font-extrabold text-rose-700 uppercase tracking-wider block">Grammar Pattern Correction</span>
                  <div className="text-xs space-y-1 text-slate-600 font-semibold">
                    <p className="line-through text-rose-500">❌ I am looking forward to see you.</p>
                    <p className="text-emerald-600">✔ I am looking forward to seeing you.</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                      Rule: 'Look forward to' is a prepositional phrase, requiring the gerund form (-ing).
                    </p>
                  </div>
                </div>

                <Link to="/mistakes" className="block">
                  <Button variant="outline" className="w-full text-xs font-bold h-9">
                    Review Mistakes
                  </Button>
                </Link>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* 4. Skill Progress */}
              <Card className="p-5 border border-slate-100 bg-white shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 uppercase tracking-wider text-emerald-600">
                    <TrendingUp size={16} /> Skill Progress
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    Calculated proficiency ratings dynamically updated from study activities.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {/* Speaking */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Speaking</span>
                      <span className="text-indigo-600">{speakingPercent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${speakingPercent}%` }} />
                    </div>
                  </div>

                  {/* Writing */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Writing</span>
                      <span className="text-indigo-600">{writingPercent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${writingPercent}%` }} />
                    </div>
                  </div>

                  {/* Grammar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Grammar</span>
                      <span className="text-indigo-600">{grammarPercent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${grammarPercent}%` }} />
                    </div>
                  </div>

                  {/* Vocabulary */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Vocabulary</span>
                      <span className="text-indigo-600">{vocabPercent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${vocabPercent}%` }} />
                    </div>
                  </div>

                  {/* Reading */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Reading</span>
                      <span className="text-indigo-600">{readingPercent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${readingPercent}%` }} />
                    </div>
                  </div>

                  {/* Notebook */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>AI Notebook</span>
                      <span className="text-indigo-600">{notebookPercent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${notebookPercent}%` }} />
                    </div>
                  </div>

                  {/* Revision */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Revision</span>
                      <span className="text-indigo-600">{revisionPercent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${revisionPercent}%` }} />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Activity Heatmap */}
              <Card className="p-5 border border-slate-100 bg-white shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 uppercase tracking-wider text-indigo-600">
                    <Calendar size={16} /> 7-Day Activity
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    Visual timeline of your practice, writing, speaking, and lesson activities over the last 7 days.
                  </p>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center">
                  {(() => {
                    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    const today = new Date();
                    const last7Days = Array.from({ length: 7 }).map((_, idx) => {
                      const d = new Date();
                      d.setDate(today.getDate() - (6 - idx));
                      return d;
                    });

                    const heatmapData = insights?.activityHeatmap || [];

                    return last7Days.map((d, idx) => {
                      const dayLabel = days[d.getDay()];
                      const isToday = d.toDateString() === today.toDateString();

                      const dayActivities = heatmapData[idx]?.categories || [];
                      const count = dayActivities.length;

                      let bgClass = "bg-slate-100";
                      if (count === 1) bgClass = "bg-indigo-100";
                      else if (count === 2) bgClass = "bg-indigo-300";
                      else if (count >= 3) bgClass = "bg-indigo-600 text-white";

                      return (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <span className="text-[9px] font-bold text-slate-400">{dayLabel}</span>
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-[11px] transition-all relative group ${bgClass}`}
                            title={`${count} activities on ${d.toLocaleDateString()}`}
                          >
                            {count > 0 ? count : ""}
                            {isToday && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white" />
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 pt-2">
                  <span>Less active</span>
                  <div className="flex gap-1">
                    <span className="w-3.5 h-3.5 bg-slate-100 rounded-md border border-slate-200/50" />
                    <span className="w-3.5 h-3.5 bg-indigo-100 rounded-md border border-indigo-200/20" />
                    <span className="w-3.5 h-3.5 bg-indigo-300 rounded-md border border-indigo-300/20" />
                    <span className="w-3.5 h-3.5 bg-indigo-600 rounded-md" />
                  </div>
                  <span>More active</span>
                </div>
              </Card>

              {/* Weak Area Heatmap */}



            </div>
          </div>
        </div>
      )}
    </div>
  );
}
