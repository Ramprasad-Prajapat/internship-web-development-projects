import { BookOpen, Sparkles, HelpCircle, ArrowRight } from "lucide-react";
import type { WeakArea } from "../../types/revision.types";
import Card from "../common/Card";
import Button from "../common/Button";

interface WeakAreaCardProps {
  weakArea: WeakArea;
  onPractice: (key: WeakArea["key"]) => void;
}

export default function WeakAreaCard({ weakArea, onPractice }: WeakAreaCardProps) {
  // Select color & icon based on key
  const config = {
    grammar: { bg: "from-indigo-50 to-purple-50/40", border: "border-indigo-100", text: "text-indigo-600" },
    prepositions: { bg: "from-violet-50 to-pink-50/40", border: "border-violet-100", text: "text-violet-600" },
    vocabulary: { bg: "from-emerald-50 to-teal-50/40", border: "border-emerald-100", text: "text-emerald-600" },
    speaking: { bg: "from-amber-50 to-orange-50/40", border: "border-amber-100", text: "text-amber-600" },
    writing: { bg: "from-sky-50 to-blue-50/40", border: "border-sky-100", text: "text-sky-600" },
    reading: { bg: "from-rose-50 to-red-50/40", border: "border-rose-100", text: "text-rose-600" },
    pronunciation: { bg: "from-orange-50 to-yellow-50/40", border: "border-orange-100", text: "text-orange-600" },
    questions: { bg: "from-teal-50 to-green-50/40", border: "border-teal-100", text: "text-teal-600" },
  }[weakArea.key] || { bg: "from-slate-50 to-slate-100/50", border: "border-slate-200", text: "text-slate-600" };

  return (
    <Card className={`bg-gradient-to-br ${config.bg} ${config.border} p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full`}>
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
            <BookOpen size={16} className={config.text} />
            {weakArea.label}
          </h3>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${config.border} bg-white ${config.text}`}>
            {weakArea.count} {weakArea.count === 1 ? "issue" : "issues"}
          </span>
        </div>

        <p className="text-xs font-semibold text-slate-600 leading-relaxed">
          {weakArea.description}
        </p>

        {weakArea.reasons.length > 0 && (
          <div className="bg-white/80 border border-slate-100 rounded-xl p-3 space-y-1.5">
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">
              AI Detection Basis
            </span>
            <ul className="space-y-1">
              {weakArea.reasons.map((r, i) => (
                <li key={i} className="text-[11px] font-medium text-slate-500 flex items-start gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full mt-1 shrink-0 ${config.text.replace("text-", "bg-")}`} />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="pt-4 mt-auto">
        <Button
          onClick={() => onPractice(weakArea.key)}
          className="w-full flex items-center justify-center gap-1 text-xs py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-sm hover:shadow"
        >
          <Sparkles size={13} className="animate-pulse" />
          Start Mock AI Revision <ArrowRight size={12} />
        </Button>
      </div>
    </Card>
  );
}
