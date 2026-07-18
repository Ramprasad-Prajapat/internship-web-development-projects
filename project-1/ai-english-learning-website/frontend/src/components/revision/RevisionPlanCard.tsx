import { useState } from "react";
import { CheckCircle, Play, ClipboardList, HelpCircle, CheckCircle2, ChevronRight, XCircle } from "lucide-react";
import type { RevisionTask } from "../../types/revision.types";
import Card from "../common/Card";
import Button from "../common/Button";

interface RevisionPlanCardProps {
  tasks: RevisionTask[];
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onStart: (task: RevisionTask) => void;
}

type TabType = "pending" | "completed" | "skipped";

export default function RevisionPlanCard({ tasks, onComplete, onSkip, onStart }: RevisionPlanCardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("pending");

  const filteredTasks = tasks.filter(t => {
    if (activeTab === "pending") return !t.completed && !t.skipped;
    if (activeTab === "completed") return t.completed;
    return t.skipped;
  });

  const getModuleColor = (mod: RevisionTask["module"]) => {
    switch (mod) {
      case "Mistakes": return "bg-rose-50 text-rose-600 border-rose-100";
      case "AI Notebook": return "bg-indigo-50 text-indigo-600 border-indigo-100";
      case "Prepositions": return "bg-violet-50 text-violet-600 border-violet-100";
      case "Daily Lessons": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
          <ClipboardList size={18} className="text-indigo-600" />
          Today's Revision Queue
        </h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
          {tasks.filter(t => !t.completed && !t.skipped).length} Pending
        </span>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-50 rounded-xl p-1 gap-1 border border-slate-100">
        {(["pending", "completed", "skipped"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-[11px] font-extrabold capitalize py-1.5 rounded-lg border transition-all ${
              activeTab === tab
                ? "bg-white text-indigo-600 border-slate-100 shadow-sm"
                : "text-slate-500 border-transparent hover:text-slate-700"
            }`}
          >
            {tab} ({
              tab === "pending" ? tasks.filter(t => !t.completed && !t.skipped).length
              : tab === "completed" ? tasks.filter(t => t.completed).length
              : tasks.filter(t => t.skipped).length
            })
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-6 bg-slate-50/40 rounded-2xl border border-dashed border-slate-100">
            <CheckCircle2 size={24} className="mx-auto text-slate-300 mb-2 animate-bounce" />
            <p className="text-xs font-semibold text-slate-400">
              No tasks in this queue list.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="space-y-1.5 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${getModuleColor(task.module)}`}>
                    {task.module}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                    ⏱ {task.timeEstimate}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-800 leading-tight">
                  {task.title}
                </h4>
                <p className="text-xs font-medium text-slate-500">
                  {task.reason}
                </p>
              </div>

              {activeTab === "pending" && (
                <div className="flex items-center gap-2 sm:self-center shrink-0">
                  <Button
                    onClick={() => onStart(task)}
                    variant="ghost"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 text-xs py-1.5 px-3 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl"
                  >
                    <Play size={12} className="fill-slate-700" /> Start
                  </Button>
                  <Button
                    onClick={() => onComplete(task.id)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 text-xs py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                  >
                    <CheckCircle size={12} /> Done
                  </Button>
                  <Button
                    onClick={() => onSkip(task.id)}
                    variant="ghost"
                    className="p-2 border border-transparent text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded-xl shrink-0"
                    title="Skip for today"
                  >
                    <XCircle size={14} />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
