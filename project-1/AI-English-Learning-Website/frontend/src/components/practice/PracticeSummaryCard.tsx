import { CheckCircle2, ListChecks, NotebookPen, Trophy } from "lucide-react";
import Card from "../common/Card";
import { shortDate } from "../../utils/dateUtils";
import type { PracticeSummary } from "../../types/ai.types";

interface PracticeSummaryCardProps {
  summary: PracticeSummary;
}

/** Small "how you did" card shown on the practice page. */
export function PracticeSummaryCard({ summary }: PracticeSummaryCardProps) {
  const stats = [
    { icon: <ListChecks size={16} />, label: "Answered", value: String(summary.answered) },
    { icon: <CheckCircle2 size={16} />, label: "Correct", value: String(summary.correct) },
    { icon: <Trophy size={16} />, label: "Avg score", value: `${summary.averageScore}` },
    { icon: <NotebookPen size={16} />, label: "Mistakes saved", value: String(summary.mistakesSaved) },
  ];

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Practice summary</h3>
        {summary.lastPracticedAt && (
          <span className="text-xs text-slate-400">
            Last: {shortDate(summary.lastPracticedAt)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
          >
            <div className="flex items-center gap-1.5 text-slate-400">
              {s.icon}
              <span className="text-xs">{s.label}</span>
            </div>
            <p className="mt-1 text-lg font-bold text-slate-800">{s.value}</p>
          </div>
        ))}
      </div>

      {summary.answered > 0 && (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${Math.min(100, summary.averageScore)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Keep going — small daily practice builds real confidence. 🌱
          </p>
        </div>
      )}
    </Card>
  );
}

export default PracticeSummaryCard;
