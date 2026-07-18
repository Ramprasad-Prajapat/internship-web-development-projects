import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  FileSpreadsheet,
  TrendingUp,
  Shapes,
  Bookmark,
  CheckCircle,
  Volume2,
  Trash2,
  Repeat,
  Sparkles,
  Lightbulb,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from "lucide-react";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingState from "../components/common/LoadingState";
import mistakeService from "../services/mistakeService";
import historyService from "../services/historyService";
import { aiNotebookService } from "../services/aiNotebookService";
import learnerInsightsService from "../services/learnerInsightsService";
import type { Mistake } from "../types/mistake.types";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import { useAuth } from "../hooks/useAuth";
import { aiTutorService } from "../services/aiTutorService";

function speak(text: string) {
  if (!text || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function cleanStringForMatch(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
    .replace(/\s+/g, " ");
}

const CATEGORIES = [
  { id: "all", label: "All Mistakes" },
  { id: "Grammar", label: "Grammar" },
  { id: "Vocabulary", label: "Vocabulary" },
  { id: "Pronunciation", label: "Pronunciation" },
  { id: "Speaking", label: "Speaking" },
  { id: "Writing", label: "Writing" },
  { id: "Sentence Making", label: "Sentence Making" },
];

export default function Mistakes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loaded, setLoaded] = useState(false);
  const [savedNotebookIds, setSavedNotebookIds] = useState<string[]>([]);
  const [insights, setInsights] = useState<any>(null);

  // Coach explanation bubble states
  const [selectedMistake, setSelectedMistake] = useState<Mistake | null>(null);
  const [coachExplanation, setCoachExplanation] = useState<string | null>(null);
  const [loadingCoachExplanation, setLoadingCoachExplanation] = useState(false);
  const [coachInput, setCoachInput] = useState("");
  const [coachFeedback, setCoachFeedback] = useState<{ checked: boolean; isCorrect: boolean } | null>(null);

  // Inline details & practice states
  const [cardInputs, setCardInputs] = useState<Record<string, string>>({});
  const [cardFeedback, setCardFeedback] = useState<Record<string, { isCorrect: boolean } | null>>({});
  const [activePracticeId, setActivePracticeId] = useState<string | null>(null);
  const [inlineExplanations, setInlineExplanations] = useState<Record<string, string>>({});
  const [loadingInlineIds, setLoadingInlineIds] = useState<string[]>([]);

  const dominantCategory = useMemo(() => {
    if (mistakes.length === 0) return null;
    const counts: Record<string, number> = {};
    mistakes.forEach(m => {
      const type = m.mistakeType || "Grammar";
      counts[type] = (counts[type] || 0) + 1;
    });
    let maxCat = "Grammar";
    let maxVal = 0;
    Object.entries(counts).forEach(([cat, val]) => {
      if (val > maxVal) {
        maxVal = val;
        maxCat = cat;
      }
    });
    const percentage = Math.round((maxVal / mistakes.length) * 100);
    return { name: maxCat, count: maxVal, percentage };
  }, [mistakes]);

  const refresh = useCallback(async () => {
    const [list, ins] = await Promise.all([
      mistakeService.getMistakes(),
      learnerInsightsService.getInsights(),
    ]);
    setMistakes(list);
    setInsights(ins);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const fetchSelectedExplanation = useCallback(async (mistake: Mistake) => {
    setLoadingCoachExplanation(true);
    setCoachExplanation(null);
    try {
      const res = await aiTutorService.explainContent(
        `Wrong: "${mistake.wrongSentence}" -> Correct: "${mistake.correctSentence}"`,
        mistake.mistakeType
      );
      setCoachExplanation(res.explanation);
    } catch (e) {
      console.error(e);
      setCoachExplanation("Could not load coach explanation. Please try again.");
    } finally {
      setLoadingCoachExplanation(false);
    }
  }, []);

  // Auto-select first unresolved mistake for Coach on load
  useEffect(() => {
    if (loaded && mistakes.length > 0 && !selectedMistake) {
      const firstUnresolved = mistakes.find(m => m.practicedCount === 0);
      const target = firstUnresolved || mistakes[0];
      setSelectedMistake(target);
      void fetchSelectedExplanation(target);
    }
  }, [loaded, mistakes, selectedMistake, fetchSelectedExplanation]);

  const stats = useMemo(() => {
    const total = insights?.mistakesCount ?? mistakes.length;
    const active = insights?.pendingMistakesCount ?? mistakes.filter((m) => !m.practicedCount).length;
    const practiced = total - active;
    return { total, practiced, active };
  }, [mistakes, insights]);

  const filteredMistakes = useMemo(() => {
    if (selectedCategory === "all") return mistakes;
    return mistakes.filter((m) => {
      const type = (m.mistakeType || "").toLowerCase();
      const source = (m.sourceType || "").toLowerCase();
      const rule = (m.simpleRule || "").toLowerCase();
      
      switch (selectedCategory) {
        case "Grammar":
          return type === "grammar" || rule.includes("grammar") || rule.includes("tense") || rule.includes("verb") || rule.includes("preposition");
        case "Vocabulary":
          return type === "vocabulary" || type === "spelling" || rule.includes("word") || rule.includes("spelling");
        case "Pronunciation":
          return type === "pronunciation" || rule.includes("pronun") || rule.includes("sound") || rule.includes("speak");
        case "Speaking":
          return source === "speaking" || type === "speaking" || rule.includes("speak") || rule.includes("fluency");
        case "Writing":
          return source === "writing" || type === "writing" || rule.includes("write") || rule.includes("draft");
        case "Sentence Making":
          return type === "sentence" || rule.includes("sentence") || rule.includes("structure");
        default:
          return true;
      }
    });
  }, [mistakes, selectedCategory]);

  const unresolvedMistakes = useMemo(() => {
    return filteredMistakes.filter(m => !m.practicedCount);
  }, [filteredMistakes]);

  const resolvedMistakes = useMemo(() => {
    return filteredMistakes.filter(m => m.practicedCount > 0);
  }, [filteredMistakes]);

  const handleSelectMistakeForCoach = (mistake: Mistake) => {
    setSelectedMistake(mistake);
    setCoachInput("");
    setCoachFeedback(null);
    void fetchSelectedExplanation(mistake);
    window.scrollTo({ top: 350, behavior: "smooth" });
  };

  const handleToggleInlineExplanation = async (mistake: Mistake) => {
    if (inlineExplanations[mistake.id]) {
      setInlineExplanations(prev => {
        const copy = { ...prev };
        delete copy[mistake.id];
        return copy;
      });
      return;
    }
    
    setLoadingInlineIds(prev => [...prev, mistake.id]);
    try {
      const res = await aiTutorService.explainContent(
        `Wrong: "${mistake.wrongSentence}" -> Correct: "${mistake.correctSentence}"`,
        mistake.mistakeType
      );
      setInlineExplanations(prev => ({ ...prev, [mistake.id]: res.explanation }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInlineIds(prev => prev.filter(id => id !== mistake.id));
    }
  };

  const handleVerifyCoachRewrite = async () => {
    if (!selectedMistake || !coachInput.trim()) return;
    try {
      const isMatched = cleanStringForMatch(coachInput) === cleanStringForMatch(selectedMistake.correctSentence);
      setCoachFeedback({
        checked: true,
        isCorrect: isMatched
      });

      if (isMatched) {
        await mistakeService.markMistakePracticed(selectedMistake.id);
        await historyService.addEntry({
          type: "MISTAKE_REVIEWED",
          title: "AI Coach Rewrite Success",
          description: `Correctly corrected: "${selectedMistake.correctSentence}"`,
          sourceType: "MISTAKES" as any,
          sourceId: selectedMistake.id,
        });
        
        setCoachInput("");
        setCoachFeedback(null);
        
        // Auto-select next unresolved mistake if present
        const nextList = mistakes.filter(m => m.id !== selectedMistake.id && !m.practicedCount);
        if (nextList.length > 0) {
          setSelectedMistake(nextList[0]);
          void fetchSelectedExplanation(nextList[0]);
        } else {
          setSelectedMistake(null);
          setCoachExplanation(null);
        }
        
        await refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifyCardRewrite = async (mistake: Mistake) => {
    const input = cardInputs[mistake.id] || "";
    if (!input.trim()) return;
    try {
      const isMatched = cleanStringForMatch(input) === cleanStringForMatch(mistake.correctSentence);
      setCardFeedback(prev => ({ ...prev, [mistake.id]: { isCorrect: isMatched } }));
      if (isMatched) {
        await mistakeService.markMistakePracticed(mistake.id);
        await historyService.addEntry({
          type: "MISTAKE_REVIEWED",
          title: "Inline Mistake Correction",
          description: `Successfully rewrote: "${mistake.correctSentence}"`,
          sourceType: "MISTAKES" as any,
          sourceId: mistake.id,
        });
        setCardInputs(prev => ({ ...prev, [mistake.id]: "" }));
        setActivePracticeId(null);
        await refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveToNotebook = async (mistake: Mistake) => {
    await aiNotebookService.createNote({
      title: `Mistake Fix: ${mistake.correctSentence.slice(0, 30)}...`,
      sourceType: "Mistake",
      originalContent: `Wrong Sentence: ${mistake.wrongSentence || ""}\nCorrect Sentence: ${mistake.correctSentence}\nRule Applied: ${mistake.simpleRule}`,
      tags: ["mistake", mistake.sourceType.toLowerCase()],
      isUserCreated: true,
      isAdminContent: false,
      contentOwner: "user",
      moduleKey: "user-notebook"
    });
    setSavedNotebookIds((prev) => [...prev, mistake.id]);
  };

  const onDelete = async (id: string) => {
    await mistakeService.deleteMistake(id);
    if (selectedMistake?.id === id) {
      setSelectedMistake(null);
      setCoachExplanation(null);
    }
    await refresh();
  };

  const onRepeat = (mistake: Mistake) => {
    setActivePracticeId(activePracticeId === mistake.id ? null : mistake.id);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
            Mistakes Review
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Review grammar errors and spelling slips logged during your learning activities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-indigo-600 border border-slate-200 bg-white px-2.5 py-1.5 rounded-lg transition-colors shadow-sm/30"
          >
            <FileSpreadsheet size={13} /> Analytics Reports
          </Link>
          <Link
            to="/progress"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 border border-indigo-100 bg-indigo-50/20 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <TrendingUp size={13} /> View Progress
          </Link>
        </div>
      </div>

      {!loaded ? (
        <LoadingState message="Loading your saved mistakes…" />
      ) : mistakes.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={<AlertTriangle size={24} className="text-slate-400" />}
            title="No mistakes saved yet"
            message="Your errors are logged automatically when you do writing tests or preposition quizzes."
            action={
              <Link
                to="/modules"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                Go to Learning Modules
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {/* Summary Stat Cards */}
          <div className="grid gap-4 grid-cols-3">
            <Card className="p-4 border border-slate-100 bg-white flex items-center gap-3">
              <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600 border border-rose-100/50">
                <Bookmark size={18} className="fill-rose-100" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Saved
                </span>
                <span className="text-lg font-extrabold text-slate-800 leading-tight block mt-0.5">
                  {stats.total}
                </span>
              </div>
            </Card>

            <Card className="p-4 border border-slate-100 bg-white flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 border border-amber-100/50">
                <AlertTriangle size={18} />
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Active mistakes
                </span>
                <span className="text-lg font-extrabold text-slate-800 leading-tight block mt-0.5">
                  {stats.active}
                </span>
              </div>
            </Card>

            <Card className="p-4 border border-slate-100 bg-white flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 border border-emerald-100/50">
                <CheckCircle size={18} className="fill-emerald-100" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Reviewed mistakes
                </span>
                <span className="text-lg font-extrabold text-slate-800 leading-tight block mt-0.5">
                  {stats.practiced}
                </span>
              </div>
            </Card>
          </div>

          {/* AI Mistake Coach explanation bubble (Selected Mistake Diagnostics) */}
          {selectedMistake && (
            <Card className="p-5 border border-purple-200 bg-purple-50/5 shadow-sm space-y-4 rounded-3xl">
              <div className="flex items-center justify-between border-b border-purple-100/60 pb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={16} className="text-purple-600 animate-pulse" />
                  <h3 className="font-extrabold text-slate-800 tracking-tight text-xs">
                    AI Mistake Coach — Selected Error Analysis
                  </h3>
                </div>
                <Badge tone="violet" className="text-[8px] font-black uppercase">Active Tutor Mode</Badge>
              </div>

              <div className="grid gap-5 md:grid-cols-2 text-xs">
                {/* Left side: Coach explanation bubble */}
                <div className="space-y-3">
                  <span className="text-[9px] uppercase font-bold text-purple-600 tracking-wider block">Diagnostics Bubble</span>
                  <div className="relative p-4 bg-white border border-purple-100/40 rounded-2xl shadow-sm flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-extrabold shrink-0 border border-purple-200 text-lg">
                      👩‍🏫
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <span className="text-[10px] font-black text-purple-600 block">Coach explanation:</span>
                      {loadingCoachExplanation ? (
                        <div className="space-y-2 py-2 animate-pulse">
                          <div className="h-3 bg-slate-100 rounded w-full"></div>
                          <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                        </div>
                      ) : coachExplanation ? (
                        <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                          {coachExplanation}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Select any mistake card below to request a detailed explanation.</p>
                      )}
                      {selectedMistake.simpleRule && (
                        <div className="mt-3 text-[10px] bg-amber-50 text-amber-800 p-2.5 rounded-xl border border-amber-100/60 font-bold flex items-start gap-1.5">
                          <Lightbulb size={12} className="text-amber-500 shrink-0 mt-0.5" />
                          <span>Rule Applied: {selectedMistake.simpleRule}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Re-write Practice */}
                <div className="space-y-3">
                  <span className="text-[9px] uppercase font-bold text-purple-600 tracking-wider block">Rewrite Playground</span>
                  <div className="p-4 bg-white border border-purple-100/40 rounded-2xl shadow-sm space-y-3">
                    <div>
                      <span className="text-[8px] font-black text-rose-500 uppercase tracking-wider block">Incorrect Sentence</span>
                      <p className="font-extrabold text-slate-700 mt-0.5">"{selectedMistake.wrongSentence}"</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">
                        Rewrite the corrected sentence below
                      </label>
                      <textarea
                        rows={2}
                        value={coachInput}
                        onChange={(e) => {
                          setCoachInput(e.target.value);
                          setCoachFeedback(null);
                        }}
                        placeholder="Type the correction..."
                        className="w-full p-2 bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-lg outline-none text-xs font-semibold"
                      />
                    </div>

                    {coachFeedback?.checked && (
                      <div className={`p-2.5 rounded-xl text-[10px] font-bold border ${
                        coachFeedback.isCorrect ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-rose-50 text-rose-800 border-rose-100"
                      }`}>
                        {coachFeedback.isCorrect ? "✓ Correct! Well done! The mistake was resolved." : `✗ Not quite correct, keep trying!`}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={!coachInput.trim() || loadingCoachExplanation}
                        onClick={handleVerifyCoachRewrite}
                        className="font-extrabold text-[10px] h-8 px-4 bg-purple-600 text-white hover:bg-purple-700 border-none shadow-sm"
                      >
                        Verify Solution
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Filters Row */}
          <div className="flex flex-wrap gap-1.5 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Unresolved Mistakes list */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5 mb-3 px-1">
                🔴 Unresolved Mistakes ({unresolvedMistakes.length})
              </h3>
              
              {unresolvedMistakes.length === 0 ? (
                <Card className="p-5 border border-dashed border-slate-200 bg-slate-50/30 text-center text-xs font-semibold text-slate-400">
                  🎉 Amazing! No unresolved mistakes in this category.
                </Card>
              ) : (
                <div className="grid gap-4">
                  {unresolvedMistakes.map((mistake) => {
                    const isLegacy = mistake.id.startsWith("legacy_");
                    const saved = savedNotebookIds.includes(mistake.id);
                    const isSelected = selectedMistake?.id === mistake.id;
                    const isInlineOpen = !!inlineExplanations[mistake.id];
                    const isLoadingInline = loadingInlineIds.includes(mistake.id);

                    // Check weak area match
                    const userWeakAreas = user?.weakAreas || [];
                    const isWeakArea = userWeakAreas.some(w => 
                      (mistake.mistakeType || "").toLowerCase() === w.toLowerCase() ||
                      (mistake.simpleRule || "").toLowerCase().includes(w.toLowerCase())
                    );

                    return (
                      <Card
                        key={mistake.id}
                        className={`p-5 border transition-all duration-200 hover:shadow-md relative ${
                          isSelected ? "border-purple-400 bg-purple-50/5 shadow-md shadow-purple-500/5" : "border-rose-100 bg-white"
                        }`}
                      >
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge tone={mistake.sourceType === "DAILY_LESSON" ? "indigo" : mistake.sourceType === "PREPOSITION" ? "violet" : mistake.sourceType === "WRITING" ? "sky" : "amber"}>
                            {mistake.sourceType.replace("_", " ")}
                          </Badge>
                          <Badge tone="rose">{mistake.mistakeType || "grammar"}</Badge>
                          {isWeakArea && (
                            <Badge tone="rose" className="text-[8px] font-black uppercase py-0 animate-pulse">
                              🎯 Weak Area Focus
                            </Badge>
                          )}
                          {mistake.sourceTitle && (
                            <span className="text-xs text-slate-400 font-semibold">{mistake.sourceTitle}</span>
                          )}
                          <span className="ml-auto text-[10px] text-slate-400 font-bold">
                            {new Date(mistake.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Incorrect/Incorrect structures comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100/60">
                          {mistake.wrongSentence && (
                            <div className="border-r border-slate-100 pr-2">
                              <span className="text-[8px] font-black text-rose-500 uppercase tracking-wider block">Incorrect Structure</span>
                              <p className="text-xs text-rose-700 font-semibold line-through mt-1">
                                {mistake.wrongSentence}
                              </p>
                            </div>
                          )}
                          <div>
                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider block">Correct Structure</span>
                            <p className="text-xs text-emerald-800 font-extrabold mt-1">
                              {mistake.correctSentence}
                            </p>
                          </div>
                        </div>

                        <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-slate-50 px-3.5 py-2 text-xs text-slate-600 leading-relaxed font-semibold">
                          <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-500" />
                          <span>Rule: {mistake.simpleRule}</span>
                        </p>

                        {/* Collapsible Inline Coach Explanation bubble */}
                        {isInlineOpen && (
                          <div className="mt-3 p-3 bg-purple-50/20 border border-purple-100 rounded-xl space-y-1.5 animate-fade-in">
                            <span className="text-[9px] font-black text-purple-600 uppercase tracking-wider block">🤖 AI Coach Diagnostics Bubble</span>
                            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                              {inlineExplanations[mistake.id]}
                            </p>
                          </div>
                        )}

                        {/* Collapsible Typing Practice Playground */}
                        {(activePracticeId === mistake.id || mistake.practicedCount === 0) && (
                          <div className="mt-3 bg-indigo-50/20 border border-indigo-100/30 p-3 rounded-xl space-y-2">
                            <label className="block text-[8px] font-black text-indigo-700 uppercase tracking-wider">
                              ⚡ Typing Practice Playground
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={cardInputs[mistake.id] || ""}
                                onChange={(e) => {
                                  setCardInputs(prev => ({ ...prev, [mistake.id]: e.target.value }));
                                  setCardFeedback(prev => ({ ...prev, [mistake.id]: null }));
                                }}
                                placeholder="Type the corrected sentence here..."
                                className="flex-1 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none"
                              />
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleVerifyCardRewrite(mistake)}
                                className="text-[9px] font-bold px-3 py-0 h-8"
                                disabled={!(cardInputs[mistake.id] || "").trim()}
                              >
                                Verify
                              </Button>
                            </div>
                            {cardFeedback[mistake.id] && (
                              <p className={`text-[10px] font-bold ${cardFeedback[mistake.id]?.isCorrect ? "text-emerald-600" : "text-rose-500"}`}>
                                {cardFeedback[mistake.id]?.isCorrect ? "✓ Correct! Mistake resolved." : "✗ Not quite correct, keep trying!"}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-50">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onRepeat(mistake)}
                            className="text-xs font-bold px-3 py-1.5 h-8"
                          >
                            <Repeat size={13} /> {activePracticeId === mistake.id ? "Hide practice" : "Practice inline"}
                          </Button>

                          <Button
                            size="sm"
                            variant={isInlineOpen ? "primary" : "outline"}
                            onClick={() => handleToggleInlineExplanation(mistake)}
                            className="text-xs font-bold px-3 py-1.5 h-8"
                            disabled={isLoadingInline}
                          >
                            <Sparkles size={13} className="shrink-0" />
                            {isLoadingInline ? "Asking Coach..." : isInlineOpen ? "Hide Explanation" : "AI Explain"}
                          </Button>

                          <Button
                            size="sm"
                            variant={isSelected ? "primary" : "outline"}
                            onClick={() => handleSelectMistakeForCoach(mistake)}
                            className="text-xs font-bold px-3 py-1.5 h-8 border-purple-200 text-purple-700 hover:bg-purple-50"
                          >
                            <HelpCircle size={13} />
                            {isSelected ? "Selected for Coach ✓" : "Send to Coach"}
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => speak(mistake.correctSentence)}
                            className="text-xs font-bold px-2 py-1.5 h-8"
                          >
                            <Volume2 size={14} /> Listen
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveToNotebook(mistake)}
                            disabled={saved}
                            className="text-xs font-bold px-3 py-1.5 h-8"
                          >
                            <Bookmark size={12} className="text-indigo-500 shrink-0" />
                            {saved ? "Saved ✓" : "Save Note"}
                          </Button>

                          {!isLegacy && (
                            <button
                              type="button"
                              onClick={() => onDelete(mistake.id)}
                              aria-label="Delete mistake"
                              className="ml-auto rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors shrink-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resolved Mistakes list */}
            <div>
              <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 mb-3 px-1">
                🟢 Resolved Mistakes ({resolvedMistakes.length})
              </h3>
              
              {resolvedMistakes.length === 0 ? (
                <Card className="p-5 border border-dashed border-slate-200 bg-slate-50/30 text-center text-xs font-semibold text-slate-400">
                  No resolved mistakes. Practice active ones above to move them here!
                </Card>
              ) : (
                <div className="grid gap-4">
                  {resolvedMistakes.map((mistake) => {
                    const isLegacy = mistake.id.startsWith("legacy_");
                    const saved = savedNotebookIds.includes(mistake.id);
                    const isSelected = selectedMistake?.id === mistake.id;
                    const isInlineOpen = !!inlineExplanations[mistake.id];
                    const isLoadingInline = loadingInlineIds.includes(mistake.id);

                    return (
                      <Card
                        key={mistake.id}
                        className={`p-5 border opacity-80 hover:opacity-100 transition-all duration-200 border-emerald-100 bg-emerald-50/5`}
                      >
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge tone="emerald">Resolved</Badge>
                          <Badge tone="slate">{mistake.mistakeType || "grammar"}</Badge>
                          {mistake.sourceTitle && (
                            <span className="text-xs text-slate-400 font-semibold">{mistake.sourceTitle}</span>
                          )}
                          <span className="ml-auto text-[10px] text-slate-400 font-bold">
                            {new Date(mistake.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Incorrect/Incorrect structures comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100/60">
                          {mistake.wrongSentence && (
                            <div className="border-r border-slate-100 pr-2">
                              <span className="text-[8px] font-black text-rose-500 uppercase tracking-wider block">Incorrect Structure</span>
                              <p className="text-xs text-rose-400 font-semibold line-through mt-1">
                                {mistake.wrongSentence}
                              </p>
                            </div>
                          )}
                          <div>
                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider block">Correct Structure</span>
                            <p className="text-xs text-emerald-800 font-extrabold mt-1">
                              {mistake.correctSentence}
                            </p>
                          </div>
                        </div>

                        <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-slate-50 px-3.5 py-2 text-xs text-slate-600 leading-relaxed font-semibold">
                          <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-500" />
                          <span>Rule: {mistake.simpleRule}</span>
                        </p>

                        {/* Collapsible Inline Coach Explanation bubble */}
                        {isInlineOpen && (
                          <div className="mt-3 p-3 bg-purple-50/20 border border-purple-100 rounded-xl space-y-1.5 animate-fade-in">
                            <span className="text-[9px] font-black text-purple-600 uppercase tracking-wider block">🤖 AI Coach Diagnostics Bubble</span>
                            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                              {inlineExplanations[mistake.id]}
                            </p>
                          </div>
                        )}

                        {/* Collapsible Typing Practice Playground */}
                        {activePracticeId === mistake.id && (
                          <div className="mt-3 bg-indigo-50/20 border border-indigo-100/30 p-3 rounded-xl space-y-2">
                            <label className="block text-[8px] font-black text-indigo-700 uppercase tracking-wider">
                              ⚡ Typing Practice Playground
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={cardInputs[mistake.id] || ""}
                                onChange={(e) => {
                                  setCardInputs(prev => ({ ...prev, [mistake.id]: e.target.value }));
                                  setCardFeedback(prev => ({ ...prev, [mistake.id]: null }));
                                }}
                                placeholder="Type the corrected sentence here..."
                                className="flex-1 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none"
                              />
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleVerifyCardRewrite(mistake)}
                                className="text-[9px] font-bold px-3 py-0 h-8"
                                disabled={!(cardInputs[mistake.id] || "").trim()}
                              >
                                Verify
                              </Button>
                            </div>
                            {cardFeedback[mistake.id] && (
                              <p className={`text-[10px] font-bold ${cardFeedback[mistake.id]?.isCorrect ? "text-emerald-600" : "text-rose-500"}`}>
                                {cardFeedback[mistake.id]?.isCorrect ? "✓ Correct! Practice count updated." : "✗ Not quite correct, keep trying!"}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-50">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onRepeat(mistake)}
                            className="text-xs font-bold px-3 py-1.5 h-8"
                          >
                            <Repeat size={13} /> {activePracticeId === mistake.id ? "Hide practice" : "Practice again"}
                          </Button>

                          <Button
                            size="sm"
                            variant={isInlineOpen ? "primary" : "outline"}
                            onClick={() => handleToggleInlineExplanation(mistake)}
                            className="text-xs font-bold px-3 py-1.5 h-8"
                            disabled={isLoadingInline}
                          >
                            <Sparkles size={13} className="shrink-0" />
                            {isLoadingInline ? "Asking Coach..." : isInlineOpen ? "Hide Explanation" : "AI Explain"}
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => speak(mistake.correctSentence)}
                            className="text-xs font-bold px-2 py-1.5 h-8"
                          >
                            <Volume2 size={14} /> Listen
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveToNotebook(mistake)}
                            disabled={saved}
                            className="text-xs font-bold px-3 py-1.5 h-8"
                          >
                            <Bookmark size={12} className="text-indigo-500 shrink-0" />
                            {saved ? "Saved ✓" : "Save Note"}
                          </Button>

                          {mistake.practicedCount > 0 && (
                            <span className="text-[10px] text-emerald-600 font-extrabold ml-2 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                              Corrected {mistake.practicedCount}×
                            </span>
                          )}

                          {!isLegacy && (
                            <button
                              type="button"
                              onClick={() => onDelete(mistake.id)}
                              aria-label="Delete mistake"
                              className="ml-auto rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors shrink-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
