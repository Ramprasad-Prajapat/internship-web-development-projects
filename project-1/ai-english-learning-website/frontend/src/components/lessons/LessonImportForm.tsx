import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, FolderOpen } from "lucide-react";
import Button from "../common/Button";
import {
  SOURCE_LABELS,
  TOPIC_LABELS,
} from "../../services/lessonService";
import {
  SOURCE_TYPES,
  TOPIC_TYPES,
  type LessonInput,
  type SourceType,
  type TopicType,
} from "../../types/lesson.types";

export type SaveMode = "save" | "open";

const schema = z.object({
  title: z.string().min(1, "Lesson title is required"),
  weekNumber: z.string().optional(),
  dayNumber: z.string().optional(),
  topicType: z.enum([...TOPIC_TYPES] as [TopicType, ...TopicType[]]),
  sourceType: z.enum([...SOURCE_TYPES] as [SourceType, ...SourceType[]]),
  tags: z.string().optional(),
  rawContent: z
    .string()
    .min(5, "Please paste at least a few words of lesson content"),
});

type FormValues = z.infer<typeof schema>;

/** Turn an optional numeric text field into number | null. */
function toNumberOrNull(value?: string): number | null {
  if (!value || !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

interface LessonImportFormProps {
  /** Save the lesson. `mode` says what to do afterwards (page decides). */
  onSave: (input: LessonInput, mode: SaveMode) => Promise<void>;
}

export function LessonImportForm({ onSave }: LessonImportFormProps) {
  // A ref (not state) so the submit handler always reads the latest mode:
  // both buttons are type="submit", and a batched setState would be stale
  // by the time react-hook-form's submit closure runs.
  const modeRef = useRef<SaveMode>("save");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      weekNumber: "",
      dayNumber: "",
      topicType: "week-day",
      sourceType: "chatgpt",
      tags: "",
      rawContent: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const mode = modeRef.current;
    const input: LessonInput = {
      title: values.title,
      weekNumber: toNumberOrNull(values.weekNumber),
      dayNumber: toNumberOrNull(values.dayNumber),
      topicType: values.topicType,
      sourceType: values.sourceType,
      tags: (values.tags ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      rawContent: values.rawContent,
    };
    try {
      await onSave(input, mode);
      if (mode === "save") reset();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Could not save lesson");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Lesson title
        </label>
        <input
          className="input-base"
          placeholder="e.g. Week 1 Day 1 — Daily Routine"
          {...register("title")}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-rose-600">{errors.title.message}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Week number (optional)
          </label>
          <input
            type="number"
            min={1}
            className="input-base"
            placeholder="1"
            {...register("weekNumber")}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Day number (optional)
          </label>
          <input
            type="number"
            min={1}
            className="input-base"
            placeholder="1"
            {...register("dayNumber")}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Topic type
          </label>
          <select className="input-base" {...register("topicType")}>
            {TOPIC_TYPES.map((t) => (
              <option key={t} value={t}>
                {TOPIC_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Source
          </label>
          <select className="input-base" {...register("sourceType")}>
            {SOURCE_TYPES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Tags (optional, comma separated)
        </label>
        <input
          className="input-base"
          placeholder="routine, present-simple"
          {...register("tags")}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Lesson content
        </label>
        <textarea
          rows={12}
          className="input-base resize-y font-mono text-[13px] leading-relaxed"
          placeholder="Paste your full lesson here. You can paste long notes — headings like Goal, Vocabulary, Grammar, Examples, Homework will be detected automatically."
          {...register("rawContent")}
        />
        {errors.rawContent && (
          <p className="mt-1 text-xs text-rose-600">
            {errors.rawContent.message}
          </p>
        )}
      </div>

      {serverError && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {serverError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          onClick={() => {
            modeRef.current = "save";
          }}
        >
          <Save size={16} />
          {isSubmitting ? "Saving..." : "Save lesson"}
        </Button>
        <Button
          type="submit"
          variant="secondary"
          disabled={isSubmitting}
          onClick={() => {
            modeRef.current = "open";
          }}
        >
          <FolderOpen size={16} />
          {isSubmitting ? "Saving..." : "Save & open lesson"}
        </Button>
      </div>
    </form>
  );
}

export default LessonImportForm;
