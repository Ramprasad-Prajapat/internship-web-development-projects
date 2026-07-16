import { FileText } from "lucide-react";
import Card from "../common/Card";
import AutoDetectBadge from "./AutoDetectBadge";
import { TOPIC_LABELS } from "../../services/lessonService";
import type { ImportPreviewData } from "../../types/import.types";

interface ImportPreviewCardProps {
  data: ImportPreviewData;
}

/** Read-only preview of a draft: detected fields, clean sections, raw content. */
export function ImportPreviewCard({ data }: ImportPreviewCardProps) {
  const { draft, sections } = data;

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="mb-2 font-semibold text-slate-800">
          {draft.title || "Untitled lesson"}
        </h3>
        <div className="flex flex-wrap gap-2">
          <AutoDetectBadge label="Topic" value={TOPIC_LABELS[draft.topicType]} />
          {draft.weekNumber != null && (
            <AutoDetectBadge label="Week" value={draft.weekNumber} />
          )}
          {draft.dayNumber != null && (
            <AutoDetectBadge label="Day" value={draft.dayNumber} />
          )}
          {draft.prepositionType && (
            <AutoDetectBadge
              label="Preposition"
              value={draft.prepositionType.toUpperCase()}
            />
          )}
        </div>
        {draft.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {draft.tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </Card>

      {sections.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-800">Clean preview</h3>
          {sections.map((s, i) => (
            <Card key={`${s.heading}-${i}`}>
              <h4 className="font-semibold text-indigo-700">{s.heading}</h4>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {s.body || "—"}
              </p>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="flex items-center gap-2 font-semibold text-slate-800">
          <FileText size={16} /> Raw content
        </h3>
        <Card>
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-slate-700">
            {draft.rawContent || "—"}
          </pre>
        </Card>
      </div>
    </div>
  );
}

export default ImportPreviewCard;
