import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LogOut,
  Mail,
  Target,
  Clock,
  User as UserIcon,
  Settings,
  ShieldAlert,
  Flame,
  Layers,
  CheckCircle,
  Check,
  Award,
  BookOpen
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import authService from "../services/authService";
import historyService from "../services/historyService";
import dailyLessonService from "../services/dailyLessonService";
import prepositionService from "../services/prepositionService";
import aiPracticeService from "../services/aiPracticeService";
import mistakeService from "../services/mistakeService";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import type { UserLevel } from "../types/auth.types";
import { mockDatabase } from "../services/mockDatabase";
import learnerInsightsService, { type LearnerInsights } from "../services/learnerInsightsService";

const LEVEL_OPTIONS: { value: UserLevel; label: string }[] = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "BASIC", label: "Basic" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const TIME_OPTIONS = [10, 15, 20, 30, 45];

const GOAL_OPTIONS = [
  "Speak daily English",
  "Improve writing",
  "Learn grammar",
  "Improve vocabulary",
  "Interview preparation",
];

const WEAK_AREAS_OPTIONS = [
  "Speaking",
  "Writing",
  "Grammar",
  "Vocabulary",
  "Pronunciation",
  "Sentence making",
];

export default function UserProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Settings State variables
  const [level, setLevel] = useState<UserLevel>("BEGINNER");
  const [goal, setGoal] = useState("");
  const [minutes, setMinutes] = useState(20);
  const [weakAreas, setWeakAreas] = useState<string[]>([]);

  // Account Settings state
  const [displayName, setDisplayName] = useState("");
  const [preferredLang, setPreferredLang] = useState("English");

  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [streak, setStreak] = useState(5); // Default to 5 per requirements
  const [insights, setInsights] = useState<LearnerInsights | null>(null);

  // Clear data confirmation
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // Statistics
  const [stats, setStats] = useState({
    lessonsViewed: 0,
    lessonsPracticed: 0,
    notebookCount: 0,
    mistakesSaved: 0,
    homeworkCompleted: 0,
    speakingAttempts: 0,
  });

  useEffect(() => {
    if (user) {
      setLevel(user.level ?? "BEGINNER");
      setGoal(user.learningGoal ?? "Speak daily English");
      setMinutes(user.dailyGoalMinutes ?? 20);
      setWeakAreas(user.weakAreas ?? []);
      setDisplayName(user.name ?? "");
      setPreferredLang(user.preferredLanguage ?? "English");

      learnerInsightsService.getInsights().then((ins) => {
        setInsights(ins);
        setStreak(ins.currentStreak || 5);
      });

      const fetchStats = async () => {
        try {
          const [
            histList,
            allAnswers,
            ins,
          ] = await Promise.all([
            historyService.list(),
            aiPracticeService.listAnswers(),
            learnerInsightsService.getInsights(),
          ]);

          const viewedDays = new Set(
            histList.filter((h) => h.type === "DAILY_LESSON_VIEWED").map((h) => h.dayNumber)
          );
          
          // Get saved homework count from mockDatabase key
          const hwList = mockDatabase.getCollection(mockDatabase.DB_KEYS.homeworkProgress);
          const homeworkCount = hwList.filter((h: any) => h.homework_checked || h.homework_completed).length;

          setStats({
            lessonsViewed: viewedDays.size || ins.lessonsCompletedCount,
            lessonsPracticed: ins.lessonsCompletedCount || viewedDays.size,
            notebookCount: ins.notebookNotesCount,
            mistakesSaved: ins.mistakesCount,
            homeworkCompleted: homeworkCount,
            speakingAttempts: ins.speakingChecksCount,
          });
        } catch (e) {
          console.error("Failed to load profile stats", e);
        }
      };

      fetchStats();
    }
  }, [user]);

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  const onSave = async () => {
    if (!user) return;
    authService.updateUser({
      name: displayName,
      level,
      learningGoal: goal,
      dailyGoalMinutes: minutes,
      weakAreas,
      preferredLanguage: preferredLang,
    });

    await historyService.addEntry({
      type: "PROFILE_UPDATED",
      title: "Settings updated",
      description: "Updated English preferences, study goal, weak areas, and display configurations.",
      sourceType: "PROFILE",
      sourceId: user.id,
    });

    refreshUser();
    setSavedMsg("Preferences saved successfully! 🎉");
    window.setTimeout(() => setSavedMsg(null), 2500);
  };

  const handleWeakAreaChange = (area: string) => {
    if (weakAreas.includes(area)) {
      setWeakAreas(weakAreas.filter((a) => a !== area));
    } else {
      setWeakAreas([...weakAreas, area]);
    }
  };

  const handleResetData = () => {
    if (confirmText.trim().toLowerCase() !== "delete my data") {
      alert("Please type 'delete my data' exactly to confirm.");
      return;
    }

    const keysToClear = [
      "eng_vocab",
      "eng_mistakes",
      "eng_homework",
      "eng_today_tasks",
      "eng_counts",
      "eng_daily_scores",
      "eng_streak",
      "eng_seeded_v1",
      "eng_history",
      "eng_daily_progress",
      "eng_prep_notes",
      "eng_prep_quiz_results",
      "eng_p4_questions",
      "eng_p4_answers",
      "eng_p4_sessions",
      "eng_p5_extension_inbox",
      "eng_extension_seeded_v1",
      "eng_ai_notebook_items",
    ];

    mockDatabase.clearKeys(keysToClear);
    alert("Local mock data successfully cleared! The application will now reload to restore defaults.");
    window.location.reload();
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 space-y-6 animate-fade-in pb-12">
      {/* Navigation breadcrumb */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Profile & Settings
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Manage your personal learning preferences, daily goals, and account settings.
          </p>
        </div>
      </div>

      {/* 1. Purple Profile Header */}
      <Card className="border-none bg-gradient-to-r from-violet-700 via-violet-600 to-indigo-700 text-white p-6 shadow-lg relative overflow-hidden rounded-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center flex-col sm:flex-row gap-5 text-center sm:text-left min-w-0 flex-1">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl font-black text-violet-700 shadow-md">
              {displayName.charAt(0).toUpperCase() || "D"}
            </div>
            
            <div className="space-y-1 min-w-0">
              <h2 className="text-xl font-black tracking-tight">{displayName || "Demo Learner"}</h2>
              <p className="text-xs text-violet-100 font-semibold truncate">
                {user.email || "demo@example.com"}
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 pt-2">
                <span className="px-2 py-0.5 bg-white/10 text-white text-[10px] font-black rounded-lg uppercase tracking-wider">
                  Demo User
                </span>
                <span className="px-2 py-0.5 bg-white/10 text-white text-[10px] font-black rounded-lg uppercase tracking-wider">
                  Level: {level.toLowerCase()}
                </span>
                <span className="px-2 py-0.5 bg-white/10 text-white text-[10px] font-black rounded-lg uppercase tracking-wider">
                  English Learner
                </span>
                <span className="px-2 py-0.5 bg-white/10 text-white text-[10px] font-black rounded-lg uppercase tracking-wider">
                  Frontend Preview
                </span>
              </div>
            </div>
          </div>

          <Link to="/modules/english-course" className="shrink-0 w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-white text-violet-700 hover:bg-violet-50 font-black shadow-md h-10 px-5 rounded-xl transition-all text-xs inline-flex items-center justify-center">
              Continue Learning
            </button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* 2. Learning Preferences */}
          <Card className="border border-slate-200/60 bg-white p-5 space-y-4 shadow-sm rounded-2xl">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider text-violet-600">
                <Settings size={15} /> Learning Preferences
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">English Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as UserLevel)}
                  className="input-base w-full bg-white text-xs font-bold border-slate-200 focus:border-violet-500 rounded-xl"
                >
                  {LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Daily Study Time</label>
                <select
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="input-base w-full bg-white text-xs font-bold border-slate-200 focus:border-violet-500 rounded-xl"
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time} minutes
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Main Goal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="input-base w-full bg-white text-xs font-bold border-slate-200 focus:border-violet-500 rounded-xl"
                >
                  {GOAL_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Weak Areas</label>
                <div className="flex flex-wrap gap-1.5">
                  {WEAK_AREAS_OPTIONS.map((area) => {
                    const isChecked = weakAreas.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => handleWeakAreaChange(area)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all ${
                          isChecked
                            ? "bg-violet-50 border-violet-200 text-violet-700 shadow-sm"
                            : "bg-slate-50/50 border-slate-200 text-slate-600 hover:border-slate-350"
                        }`}
                      >
                        {area}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Button onClick={onSave} className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold h-9 px-6 shadow-md shadow-violet-600/10 rounded-xl border-none">
                  Save Preferences
                </Button>
                {savedMsg && (
                  <span className="text-xs font-bold text-emerald-600 animate-fade-in">
                    {savedMsg}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* 3. Daily Study Goal */}
          <Card className="border border-slate-200/60 bg-white p-5 space-y-4 shadow-sm rounded-2xl">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider text-violet-600">
                  <Clock size={15} /> Daily Study Goal
                </h3>
              </div>
              <span className="rounded-xl bg-amber-500 p-2 text-white shadow-md shadow-amber-500/20">
                <Flame size={16} className="fill-amber-300 border-none" />
              </span>
            </div>

            <div className="grid gap-3 grid-cols-3">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <span className="block text-lg font-black text-slate-900">{minutes}m</span>
                <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Daily Goal</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <span className="block text-lg font-black text-slate-900">150m</span>
                <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Weekly Goal</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <span className="block text-lg font-black text-violet-600">{streak}</span>
                <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Current Streak</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-150/80 p-3.5 rounded-xl flex items-center justify-between gap-3">
              <div>
                <span className="text-[9px] font-black text-violet-600 uppercase tracking-wider block">Recommended Next</span>
                <span className="text-xs font-bold text-slate-800 block mt-0.5">
                  Speaking Practice Drill
                </span>
              </div>
              <Link to="/modules/english-course">
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold h-7.5 px-3 whitespace-nowrap rounded-lg border-none">
                  Open Course
                </Button>
              </Link>
            </div>

            <div className="flex gap-2 pt-1">
              <Link to="/modules/english-course" className="flex-1">
                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold h-9 rounded-xl border-none">
                  Open English Course
                </Button>
              </Link>
              <Link to="/modules" className="flex-1">
                <Button variant="outline" className="w-full text-xs font-extrabold h-9 rounded-xl border-slate-200">
                  Open Modules Planner
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* 4. Progress Summary */}
          <Card className="border border-slate-200/60 bg-white p-5 space-y-4 shadow-sm rounded-2xl">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider text-violet-600">
                <Layers size={15} /> Progress Summary
              </h3>
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl text-center">
                <span className="block text-lg font-black text-slate-900">{stats.lessonsViewed}</span>
                <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Lessons Completed</span>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl text-center">
                <span className="block text-lg font-black text-slate-900">{stats.lessonsPracticed}</span>
                <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Sections Completed</span>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl text-center">
                <span className="block text-lg font-black text-slate-900">{stats.notebookCount}</span>
                <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Notes Saved</span>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl text-center">
                <span className="block text-lg font-black text-slate-900">{stats.mistakesSaved}</span>
                <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Mistakes Saved</span>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl text-center">
                <span className="block text-lg font-black text-slate-900">{stats.homeworkCompleted}</span>
                <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Homework Completed</span>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl text-center">
                <span className="block text-lg font-black text-slate-900">{stats.speakingAttempts}</span>
                <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Speaking Practice</span>
              </div>
            </div>
          </Card>

          {/* 5. Account Settings */}
          <Card className="border border-slate-200/60 bg-white p-5 space-y-4 shadow-sm rounded-2xl">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider text-slate-400">
                <UserIcon size={15} /> Account Settings
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Display Name</label>
                <input
                  type="text"
                  className="input-base w-full text-xs font-bold border-slate-200 focus:border-violet-500 rounded-xl"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Demo Learner"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Preferred Language / Mode</label>
                <select
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value)}
                  className="input-base w-full bg-white text-xs font-bold border-slate-200 focus:border-violet-500 rounded-xl"
                >
                  <option value="English">English only (Full Immersion)</option>
                  <option value="English-Hindi">English & Hindi (Bilingual Mode)</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 pt-4">
                <Button variant="outline" onClick={onLogout} className="text-xs font-extrabold h-9 px-4 rounded-xl border-slate-200">
                  <LogOut size={14} className="mr-1" /> Logout
                </Button>

                <Button variant="ghost" onClick={() => setShowClearConfirm(!showClearConfirm)} className="text-xs font-extrabold h-9 text-rose-600 hover:bg-rose-50 rounded-xl">
                  <ShieldAlert size={14} className="mr-1" /> Reset Demo Preferences / Data
                </Button>
              </div>

              {showClearConfirm && (
                <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 space-y-3 animate-fade-in">
                  <h4 className="text-xs font-extrabold text-rose-800">Confirm Account Reset</h4>
                  <p className="text-[10px] text-rose-600 leading-normal font-bold">
                    Warning: This will delete all customized parameters and reset local mock records. Type <span className="font-extrabold text-rose-800 bg-rose-100 px-1 rounded">delete my data</span> to execute.
                  </p>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="input-base max-w-xs bg-white text-rose-700 border-rose-200 focus:border-rose-400 focus:ring-rose-250 text-xs font-bold rounded-xl"
                        placeholder="delete my data"
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleResetData}
                        disabled={confirmText.trim().toLowerCase() !== "delete my data"}
                        className="text-xs font-extrabold h-8.5 rounded-xl border-none"
                      >
                        Reset Data
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
