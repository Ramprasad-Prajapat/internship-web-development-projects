import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  Library,
  NotebookText,
  Shapes,
  Trash2,
  Wand2,
} from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import ClipboardPasteBox from "../components/import/ClipboardPasteBox";
import AutoDetectBadge from "../components/import/AutoDetectBadge";
import clipboardImportService from "../services/clipboardImportService";
import historyService from "../services/historyService";
import { TOPIC_LABELS } from "../services/lessonService";
import {
  TOPIC_TYPES,
  type TopicType,
} from "../types/lesson.types";
import type { PrepositionType } from "../types/preposition.types";
import type {
  ImportDetection,
  ImportDraft,
  ImportSaveType,
} from "../types/import.types";

function parseNum(value: string): number | null {
  const n = Number(value);
  return value.trim() && Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}
function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function LessonImport() {
  const navigate = useNavigate();

  const [rawContent, setRawContent] = useState("");
  const [title, setTitle] = useState("");
  const [weekText, setWeekText] = useState("");
  const [dayText, setDayText] = useState("");
  const [topicType, setTopicType] = useState<TopicType>("mixed");
  const [prepositionType, setPrepositionType] =
    useState<PrepositionType | null>(null);
  const [tagsText, setTagsText] = useState("");
  const [saveType, setSaveType] = useState<ImportSaveType>("general");

  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [savedLink, setSavedLink] = useState<{ to: string; label: string } | null>(
    null,
  );
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  const draftLoggedRef = useRef(false);

  // Live detection (for the badges) — does not overwrite edited fields.
  const detection = useMemo(
    () => clipboardImportService.detect(rawContent),
    [rawContent],
  );

  const applyDetection = (d: ImportDetection) => {
    setTitle(d.title);
    setDayText(d.dayNumber != null ? String(d.dayNumber) : "");
    setWeekText(d.weekNumber != null ? String(d.weekNumber) : "");
    setTopicType(d.topicType);
    setPrepositionType(d.prepositionType);
    setTagsText(d.tags.join(", "));
    setSaveType(
      d.prepositionType
        ? "preposition"
        : d.dayNumber != null
          ? "daily"
          : "general",
    );
  };

  // Load an existing draft once on mount.
  useEffect(() => {
    const draft = clipboardImportService.getImportDraft();
    if (draft) {
      setRawContent(draft.rawContent);
      setTitle(draft.title);
      setWeekText(draft.weekNumber != null ? String(draft.weekNumber) : "");
      setDayText(draft.dayNumber != null ? String(draft.dayNumber) : "");
      setTopicType(draft.topicType);
      setPrepositionType(draft.prepositionType);
      setTagsText(draft.tags.join(", "));
      setSaveType(draft.saveType);
      draftLoggedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildDraft = (saveTypeOverride?: ImportSaveType): ImportDraft => ({
    rawContent,
    title,
    dayNumber: parseNum(dayText),
    weekNumber: parseNum(weekText),
    topicType,
    prepositionType,
    tags: parseTags(tagsText),
    saveType: saveTypeOverride ?? saveType,
    updatedAt: new Date().toISOString(),
  });

  // Debounced auto-save of the draft to localStorage, with a visible status.
  // (Auto-detect runs on paste / the "Auto-fill fields" button, NOT per
  // keystroke, so typing never clobbers the title.)
  useEffect(() => {
    if (!rawContent.trim() && !title.trim()) return;
    setDraftStatus("saving");
    const id = window.setTimeout(() => {
      clipboardImportService.saveImportDraft(buildDraft());
      setDraftStatus("saved");
      if (!draftLoggedRef.current) {
        draftLoggedRef.current = true;
        historyService.addEntry({
          type: "IMPORT_DRAFT_SAVED",
          title: "Started an import draft",
          description: title.trim() || "Draft auto-saved",
        });
      }
    }, 800);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawContent, title, weekText, dayText, topicType, prepositionType, tagsText, saveType]);

  const resetForm = () => {
    setRawContent("");
    setTitle("");
    setWeekText("");
    setDayText("");
    setTopicType("mixed");
    setPrepositionType(null);
    setTagsText("");
    setSaveType("general");
    setDraftStatus("idle");
    draftLoggedRef.current = false;
  };

  const onPaste = async () => {
    setClipboardError(null);
    const res = await clipboardImportService.pasteFromClipboard();
    if (!res.ok) {
      setClipboardError(res.error);
      return;
    }
    const next = rawContent.trim() ? `${rawContent}\n${res.text}` : res.text;
    setRawContent(next);
    // Auto-fill detected fields when the form is still fresh (full text at once).
    if (!title.trim() && !dayText && !weekText) {
      applyDetection(clipboardImportService.detect(next));
    }
  };

  const onAutoFill = () => {
    if (!rawContent.trim()) {
      setClipboardError("Paste or type some content first, then auto-detect.");
      return;
    }
    applyDetection(clipboardImportService.detect(rawContent));
  };

  const onCreatePreview = () => {
    if (!rawContent.trim()) {
      setClipboardError("Please paste or type some content first.");
      return;
    }
    const draft = buildDraft();
    clipboardImportService.saveImportDraft(draft);
    historyService.addEntry({
      type: "IMPORT_PREVIEW_CREATED",
      title: `Created preview: ${draft.title || "Untitled"}`,
      description: "Preview created from import.",
    });
    navigate("/import-preview");
  };

  const doSave = async (type: ImportSaveType) => {
    setClipboardError(null);
    if (!rawContent.trim()) {
      setClipboardError("Please paste or type some content first.");
      return;
    }
    if (type === "preposition" && !prepositionType) {
      setClipboardError(
        "No specific preposition detected. Use “Create Preview” to pick one, or save as a General/Daily lesson.",
      );
      return;
    }
    if (type === "daily" && parseNum(dayText) == null) {
      setClipboardError(
        "Add a day number (e.g. Day 1) so this shows under Daily Lessons — or use “Save as General Lesson”.",
      );
      return;
    }
    const result = await clipboardImportService.finalizeImport(buildDraft(type));
    clipboardImportService.clearImportDraft();
    resetForm();
    if (result.saveType === "preposition" && !result.fellBackToLesson) {
      setSavedMsg(
        `Saved a note on preposition “${result.prepositionType?.toUpperCase()}”.`,
      );
      setSavedLink({
        to: result.prepositionType
          ? `/prepositions/${result.prepositionType}`
          : "/prepositions",
        label: "Open Prepositions",
      });
    } else if (result.saveType === "daily") {
      setSavedMsg(`Saved “${result.title}” as a daily lesson.`);
      setSavedLink({ to: "/daily-lessons", label: "Open Daily Lessons" });
    } else {
      setSavedMsg(`Saved “${result.title}” to your Lesson Library.`);
      setSavedLink({ to: "/lesson-library", label: "Open Library" });
    }
    window.setTimeout(() => {
      setSavedMsg(null);
      setSavedLink(null);
    }, 6000);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Import a lesson</h1>
          <p className="mt-1 text-slate-500">
            Paste copied notes — we auto-detect the day, week, topic and title.
            Your draft saves automatically.
          </p>
        </div>
        <Link
          to="/lesson-library"
          className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:inline-flex"
        >
          <Library size={16} /> Library
        </Link>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 size={18} />
          {savedMsg}{" "}
          {savedLink && (
            <Link to={savedLink.to} className="underline">
              {savedLink.label}
            </Link>
          )}
        </div>
      )}

      <Card className="space-y-4">
        <ClipboardPasteBox
          value={rawContent}
          onChange={setRawContent}
          onPasteFromClipboard={onPaste}
          error={clipboardError}
        />

        {/* Live auto-detect summary */}
        <div className="flex flex-wrap items-center gap-2">
          <AutoDetectBadge label="Topic" value={TOPIC_LABELS[detection.topicType]} />
          {detection.dayNumber != null && (
            <AutoDetectBadge label="Day" value={detection.dayNumber} />
          )}
          {detection.weekNumber != null && (
            <AutoDetectBadge label="Week" value={detection.weekNumber} />
          )}
          {detection.prepositionType && (
            <AutoDetectBadge
              label="Preposition"
              value={detection.prepositionType.toUpperCase()}
            />
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onAutoFill}
            className="ml-auto"
          >
            <Wand2 size={15} /> Auto-fill fields
          </Button>
        </div>

        {/* Editable fields */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Lesson title
          </label>
          <input
            className="input-base"
            placeholder="e.g. Week 1 Day 1 — Daily Routine"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Week number
            </label>
            <input
              type="number"
              min={1}
              className="input-base"
              placeholder="1"
              value={weekText}
              onChange={(e) => setWeekText(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Day number
            </label>
            <input
              type="number"
              min={1}
              className="input-base"
              placeholder="1"
              value={dayText}
              onChange={(e) => setDayText(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Topic type
            </label>
            <select
              className="input-base"
              value={topicType}
              onChange={(e) => setTopicType(e.target.value as TopicType)}
            >
              {TOPIC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TOPIC_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tags (comma separated)
            </label>
            <input
              className="input-base"
              placeholder="routine, present-simple"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        {draftStatus !== "idle" && (
          <p className="text-xs text-slate-400">
            {draftStatus === "saving"
              ? "Saving draft…"
              : "Draft saved automatically ✓"}
          </p>
        )}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <Button type="button" onClick={onCreatePreview}>
            <Eye size={16} /> Create Preview
          </Button>
          <Button type="button" variant="secondary" onClick={() => doSave("daily")}>
            <CalendarDays size={16} /> Save as Daily Lesson
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => doSave("preposition")}
          >
            <Shapes size={16} /> Save as Preposition Note
          </Button>
          <Button type="button" variant="secondary" onClick={() => doSave("general")}>
            <NotebookText size={16} /> Save as General Lesson
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              clipboardImportService.clearImportDraft();
              resetForm();
              setClipboardError(null);
              setSavedMsg(null);
            }}
          >
            <Trash2 size={16} /> Clear Draft
          </Button>
        </div>
      </Card>
    </div>
  );
}
