import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Clock,
  Flame,
  Award,
  AlertTriangle,
  BookOpen,
  Printer,
  Copy,
  CheckCircle,
  TrendingUp,
  Layers,
  Sparkle
} from "lucide-react";
import historyService from "../services/historyService";
import aiPracticeService from "../services/aiPracticeService";
import dailyLessonService from "../services/dailyLessonService";
import mistakeService from "../services/mistakeService";
import learnerInsightsService, { type LearnerInsights } from "../services/learnerInsightsService";
import { mockDatabase } from "../services/mockDatabase";
import Button from "../components/common/Button";
import Card from "../components/common/Card";

export default function EnglishReportView() {
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [insights, setInsights] = useState<LearnerInsights | null>(null);
  
  // Weekly Review & Stats State
  const [stats, setStats] = useState({
    lessonsCompleted: 0,
    sectionsCompleted: 0,
    notesSaved: 0,
    mistakesSaved: 0,
    studyStreak: 5,
    practiceScore: 85,
    studyTimeMinutes: 45,
    drillsDone: 12,
  });

  const [recentMistake, setRecentMistake] = useState<{ original: string; correction: string; category: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ins, histList, answersList, mistakesList] = await Promise.all([
        learnerInsightsService.getInsights(),
        historyService.list(),
        aiPracticeService.listAnswers(),
        mistakeService.getMistakes ? mistakeService.getMistakes() : Promise.resolve([]),
      ]);

      setInsights(ins);

      // Unique days viewed
      const viewedDays = new Set(
        histList.filter((h: any) => h.type === "DAILY_LESSON_VIEWED").map((h: any) => h.dayNumber)
      );

      // Calculations
      const lessonsCompleted = viewedDays.size || ins.lessonsCompletedCount || 1;
      const sectionsCompleted = ins.sectionsCompletedCount || 3;
      const notesSaved = ins.notebookNotesCount || 4;
      const mistakesSaved = ins.mistakesCount || mistakesList.length || 0;
      
      // Calculate a practice score based on answers if available, otherwise default to 85%
      let score = 85;
      if (answersList.length > 0) {
        const correctCount = answersList.filter((a: any) => a.score >= 80 || a.isCorrect || a.status === "passed").length;
        score = Math.round((correctCount / answersList.length) * 100);
      }

      setStats({
        lessonsCompleted,
        sectionsCompleted,
        notesSaved,
        mistakesSaved,
        studyStreak: ins.currentStreak || 5,
        practiceScore: score || 85,
        studyTimeMinutes: ins.completedMinutesToday || 45,
        drillsDone: ins.speakingChecksCount + ins.writingChecksCount || 12,
      });

      // Fetch a recent mistake for preview
      if (mistakesList.length > 0) {
        const latest = mistakesList[mistakesList.length - 1];
        setRecentMistake({
          original: latest.wrongSentence || "",
          correction: latest.correctSentence || "",
          category: latest.mistakeType || "grammar"
        });
      } else {
        setRecentMistake(null);
      }
    } catch (e) {
      console.error("Failed to load report analytics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onCopy = () => {
    const text = `English Progress Report
Generated: ${new Date().toLocaleDateString()}
Mode: Frontend Simulation Preview
----------------------------------------
* Lessons Completed: ${stats.lessonsCompleted}
* Sections Completed: ${stats.sectionsCompleted}
* Notes Saved: ${stats.notesSaved}
* Mistakes Saved: ${stats.mistakesSaved}
* Practice Score: ${stats.practiceScore}%
* Current Study Streak: ${stats.studyStreak} days
----------------------------------------
Keep practicing 20 minutes daily to build your routine!`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onPrint = () => {
    window.print();
  };

  const handleGenerateReport = () => {
    // Simulated Refresh / Generation of mock summary
    loadData();
  };

  // Skill progress bars mock data (derived from metrics)
  const skills = [
    { name: "Speaking", percent: Math.min(40 + (insights?.speakingChecksCount || 0) * 10, 100) },
    { name: "Writing", percent: Math.min(30 + (insights?.writingChecksCount || 0) * 12, 100) },
    { name: "Grammar", percent: Math.max(50, stats.practiceScore - 10) },
    { name: "Vocabulary", percent: Math.min(45 + (insights?.notebookNotesCount || 0) * 5, 100) },
    { name: "Reading", percent: Math.min(20 + stats.lessonsCompleted * 15, 100) },
    { name: "AI Notebook / Review", percent: Math.min(35 + (insights?.notebookReviewedCount || 0) * 15, 100) }
  ];

  // Last 7 days simulation
  const last7Days = [
    { label: "Mon", active: true },
    { label: "Tue", active: true },
    { label: "Wed", active: false },
    { label: "Thu", active: true },
    { label: "Fri", active: true },
    { label: "Sat", active: false },
    { label: "Sun", active: true }
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 space-y-6 animate-fade-in pb-12">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="space-y-1">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-violet-600 transition-colors"
          >
            <ArrowLeft size={13} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              My English Report
            </h1>
            <span className="text-[9px] font-black text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
              Frontend Preview
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold">
            Track your lessons, practice, notebook, mistakes, and daily progress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button
            size="sm"
            onClick={handleGenerateReport}
            className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs h-9 px-4 rounded-xl border-none flex-1 md:flex-none"
          >
            Generate Report
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCopy}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 font-extrabold text-xs h-9 px-4 rounded-xl flex-1 md:flex-none"
          >
            {copied ? (
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-emerald-600" /> Copied!</span>
            ) : (
              <span className="flex items-center gap-1"><Copy size={14} /> Copy Report</span>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onPrint}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 font-extrabold text-xs h-9 px-4 rounded-xl flex-1 md:flex-none"
          >
            <Printer size={14} className="mr-1" /> Print
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-60 bg-white border border-slate-250/60 rounded-2xl flex items-center justify-center text-slate-400 font-semibold text-sm">
          Compiling English study progress...
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            
            {/* 1. Summary Cards (Exactly 6 cards) */}
            <Card className="border border-slate-200/60 bg-white p-5 space-y-4 shadow-sm rounded-2xl">
              <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider text-violet-600 border-b border-slate-100 pb-2">
                <Layers size={15} /> Overall Performance
              </h3>
              
              <div className="grid gap-3 grid-cols-2">
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                  <span className="block text-lg font-black text-slate-900">{stats.lessonsCompleted}</span>
                  <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Lessons Completed</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                  <span className="block text-lg font-black text-slate-900">{stats.sectionsCompleted}</span>
                  <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Sections Completed</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                  <span className="block text-lg font-black text-slate-900">{stats.notesSaved}</span>
                  <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Notes Saved</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                  <span className="block text-lg font-black text-slate-900">{stats.mistakesSaved}</span>
                  <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Mistakes Saved</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                  <span className="block text-lg font-black text-slate-900">{stats.studyStreak}d</span>
                  <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Study Streak</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                  <span className="block text-lg font-black text-violet-600">{stats.practiceScore}%</span>
                  <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Practice Score</span>
                </div>
              </div>
            </Card>

            {/* 2. Weekly Review */}
            <Card className="border border-slate-200/60 bg-white p-5 space-y-4 shadow-sm rounded-2xl">
              <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider text-violet-600 border-b border-slate-100 pb-2">
                <Clock size={15} /> Weekly Review
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Weekly Study Time</span>
                  <span className="font-bold text-slate-900">{stats.studyTimeMinutes} mins</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 border-t border-slate-50 pt-2">
                  <span>Lessons Completed</span>
                  <span className="font-bold text-slate-900">{stats.lessonsCompleted} unit(s)</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 border-t border-slate-50 pt-2">
                  <span>Drills Completed</span>
                  <span className="font-bold text-slate-900">{stats.drillsDone} drill(s)</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 border-t border-slate-50 pt-2">
                  <span>Mistakes Found</span>
                  <span className="font-bold text-slate-900">{stats.mistakesSaved} mistakes</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 border-t border-slate-50 pt-2">
                  <span>Notes Saved</span>
                  <span className="font-bold text-slate-900">{stats.notesSaved} notes</span>
                </div>
              </div>
            </Card>

            {/* 3. Mock AI Summary */}
            <Card className="border border-violet-100 bg-violet-50/50 p-5 space-y-4 shadow-sm rounded-2xl">
              <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider text-violet-700 border-b border-violet-100/50 pb-2">
                <Sparkle size={15} /> Mock AI Weekly Summary
              </h3>
              <div className="space-y-3.5">
                <div className="flex justify-between items-start text-xs font-semibold text-slate-700">
                  <span>Strongest Area:</span>
                  <span className="font-bold text-slate-800 text-right">
                    {stats.practiceScore >= 80 ? "Vocabulary & Comprehension" : "Reading Daily Passages"}
                  </span>
                </div>
                <div className="flex justify-between items-start text-xs font-semibold text-slate-700 border-t border-violet-150/40 pt-2">
                  <span>Weakest Area:</span>
                  <span className="font-bold text-slate-800 text-right">
                    {stats.mistakesSaved > 0 ? "Preposition Usage" : "Speaking Fluency Drills"}
                  </span>
                </div>
                <div className="flex justify-between items-start text-xs font-semibold text-slate-700 border-t border-violet-150/40 pt-2">
                  <span>Focus Tomorrow:</span>
                  <span className="font-bold text-slate-800 text-right">
                    Practice correct verb agreement in speaking exercises.
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            {/* 4. Course Progress */}
            <Card className="border border-slate-200/60 bg-white p-5 space-y-4 shadow-sm rounded-2xl">
              <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider text-violet-600 border-b border-slate-100 pb-2">
                <BookOpen size={15} /> Course Progress
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Current Day:</span>
                  <span className="font-bold text-slate-900">Day {insights?.lastLessonDay || 1}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 border-t border-slate-50 pt-2">
                  <span>Current Streak:</span>
                  <span className="font-bold text-slate-900">{stats.studyStreak} days</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 border-t border-slate-50 pt-2">
                  <span>Completed Sections:</span>
                  <span className="font-bold text-slate-900">{stats.sectionsCompleted} sections</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 border-t border-slate-50 pt-2">
                  <span>Recommended Lesson:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[50%]">
                    {insights?.lastLessonTitle || "Day 1 Basics"}
                  </span>
                </div>
                
                <Link to="/modules/english-course" className="block pt-2">
                  <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold h-9 rounded-xl border-none">
                    Continue Lesson
                  </Button>
                </Link>
              </div>
            </Card>

            {/* 5. Skill Progress */}
            <Card className="border border-slate-200/60 bg-white p-5 space-y-4 shadow-sm rounded-2xl">
              <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider text-violet-600 border-b border-slate-100 pb-2">
                <TrendingUp size={15} /> Skill Progress
              </h3>
              <div className="space-y-3">
                {skills.map((skill) => (
                  <div key={skill.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{skill.name}</span>
                      <span>{skill.percent}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-600 rounded-full transition-all"
                        style={{ width: `${skill.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 6. Mistake Report */}
            <Card className="border border-slate-200/60 bg-white p-5 space-y-4 shadow-sm rounded-2xl">
              <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider text-violet-600 border-b border-slate-100 pb-2">
                <AlertTriangle size={15} /> Mistake Report
              </h3>
              
              {stats.mistakesSaved === 0 ? (
                <div className="py-6 text-center text-xs font-semibold text-slate-400">
                  No mistakes found. Excellent grammar accuracy!
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                    <span>Total Mistakes Saved:</span>
                    <span className="font-bold text-rose-600">{stats.mistakesSaved}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700 border-t border-slate-50 pt-2">
                    <span>Most Recent Category:</span>
                    <span className="font-bold text-slate-900">{recentMistake?.category || "Grammar"}</span>
                  </div>
                  
                  {recentMistake && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] space-y-1.5">
                      <div className="text-slate-500"><span className="font-bold text-rose-500">Wrong:</span> "{recentMistake.original}"</div>
                      <div className="text-slate-700"><span className="font-bold text-emerald-600">Correct:</span> "{recentMistake.correction}"</div>
                    </div>
                  )}

                  <Link to="/mistakes" className="block pt-2">
                    <Button variant="outline" className="w-full text-xs font-extrabold h-9 rounded-xl border-slate-200">
                      Review Mistakes
                    </Button>
                  </Link>
                </div>
              )}
            </Card>

            {/* 7. 7-Day Activity */}
            <Card className="border border-slate-200/60 bg-white p-5 space-y-4 shadow-sm rounded-2xl">
              <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider text-violet-600 border-b border-slate-100 pb-2">
                <Flame size={15} /> 7-Day Activity
              </h3>
              <div className="flex justify-between items-center pt-2">
                {last7Days.map((day) => (
                  <div key={day.label} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-black uppercase transition-all ${
                        day.active
                          ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {day.label.slice(0, 1)}
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">{day.label}</span>
                  </div>
                ))}
              </div>
            </Card>
            
          </div>
        </div>
      )}
    </div>
  );
}
