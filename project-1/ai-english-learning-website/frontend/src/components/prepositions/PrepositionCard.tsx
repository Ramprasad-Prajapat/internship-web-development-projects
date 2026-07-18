import { Link } from "react-router-dom";
import { AlertTriangle, Dumbbell, StickyNote } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import Badge from "../common/Badge";
import type { PrepositionContent } from "../../types/preposition.types";

interface PrepositionCardProps {
  content: PrepositionContent;
  counts: { notes: number; mistakes: number };
  onPractice: (type: PrepositionContent["type"]) => void;
}

export function PrepositionCard({
  content,
  counts,
  onPractice,
}: PrepositionCardProps) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between">
        <span className="rounded-xl bg-violet-100 px-3 py-1 text-lg font-bold text-violet-700">
          {content.name}
        </span>
        <Badge tone="slate">{content.examples.length} examples</Badge>
      </div>

      <p className="mt-2 text-sm font-medium text-slate-700">
        {content.meaning}
      </p>
      <p className="mt-1 text-xs text-slate-500">{content.rule}</p>

      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5">
          <StickyNote size={11} /> Notes: {counts.notes}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5">
          <AlertTriangle size={11} /> Mistakes: {counts.mistakes}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 pt-1">
        <Link
          to={`/prepositions/${content.type}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          View details
        </Link>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onPractice(content.type)}
        >
          <Dumbbell size={15} /> Practice
        </Button>
      </div>
    </Card>
  );
}

export default PrepositionCard;
