import { useState } from "react";
import { ArrowRight, Calendar, ExternalLink, FileText, Trash2, CheckCircle } from "lucide-react";
import type { ExtensionInboxItem } from "../../types/extension.types";
import Card from "../common/Card";
import Button from "../common/Button";
import Badge from "../common/Badge";
import type { BadgeTone } from "../common/Badge";
import { Link } from "react-router-dom";

interface ExtensionInboxCardProps {
  item: ExtensionInboxItem;
  onDelete: (id: string) => void;
  onConvertClick: (item: ExtensionInboxItem) => void;
}

const SOURCE_TYPE_TONES: Record<string, BadgeTone> = {
  WEBSITE: "indigo",
  ARTICLE: "sky",
  VIDEO: "rose",
  PDF: "amber",
  CUSTOM: "slate",
};

export default function ExtensionInboxCard({
  item,
  onDelete,
  onConvertClick,
}: ExtensionInboxCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = new Date(item.receivedAt).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const getLinkToConverted = () => {
    if (!item.convertedId) return null;
    switch (item.convertedAs) {
      case "DAILY_LESSON":
        // Wait, daily lesson details are accessed at /daily-lessons/day/:n.
        // But do we know the day number? We don't have it directly on the item, 
        // but we can link to /lesson/:id or /daily-lessons since they are loaded.
        // Actually, lesson detail /lesson/:id works for any lesson!
        return `/lesson/${item.convertedId}`;
      case "GRAMMAR":
      case "GENERAL":
        return `/lesson/${item.convertedId}`;
      case "PREPOSITION":
        return `/prepositions`;
      case "VOCABULARY":
        return `/vocabulary`;
      default:
        return null;
    }
  };

  const convertedLink = getLinkToConverted();

  return (
    <Card className="group relative border border-slate-100 bg-white transition-all duration-200 hover:border-indigo-100 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={SOURCE_TYPE_TONES[item.sourceType.toUpperCase()] || "slate"}>
              {item.sourceType}
            </Badge>
            {item.convertedStatus === "CONVERTED" ? (
              <Badge tone="emerald" className="inline-flex items-center gap-1">
                <CheckCircle size={12} />
                Converted to {item.convertedAs?.replace("_", " ")}
              </Badge>
            ) : (
              <Badge tone="amber">Pending</Badge>
            )}
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Calendar size={12} />
              {formattedDate}
            </span>
          </div>

          <h3 className="text-base font-semibold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {item.title}
          </h3>

          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
            >
              <ExternalLink size={12} />
              {item.sourceUrl.length > 50 ? `${item.sourceUrl.slice(0, 50)}...` : item.sourceUrl}
            </a>
          )}
        </div>

        <button
          onClick={() => onDelete(item.id)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors focus:outline-none"
          title="Delete item"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-3">
        <p className={`text-sm text-slate-600 ${expanded ? "" : "line-clamp-2"} whitespace-pre-wrap`}>
          {item.rawContent}
        </p>
        {item.rawContent.length > 150 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-xs font-semibold text-indigo-500 hover:text-indigo-700 focus:outline-none"
          >
            {expanded ? "Show less" : "Show full content"}
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
        <div>
          {item.convertedStatus === "CONVERTED" && convertedLink && (
            <Link
              to={convertedLink}
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline"
            >
              Go to converted item <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {item.convertedStatus === "PENDING" && (
          <Button
            size="sm"
            onClick={() => onConvertClick(item)}
            className="inline-flex items-center gap-1.5"
          >
            <FileText size={14} />
            Convert Content
          </Button>
        )}
      </div>
    </Card>
  );
}
