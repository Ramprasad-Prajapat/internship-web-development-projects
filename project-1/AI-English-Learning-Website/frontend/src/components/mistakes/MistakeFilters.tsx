import { PRACTICE_SOURCE_TYPES } from "../../types/ai.types";
import type { MistakeSourceFilter } from "../../types/mistake.types";
import { SOURCE_LABELS } from "./MistakeCard";

interface MistakeFiltersProps {
  value: MistakeSourceFilter;
  onChange: (value: MistakeSourceFilter) => void;
  counts: Record<MistakeSourceFilter, number>;
}

const OPTIONS: MistakeSourceFilter[] = ["all", ...PRACTICE_SOURCE_TYPES];

function label(option: MistakeSourceFilter): string {
  return option === "all" ? "All" : SOURCE_LABELS[option];
}

/** Source filter chips for the Mistakes page (All / Daily / Preposition / …). */
export function MistakeFilters({ value, onChange, counts }: MistakeFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={[
              "rounded-full px-3 py-1 text-sm font-medium transition-colors",
              active
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100",
            ].join(" ")}
          >
            {label(option)}
            <span
              className={[
                "ml-1.5 text-xs",
                active ? "text-indigo-100" : "text-slate-400",
              ].join(" ")}
            >
              {counts[option] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default MistakeFilters;
