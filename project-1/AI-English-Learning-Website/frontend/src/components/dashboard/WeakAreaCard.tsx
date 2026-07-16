import { AlertTriangle } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";

interface WeakAreaCardProps {
  weakAreas: string[];
}

/** Shows the topics the learner should focus on next. */
export function WeakAreaCard({ weakAreas }: WeakAreaCardProps) {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle size={18} className="text-amber-500" />
        <h3 className="font-semibold text-slate-800">Weak areas to practice</h3>
      </div>
      {weakAreas.length === 0 ? (
        <p className="text-sm text-slate-500">
          No weak areas yet. Keep practicing! 🎉
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {weakAreas.map((w) => (
            <Badge key={w} tone="amber">
              {w}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}

export default WeakAreaCard;
