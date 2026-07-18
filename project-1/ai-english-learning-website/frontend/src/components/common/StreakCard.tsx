import { Flame } from "lucide-react";
import Card from "./Card";

interface StreakCardProps {
  streak: number;
}

/** Highlighted card showing the user's current daily streak. */
export function StreakCard({ streak }: StreakCardProps) {
  return (
    <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
          <Flame size={28} />
        </div>
        <div>
          <p className="text-sm text-slate-500">Daily streak</p>
          <p className="text-2xl font-bold text-slate-800">
            {streak} day{streak === 1 ? "" : "s"} 🔥
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Practice today to keep it going!
          </p>
        </div>
      </div>
    </Card>
  );
}

export default StreakCard;
