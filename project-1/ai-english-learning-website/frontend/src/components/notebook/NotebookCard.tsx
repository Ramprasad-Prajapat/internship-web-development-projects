import { NotebookItem } from "../../types/aiNotebook.types";
import Card from "../common/Card";
import Badge from "../common/Badge";

interface NotebookCardProps {
  item: NotebookItem;
  isSelected: boolean;
  onClick: () => void;
}

export default function NotebookCard({ item, isSelected, onClick }: NotebookCardProps) {
  const getBadgeTone = (source: string) => {
    switch (source) {
      case "Daily Lesson":
        return "indigo";
      case "Preposition":
        return "violet";
      case "Extension Inbox":
        return "sky";
      case "Writing":
      case "Speaking":
        return "emerald";
      default:
        return "slate";
    }
  };

  const cleanSnippet = item.originalContent.slice(0, 80) + (item.originalContent.length > 80 ? "..." : "");

  return (
    <Card
      onClick={onClick}
      className={`p-4 border cursor-pointer transition-all duration-200 select-none ${
        isSelected
          ? "border-indigo-600 bg-indigo-50/10 shadow-sm"
          : "border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm"
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-extrabold text-slate-800 text-sm line-clamp-1 flex-1 leading-snug">
          {item.title}
        </h4>
        <Badge tone={getBadgeTone(item.sourceType)} className="text-[9px] font-extrabold py-0.5 px-1.5 shrink-0 uppercase tracking-wider">
          {item.sourceType}
        </Badge>
      </div>

      <p className="text-[11px] text-slate-400 font-semibold mt-1.5 line-clamp-2 leading-relaxed">
        {cleanSnippet || <span className="italic font-medium text-slate-300">No content saved yet...</span>}
      </p>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-50 pt-2 text-[9px] font-bold text-slate-400">
        <span>
          {new Date(item.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
        {item.tags && item.tags.length > 0 && (
          <div className="flex gap-1">
            {item.tags.slice(0, 2).map((t) => (
              <span key={t} className="bg-slate-100 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
