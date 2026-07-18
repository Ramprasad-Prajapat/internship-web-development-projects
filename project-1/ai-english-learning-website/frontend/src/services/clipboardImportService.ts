import lessonService from "./lessonService";
import prepositionService from "./prepositionService";
import historyService from "./historyService";
import type { LessonSection, SourceType, TopicType } from "../types/lesson.types";
import {
  PREPOSITION_TYPES,
  type PrepositionType,
} from "../types/preposition.types";
import type {
  ImportDetection,
  ImportDraft,
  ImportPreviewData,
  ImportSaveResult,
} from "../types/import.types";

/**
 * MOCK clipboard-import service (frontend prototype only).
 *
 * Handles: reading the clipboard (with a safe fallback), auto-detecting
 * lesson fields from pasted text, saving/reading/clearing the import draft in
 * localStorage, building a clean preview, and finalizing the save into the
 * right existing service (lesson / preposition). Async + backend-ready.
 *
 * This service is the localStorage gateway for import drafts — pages call it,
 * they never touch localStorage directly.
 */

const DRAFT_KEY = "eng_import_draft";
const PREP_SET = new Set<string>(PREPOSITION_TYPES);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore (storage full / private mode)
  }
}

// ---------- clipboard ----------
export type ClipboardResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

async function pasteFromClipboard(): Promise<ClipboardResult> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.readText) {
    return {
      ok: false,
      error:
        "Clipboard button is not available in this browser. Please paste manually with Ctrl+V (or Cmd+V).",
    };
  }
  try {
    const text = await navigator.clipboard.readText();
    if (!text.trim()) {
      return {
        ok: false,
        error: "Your clipboard looks empty. Copy some text first, then try again.",
      };
    }
    return { ok: true, text };
  } catch {
    return {
      ok: false,
      error:
        "Could not read the clipboard (permission blocked). Please paste manually with Ctrl+V (or Cmd+V).",
    };
  }
}

// ---------- detection ----------
function detectDayNumber(text: string): number | null {
  const m = text.match(/\bday\s*0*(\d{1,2})\b/i);
  return m ? Number(m[1]) : null;
}

function detectWeekNumber(text: string): number | null {
  const m = text.match(/\bweek\s*0*(\d{1,2})\b/i);
  return m ? Number(m[1]) : null;
}

