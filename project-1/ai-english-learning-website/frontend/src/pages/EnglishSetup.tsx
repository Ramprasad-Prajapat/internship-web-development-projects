import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ShieldCheck, Check } from "lucide-react";
import authService from "../services/authService";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";
import type { UserLevel } from "../types/auth.types";

const LEVELS: { value: UserLevel; label: string; desc: string }[] = [
  { value: "BEGINNER", label: "Beginner", desc: "Just starting to study English" },
  { value: "BASIC", label: "Basic", desc: "Simple sentences and everyday words" },
  { value: "INTERMEDIATE", label: "Intermediate", desc: "Fluent conversations and grammar structures" },
  { value: "ADVANCED", label: "Advanced", desc: "Professional and academic vocabulary" },
];

const DAILY_GOALS = [
  { value: 10, label: "10 min/day", desc: "Casual study" },
  { value: 15, label: "15 min/day", desc: "Regular practice" },
  { value: 30, label: "30 min/day", desc: "Serious study" },
  { value: 60, label: "60 min/day", desc: "Intensive training" },
];

const WEAK_AREAS = [
  "Speaking Clarity",
  "Grammar Accuracy",
  "Vocabulary Range",
  "Pronunciation Flow",
  "Writing Drafts",
  "Reading Comprehension",
  "Listening Exercises",
  "Prepositions Use",
];

const FOCUS_AREAS = [
  "Interactive Quizzes",
  "Writing Audits",
  "Speaking Drills",
  "Mistakes Review",
  "Spelling/Dictation",
];

export default function EnglishSetup() {
  const navigate = useNavigate();
  const currentUser = authService.getUser();

  const [level, setLevel] = useState<UserLevel>(currentUser?.level || "BEGINNER");
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(currentUser?.dailyGoalMinutes || 20);
  const [learningGoal, setLearningGoal] = useState(currentUser?.learningGoal || "");
  const [selectedWeakAreas, setSelectedWeakAreas] = useState<string[]>(currentUser?.weakAreas || []);
  const [preferredPracticeFocus, setPreferredPracticeFocus] = useState(
    currentUser?.preferredPracticeFocus || "Interactive Quizzes"
  );
  const [error, setError] = useState<string | null>(null);

  const toggleWeakArea = (area: string) => {
    setSelectedWeakAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleSave = () => {
    if (!learningGoal.trim()) {
      setError("Please write down your main English learning goal.");
      return;
    }
    setError(null);

    authService.updateUser({
      level,
      dailyGoalMinutes,
      learningGoal: learningGoal.trim(),
      weakAreas: selectedWeakAreas,
      preferredPracticeFocus,
    });

    navigate("/dashboard");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6 animate-fade-in pb-16">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold shadow-sm/30">
          <Sparkles size={12} className="text-indigo-500 animate-pulse" />
          <span>Personalize Study Plan</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
          Personalize Your Learning Setup
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Choose your settings to help the <span className="font-bold text-indigo-600">Mock AI Coach</span> recommend lessons and track daily progress.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-600">
          {error}
        </div>
      )}

      {/* Step 1: English Level */}
      <Card className="p-6 space-y-4 border border-slate-100 shadow-sm bg-white">
        <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
          <Badge tone="indigo">1</Badge> Select English Level
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LEVELS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLevel(opt.value)}
              className={`text-left p-4 rounded-xl border transition-all duration-150 relative ${
                level === opt.value
                  ? "border-indigo-600 bg-indigo-50/20 shadow-sm ring-1 ring-indigo-600"
                  : "border-slate-100 bg-white hover:bg-slate-50/50"
              }`}
            >
              <h4 className="text-xs font-extrabold text-slate-800">{opt.label}</h4>
              <p className="text-[11px] font-medium text-slate-400 mt-1">{opt.desc}</p>
              {level === opt.value && (
                <span className="absolute top-3 right-3 h-4 w-4 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Step 2: Daily Study Goal */}
      <Card className="p-6 space-y-4 border border-slate-100 shadow-sm bg-white">
        <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
          <Badge tone="indigo">2</Badge> Select Daily Study Goal
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DAILY_GOALS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDailyGoalMinutes(opt.value)}
              className={`p-3 rounded-xl border text-center transition-all duration-150 relative ${
                dailyGoalMinutes === opt.value
                  ? "border-indigo-600 bg-indigo-50/20 shadow-sm ring-1 ring-indigo-600"
                  : "border-slate-100 bg-white hover:bg-slate-50/50"
              }`}
            >
              <h4 className="text-xs font-extrabold text-slate-800">{opt.label}</h4>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Step 3: Main English Goal */}
      <Card className="p-6 space-y-4 border border-slate-100 shadow-sm bg-white">
        <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
          <Badge tone="indigo">3</Badge> Write Your Learning Goal
        </h3>
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            What is your primary English target?
          </label>
          <input
            type="text"
            className="input-base text-xs"
            placeholder="e.g., Speak confidently in workplace meetings and reduce grammar mistakes"
            value={learningGoal}
            onChange={(e) => setLearningGoal(e.target.value)}
          />
        </div>
      </Card>

      {/* Step 4: Weak Areas & Practice Focus */}
      <Card className="p-6 space-y-6 border border-slate-100 shadow-sm bg-white">
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
            <Badge tone="indigo">4</Badge> Target Weak Areas (Select multiple)
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {WEAK_AREAS.map((area) => {
              const active = selectedWeakAreas.includes(area);
              return (
                <button
                  key={area}
                  onClick={() => toggleWeakArea(area)}
                  className={`text-left px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all duration-150 ${
                    active
                      ? "border-indigo-600 bg-indigo-50/20 text-indigo-700 font-extrabold"
                      : "border-slate-100 bg-white text-slate-600 hover:bg-slate-50/50"
                  }`}
                >
                  {area}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-50 pt-5 space-y-3">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
            <Badge tone="indigo">5</Badge> Preferred Study Activity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {FOCUS_AREAS.map((focus) => (
              <button
                key={focus}
                onClick={() => setPreferredPracticeFocus(focus)}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-center transition-all duration-150 ${
                  preferredPracticeFocus === focus
                    ? "border-indigo-600 bg-indigo-50/20 text-indigo-700 font-extrabold"
                    : "border-slate-100 bg-white text-slate-600 hover:bg-slate-50/50"
                }`}
              >
                {focus}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Permissions Notification callout */}
      <div className="flex gap-3 bg-amber-50/40 border border-amber-100 rounded-xl p-4 text-[11px] text-amber-700 leading-relaxed font-semibold">
        <ShieldCheck size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-extrabold uppercase text-amber-800 tracking-wider">Frontend Preview Info</p>
          <p className="mt-0.5">
            Your study setup is saved locally in localStorage. This setup coordinates your Dashboard, Reports, and Mock AI suggestions. Custom study values are 100% user learning content.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="rounded-xl px-5 text-xs font-bold"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="rounded-xl px-6 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-md shadow-indigo-200"
        >
          Save Study Plan
        </Button>
      </div>
    </div>
  );
}
