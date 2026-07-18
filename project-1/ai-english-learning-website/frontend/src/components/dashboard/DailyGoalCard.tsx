import { CheckCircle2, Circle } from "lucide-react";
import Card from "../common/Card";
import type { DailyTask } from "../../types/learning.types";

interface DailyGoalCardProps {
  tasks: DailyTask[];
  onToggle: (id: string) => void;
}

/** Today's practice checklist with tappable items. */
export function DailyGoalCard({ tasks, onToggle }: DailyGoalCardProps) {
  const done = tasks.filter((t) => t.done).length;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Today's practice</h3>
        <span className="text-sm text-slate-500">
          {done}/{tasks.length} done
        </span>
      </div>
      <ul className="space-y-1.5">
        {tasks.map((t) => (
          <li key={t.id}>
            <button
              onClick={() => onToggle(t.id)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-50"
            >
              {t.done ? (
                <CheckCircle2 className="shrink-0 text-emerald-500" size={20} />
              ) : (
                <Circle className="shrink-0 text-slate-300" size={20} />
              )}
              <span
                className={
                  t.done ? "text-slate-400 line-through" : "text-slate-700"
                }
              >
                {t.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default DailyGoalCard;