function detectPrepositionType(text: string): PrepositionType | null {
  // Only confident match: the word "preposition" followed by a known preposition.
  const m = text
    .toLowerCase()
    .match(/prepositions?[\s:–—-]+["“']?([a-z]+)/);
  if (m && PREP_SET.has(m[1])) return m[1] as PrepositionType;
  return null;
}

function detectTopicType(text: string): TopicType {
  const t = text.toLowerCase();
  if (/\bpreposition/.test(t)) return "preposition";
  if (/\bvocab/.test(t)) return "vocabulary";
  if (/\bgrammar\b/.test(t)) return "grammar";
  if (/speaking\s*drill/.test(t) || /\bspeaking\b/.test(t)) return "speaking";
  if (/\bwriting\b/.test(t)) return "writing";
  if (/\breading\b/.test(t)) return "reading";
  if (/\bhomework\b/.test(t)) return "homework";
  return "mixed";
}

function detectTitle(text: string): string {
  const firstLine = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!firstLine) return "";
  let title = firstLine
    .replace(/^#{1,6}\s*/, "") // markdown heading
    .replace(/^([*\-•]+|\d+[.)])\s*/, "") // bullet / number
    .replace(/\*\*|__/g, "") // bold markers
    .replace(/[:：]\s*$/, "") // trailing colon
    .trim();
  if (title.length > 80) title = `${title.slice(0, 77).trim()}…`;
  return title;
}

function detect(text: string): ImportDetection {
  const dayNumber = detectDayNumber(text);
  const weekNumber = detectWeekNumber(text);
  const topicType = detectTopicType(text);
  const prepositionType = detectPrepositionType(text);

  const tags: string[] = [];
  if (prepositionType) tags.push(prepositionType);
  else if (topicType !== "mixed" && topicType !== "other") tags.push(topicType);
  if (dayNumber != null) tags.push(`day-${dayNumber}`);

  return {
    title: detectTitle(text),
    dayNumber,
    weekNumber,
    topicType,
    prepositionType,
    tags,
  };
}

// ---------- clean preview ----------
function cleanContentPreview(text: string): LessonSection[] {
  return lessonService.splitIntoSections(text);
}

function createImportPreview(draft: ImportDraft): ImportPreviewData {
  return { draft, sections: cleanContentPreview(draft.rawContent) };
}

// ---------- draft (one current draft) ----------
function saveImportDraft(draft: ImportDraft): void {
  write(DRAFT_KEY, draft);
}
function getImportDraft(): ImportDraft | null {
  return read<ImportDraft | null>(DRAFT_KEY, null);
}
function clearImportDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

// ---------- finalize (save to the right service + log history) ----------
async function finalizeImport(draft: ImportDraft): Promise<ImportSaveResult> {
  const title = draft.title.trim() || "Untitled lesson";
  const baseInput = {
    title,
    weekNumber: draft.weekNumber,
    dayNumber: draft.dayNumber,
    sourceType: "chatgpt" as SourceType,
    tags: draft.tags,
    rawContent: draft.rawContent,
  };

  let result: ImportSaveResult;

  if (draft.saveType === "preposition") {
    const prep = draft.prepositionType ?? detectPrepositionType(draft.rawContent);
    if (prep) {
      await prepositionService.addNote(prep, draft.rawContent.trim());
      await historyService.addEntry({
        type: "PREPOSITION_NOTE_SAVED",
        title: `Saved a note on preposition "${prep.toUpperCase()}"`,
        description: title,
      });
      result = {
        saveType: "preposition",
        lessonId: null,
        prepositionType: prep,
        fellBackToLesson: false,
        title,
      };
    } else {
      // No specific preposition found → save as a lesson so nothing is lost.
      const lesson = await lessonService.addLesson({
        ...baseInput,
        topicType: "preposition",
      });
      await historyService.addEntry({
        type: "LESSON_SAVED",
        title: `Saved lesson: ${lesson.title}`,
        description:
          "Preposition content saved as a lesson (no specific preposition detected).",
        lessonId: lesson.id,
        dayNumber: lesson.dayNumber,
      });
      result = {
        saveType: "preposition",
        lessonId: lesson.id,
        prepositionType: null,
        fellBackToLesson: true,
        title: lesson.title,
      };
    }
  } else {
    // daily or general → both create a lesson record
    const lesson = await lessonService.addLesson({
      ...baseInput,
      topicType: draft.topicType,
    });
    if (draft.saveType === "daily") {
      await historyService.addEntry({
        type: "DAILY_LESSON_SAVED",
        title: `Saved Day ${lesson.dayNumber ?? "?"}: ${lesson.title}`,
        description: "Saved as a daily lesson.",
        lessonId: lesson.id,
        dayNumber: lesson.dayNumber,
      });
    } else {
      await historyService.addEntry({
        type: "LESSON_SAVED",
        title: `Saved lesson: ${lesson.title}`,
        description: "Saved to your Lesson Library.",
        lessonId: lesson.id,
        dayNumber: lesson.dayNumber,
      });
    }
    result = {
      saveType: draft.saveType,
      lessonId: lesson.id,
      prepositionType: null,
      fellBackToLesson: false,
      title: lesson.title,
    };
  }

  // One consistent "import finished" entry for every save path.
  await historyService.addEntry({
    type: "IMPORT_FINAL_SAVED",
    title: `Import finished: ${result.title}`,
    description: `Saved as ${draft.saveType}.`,
    lessonId: result.lessonId,
    dayNumber: draft.dayNumber,
  });

  return result;
}

export const clipboardImportService = {
  pasteFromClipboard,
  detectDayNumber,
  detectWeekNumber,
  detectTopicType,
  detectTitle,
  detectPrepositionType,
  detect,
  createImportPreview,
  cleanContentPreview,
  saveImportDraft,
  getImportDraft,
  clearImportDraft,
  finalizeImport,
};

export default clipboardImportService;
