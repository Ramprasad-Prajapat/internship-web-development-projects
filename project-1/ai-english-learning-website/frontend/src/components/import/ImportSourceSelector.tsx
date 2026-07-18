import { CalendarDays, NotebookText, Shapes, type LucideIcon } from "lucide-react";
import { cn } from "../../utils/cn";
import {
  PREPOSITION_TYPES,
  type PrepositionType,
} from "../../types/preposition.types";
import type { ImportSaveType } from "../../types/import.types";

const OPTIONS: {
  value: ImportSaveType;
  label: string;
  desc: string;
  icon: LucideIcon;
}[] = [
  {
    value: "daily",
    label: "Daily Lesson",
    desc: "Day-wise lesson (needs a day number)",
    icon: CalendarDays,
  },
  {
    value: "general",
    label: "General Lesson",
    desc: "Saved to your Lesson Library",
    icon: NotebookText,
  },
  {
    value: "preposition",
    label: "Preposition Note",
    desc: "Note on a specific preposition",
    icon: Shapes,
  },
];

interface ImportSourceSelectorProps {
  value: ImportSaveType;
  onChange: (value: ImportSaveType) => void;
  prepositionType: PrepositionType | null;
  onPrepositionChange: (value: PrepositionType) => void;
}

/** Pick where the imported content is saved (with a preposition picker). */
export function ImportSourceSelector({
  value,
  onChange,
  prepositionType,
  onPrepositionChange,
}: ImportSourceSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map(({ value: v, label, desc, icon: Icon }) => {
          const active = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              aria-pressed={active}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors",
                active
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-200 bg-white hover:bg-slate-50",
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 font-medium",
                  active ? "text-indigo-700" : "text-slate-700",
                )}
              >
                <Icon size={16} /> {label}
              </span>
              <span className="text-xs text-slate-500">{desc}</span>
            </button>
          );
        })}
      </div>

      {value === "preposition" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Which preposition?
          </label>
          <select
            className="input-base"
            aria-label="Preposition"
            value={prepositionType ?? ""}
            onChange={(e) => onPrepositionChange(e.target.value as PrepositionType)}
          >
            <option value="" disabled>
              Select a preposition…
            </option>
            {PREPOSITION_TYPES.map((p) => (
              <option key={p} value={p}>
                {p.toUpperCase()}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            Pick which preposition this note is about (required for a
            preposition note).
          </p>
        </div>
      )}
    </div>
  );
}

export default ImportSourceSelector;
