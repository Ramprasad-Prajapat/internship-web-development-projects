import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Card from "../common/Card";

const items = [
  { to: "/speaking", label: "Speak", emoji: "🎤" },
  { to: "/writing", label: "Write", emoji: "✍️" },
  { to: "/reading", label: "Read", emoji: "📖" },
  { to: "/vocabulary", label: "Words", emoji: "📚" },
];

/** Quick "continue learning" shortcuts to the main practice pages. */
export function TodayPracticeCard() {
  return (
    <Card>
      <h3 className="mb-3 font-semibold text-slate-800">Continue learning</h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((i) => (
          <Link
            key={i.to}
            to={i.to}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100"
          >
            <span className="flex items-center gap-2 font-medium text-slate-700">
              <span className="text-lg">{i.emoji}</span>
              {i.label}
            </span>
            <ArrowRight size={16} className="text-slate-400" />
          </Link>
        ))}
      </div>
    </Card>
  );
}

export default TodayPracticeCard;
