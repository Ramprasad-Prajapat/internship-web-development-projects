import { Check, X } from "lucide-react";
import Card from "../common/Card";
import type { PrepositionContent } from "../../types/preposition.types";

interface PrepositionRuleCardProps {
  content: PrepositionContent;
}

/** Meaning + one-line rule + when to use / when not to use. */
export function PrepositionRuleCard({ content }: PrepositionRuleCardProps) {
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-semibold text-slate-800">Simple meaning</h2>
        <p className="mt-1 text-slate-600">{content.meaning}</p>
      </div>

      <div className="rounded-xl bg-indigo-50 px-4 py-3">
        <p className="text-sm font-medium text-indigo-700">💡 {content.rule}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 font-semibold text-emerald-700">
            <Check size={16} /> When to use
          </h3>
          <ul className="space-y-1.5">
            {content.whenToUse.map((item, i) => (
              <li
                key={i}
                className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm text-slate-700"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 font-semibold text-rose-700">
            <X size={16} /> When not to use
          </h3>
          <ul className="space-y-1.5">
            {content.whenNotToUse.map((item, i) => (
              <li
                key={i}
                className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm text-slate-700"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

export default PrepositionRuleCard;
