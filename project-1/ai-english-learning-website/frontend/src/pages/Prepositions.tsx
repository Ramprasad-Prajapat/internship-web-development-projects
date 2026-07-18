import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PrepositionCard from "../components/prepositions/PrepositionCard";
import prepositionService from "../services/prepositionService";
import historyService from "../services/historyService";
import aiPracticeService from "../services/aiPracticeService";
import learningService from "../services/mockLearningService";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";
import {
  PREPOSITION_TYPES,
  type PrepositionContent,
  type PrepositionType,
} from "../types/preposition.types";
import type { HistoryEntry } from "../types/history.types";
import type { Mistake } from "../types/mistake.types";
import { FileSpreadsheet, Sparkles, ArrowRight } from "lucide-react";

type CountMap = Record<PrepositionType, { notes: number; mistakes: number }>;

const emptyCounts = (): CountMap => {
  const c = {} as CountMap;
  for (const t of PREPOSITION_TYPES) c[t] = { notes: 0, mistakes: 0 };
  return c;
};

export default function Prepositions() {
  const navigate = useNavigate();
  const [items, setItems] = useState<PrepositionContent[]>([]);
  const [counts, setCounts] = useState<CountMap>(emptyCounts);
  const [totalViewed, setTotalViewed] = useState(0);
  const [totalPracticed, setTotalPracticed] = useState(0);
  const [weakPreps, setWeakPreps] = useState<string[]>([]);
  const [recentActivity, setRecentActivity] = useState<HistoryEntry[]>([]);

  const refresh = useCallback(async () => {
    const [list, c, historyList, mistakesList] = await Promise.all([
      prepositionService.listPrepositions(),
      prepositionService.getCounts(),
      historyService.list(),
      learningService.listMistakes(),
    ]);
    setItems(list);
    setCounts(c);

    // Calculate views and practices
    const views = historyList.filter((h) => h.type === "PREPOSITION_VIEWED").length;
    const practices = historyList.filter((h) => h.type === "PREPOSITION_PRACTICED").length;
    setTotalViewed(views);
    setTotalPracticed(practices);

    // Calculate weak prepositions (those with mistakes)
    const prepMistakes = mistakesList.filter((m) => m.source.startsWith("Preposition"));
    const weakList = Array.from(
      new Set(
        prepMistakes.map((m) => {
          const parts = m.source.split(" ");
          return parts[parts.length - 1]?.toUpperCase();
        }).filter(Boolean)
      )
    );
    setWeakPreps(weakList);

    // Recent activity
    const prepEventTypes = [
      "PREPOSITION_VIEWED",
      "PREPOSITION_PRACTICED",
      "PREPOSITION_NOTE_SAVED",
    ];
    const filteredHistory = historyList.filter((h) => 
      prepEventTypes.includes(h.type) || 
      (h.type === "MISTAKE_SAVED" && h.description && h.description.includes("Preposition"))
    );
    setRecentActivity(filteredHistory.slice(0, 4));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onPractice = (type: PrepositionType) => {
    navigate(`/practice/preposition/${type}`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">Prepositions Module</h1>
          <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
            Master tricky prepositions of direction, time, and relationship through visual examples and quizzes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/prepositions/practice">
            <Button variant="outline" size="sm" className="inline-flex items-center gap-1 text-xs h-9 font-bold">
              <Sparkles size={14} className="text-violet-500" /> Practice Hub
            </Button>
          </Link>
          <Link to="/prepositions/report">
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white inline-flex items-center gap-1.5 text-xs h-9 font-bold shadow-sm">
              <FileSpreadsheet size={15} /> View Analytics Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 border border-slate-100 bg-white shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Prepositions Viewed
          </span>
          <span className="text-xl font-extrabold text-slate-800 block mt-1 tracking-tight">
            {totalViewed} details
          </span>
        </Card>
        <Card className="p-4 border border-slate-100 bg-white shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Quizzes Practiced
          </span>
          <span className="text-xl font-extrabold text-slate-800 block mt-1 tracking-tight">
            {totalPracticed} runs
          </span>
        </Card>
        <Card className="p-4 border border-slate-100 bg-white shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Needs Practice (Weak)
          </span>
          <span className="text-xs font-bold text-rose-500 block mt-1 leading-normal">
            {weakPreps.length > 0 ? weakPreps.join(", ") : "All prepositions clear! 🎉"}
          </span>
        </Card>
      </div>

      {/* Main List */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
          Prepositions Cards
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((content) => (
            <PrepositionCard
              key={content.type}
              content={content}
              counts={counts[content.type] ?? { notes: 0, mistakes: 0 }}
              onPractice={onPractice}
            />
          ))}
        </div>
      </div>

      {/* Recent Preposition Activity */}
      <Card className="p-5 border border-slate-100 bg-white shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
          Recent Preposition Logs
        </h3>
        {recentActivity.length === 0 ? (
          <div className="py-6 text-center text-xs font-semibold text-slate-400">
            No preposition activity logged yet. View or practice a card to begin.
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
    </div>
  );
}
