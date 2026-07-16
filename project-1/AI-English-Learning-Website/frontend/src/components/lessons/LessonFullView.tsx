import { useMemo } from "react";
import { Calendar, FileText, Volume2 } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import {
  SOURCE_LABELS,
  TOPIC_LABELS,
  TOPIC_TONES,
  lessonService,
} from "../../services/lessonService";
import { formatDate } from "../../utils/dateUtils";
import type { Lesson } from "../../types/lesson.types";

function speak(text: string) {
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

interface LessonFullViewProps {
  lesson: Lesson;
}

export function LessonFullView({ lesson }: LessonFullViewProps) {
  const sections = useMemo(
    () => lessonService.splitIntoSections(lesson.rawContent, lesson.dayNumber),
    [lesson.rawContent, lesson.dayNumber],
  );

  return (
    <div className="space-y-5">
      {/* Meta */}
      <Card>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={TOPIC_TONES[lesson.topicType]}>
            {TOPIC_LABELS[lesson.topicType]}
          </Badge>
          {(lesson.weekNumber != null || lesson.dayNumber != null) && (
            <Badge tone="slate">
              <Calendar size={12} className="mr-1" />
              {lesson.weekNumber != null ? `Week ${lesson.weekNumber}` : ""}
              {lesson.weekNumber != null && lesson.dayNumber != null
                ? " · "
                : ""}
              {lesson.dayNumber != null ? `Day ${lesson.dayNumber}` : ""}
            </Badge>
          )}
          <Badge tone="emerald">Source: {SOURCE_LABELS[lesson.sourceType]}</Badge>
        </div>

        {lesson.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {lesson.tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-slate-400">
          Saved on {formatDate(lesson.createdAt)}
        </p>
      </Card>

      {/* Clean sections (only if we detected headings) */}
      {sections.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">
            Lesson sections
          </h2>
          {sections.map((s, i) => (
            <Card key={`${s.heading}-${i}`}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="font-semibold text-indigo-700">{s.heading}</h3>
                {s.body && (
                  <button
                    type="button"
                    onClick={() => speak(`${s.heading}. ${s.body}`)}
                    aria-label={`Listen to ${s.heading}`}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    <Volume2 size={16} />
                  </button>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {s.body || "—"}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Original content — always shown, never lost (Rule §20) */}
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <FileText size={18} /> Original content
        </h2>
        <Card>
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-slate-700">
            {lesson.rawContent}
          </pre>
        </Card>
      </div>
    </div>
  );
}

export default LessonFullView;
