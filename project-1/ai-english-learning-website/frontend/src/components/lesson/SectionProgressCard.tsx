import React from "react";
import { CheckCircle2, Circle, BookOpen, Volume2, Save, PenTool, Mic, Check } from "lucide-react";
import type { SectionProgress } from "../../types/sectionProgress.types";
import Button from "../common/Button";

interface SectionProgressCardProps {
  progress: SectionProgress;
  onMarkComplete: () => void;
}

export default function SectionProgressCard({ progress, onMarkComplete }: SectionProgressCardProps) {
  const checklist = [
    { label: "Read section", checked: progress.viewed, icon: <BookOpen size={16} className="text-indigo-500" /> },
    { label: "Listen section", checked: progress.listened, icon: <Volume2 size={16} className="text-emerald-500" /> },
    { label: "Save note", checked: progress.savedToNotebook, icon: <Save size={16} className="text-amber-500" /> },
    { label: "Write practice", checked: progress.writingChecked, icon: <PenTool size={16} className="text-sky-500" /> },
    { label: "Speak practice", checked: progress.speakingChecked, icon: <Mic size={16} className="text-rose-500" /> },
  ];

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm/30 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800">Section Progress</h3>
        <p className="text-xs text-slate-400">Complete tasks to finish this section.</p>
      </div>

      <div className="space-y-2.5">
        {checklist.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs font-semibold ${
              item.checked
                ? "bg-emerald-50/45 border-emerald-100 text-emerald-800"
                : "bg-slate-50/50 border-slate-100 text-slate-600"
            }`}
          >
            <div className="flex items-center gap-2">
              {item.icon}
              <span>{item.label}</span>
            </div>
            <div>
              {item.checked ? (
                <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-50" />
              ) : (
                <Circle size={16} className="text-slate-300" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2">
        <Button
          onClick={onMarkComplete}
          className="w-full justify-center"
          variant={progress.completed ? "secondary" : "primary"}
        >
          {progress.completed ? (
            <span className="flex items-center gap-1.5 justify-center">
              <Check size={16} /> Section Completed
            </span>
          ) : (
            "Mark Section Complete"
          )}
        </Button>
      </div>
    </div>
  );
}
