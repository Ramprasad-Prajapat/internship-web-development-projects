import Card from "../common/Card";
import { cn } from "../../utils/cn";
import type { SkillKey, SkillProgress } from "../../types/learning.types";

const colorBar: Record<SkillKey, string> = {
  speaking: "bg-indigo-500",
  writing: "bg-violet-500",
  reading: "bg-emerald-500",
  vocabulary: "bg-sky-500",
  grammar: "bg-amber-500",
};

/** A single skill's progress shown as a labelled bar. */
export function SkillProgressCard({ skill }: { skill: SkillProgress }) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium text-slate-700">{skill.label}</span>
        <span className="text-sm text-slate-500">
          {skill.done}/{skill.target}
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-100">
        <div
          className={cn(
            "h-2.5 rounded-full transition-all",
            colorBar[skill.key],
          )}
          style={{ width: `${skill.value}%` }}
        />
      </div>
    </Card>
  );
}

export default SkillProgressCard;
