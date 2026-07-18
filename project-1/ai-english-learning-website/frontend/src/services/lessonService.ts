import type {
  Lesson,
  LessonInput,
  LessonSection,
  SourceType,
  TopicType,
} from "../types/lesson.types";
import type { BadgeTone } from "../components/common/Badge";
import apiClient from "./apiClient";

export const TOPIC_LABELS: Record<TopicType, string> = {
  "week-day": "Week / Day",
  preposition: "Preposition",
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  speaking: "Speaking",
  writing: "Writing",
  reading: "Reading",
  homework: "Homework",
  mixed: "Mixed",
  other: "Other",
};

export const TOPIC_TONES: Record<TopicType, BadgeTone> = {
  "week-day": "indigo",
  preposition: "violet",
  vocabulary: "sky",
  grammar: "rose",
  speaking: "emerald",
  writing: "violet",
  reading: "amber",
  homework: "indigo",
  mixed: "slate",
  other: "slate",
};

export const SOURCE_LABELS: Record<SourceType, string> = {
  chatgpt: "ChatGPT",
  website: "Website",
  manual: "Typed",
  book: "Book",
  extension: "Extension",
  other: "Other",
};

// ---------- Headings parsing logic ----------
const KNOWN_HEADINGS: Record<string, string> = {
  goal: "Goal",
  goals: "Goal",
  "time table": "Time Table",
  timetable: "Time Table",
  schedule: "Time Table",
  vocabulary: "Vocabulary",
  vocab: "Vocabulary",
  words: "Vocabulary",
  meaning: "Meaning",
  grammar: "Grammar",
  rule: "Rule",
  rules: "Rule",
  example: "Examples",
  examples: "Examples",
  "questions and answers": "Questions & Answers",
  "questions & answers": "Questions & Answers",
  "q&a": "Questions & Answers",
  questions: "Questions",
  answers: "Answers",
  "speaking drill": "Speaking Drill",
  speaking: "Speaking Drill",
  "pronunciation drill": "Pronunciation Drill",
  pronunciation: "Pronunciation Drill",
  "common mistakes": "Common Mistakes",
  mistakes: "Common Mistakes",
  homework: "Homework",
  "self check": "Self Check",
  "self-check": "Self Check",
  preview: "Preview",
  notes: "Notes",
  summary: "Summary",
  tips: "Tips",
};

function canonicalHeading(text: string): string {
  const t = text.replace(/[:：]\s*$/, "").trim();
  return KNOWN_HEADINGS[t.toLowerCase()] ?? t;
}

function splitHeadingLabel(text: string): { label: string; inline: string } {
  const t = text.trim();
  const colon = t.search(/[:：]/);
  if (colon > 0) {
    return {
      label: canonicalHeading(t.slice(0, colon)),
      inline: t.slice(colon + 1).trim(),
    };
  }
  return { label: canonicalHeading(t), inline: "" };
}

function detectHeading(line: string): { label: string; inline: string } | null {
  const raw = line.trim();
  if (!raw) return null;

  const md = raw.match(/^#{1,6}\s+(.+)$/);
  if (md) return splitHeadingLabel(md[1]);

  const bold = raw.match(/^(?:\*\*|__)\s*(.+?)\s*(?:\*\*|__)\s*:?\s*(.*)$/);
  if (bold && bold[1].trim()) {
    return { label: canonicalHeading(bold[1]), inline: bold[2].trim() };
  }

  if (/^([*\-•]|\d+[.)])\s+/.test(raw)) return null;

  const colon = raw.search(/[:：]/);
  if (colon > 0) {
    const prefix = raw.slice(0, colon).trim();
    const inline = raw.slice(colon + 1).trim();
    const canon = KNOWN_HEADINGS[prefix.toLowerCase()];
    return canon && inline === "" ? { label: canon, inline: "" } : null;
  }
  const canon = KNOWN_HEADINGS[raw.toLowerCase()];
  return canon ? { label: canon, inline: "" } : null;
}

function splitIntoSections(raw: string, _dayNumber?: number | null): LessonSection[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const sections: LessonSection[] = [];
  let current: LessonSection | null = null;
  const preamble: string[] = [];

  for (const line of lines) {
    const head = detectHeading(line);
    if (head) {
      if (current) sections.push(current);
      current = { heading: head.label, body: head.inline ? head.inline : "" };
    } else if (current) {
      current.body += (current.body ? "\n" : "") + line;
    } else {
      preamble.push(line);
    }
  }
  if (current) sections.push(current);

  if (sections.length === 0) return [];

  const intro = preamble.join("\n").trim();
  const result = intro
    ? [{ heading: "Overview", body: intro }, ...sections]
    : sections;

  return result.map((s) => ({ heading: s.heading, body: s.body.trim() }));
}

function previewText(raw: string, max = 140): string {
  const flat = raw.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max).trim()}…` : flat;
}

// ---------- Real REST APIs Mappings ----------
async function listLessons(): Promise<Lesson[]> {
  const response: any = await apiClient.get("/lessons");
  return response.data || [];
}

async function getLesson(id: string): Promise<Lesson | null> {
  try {
    const response: any = await apiClient.get(`/lessons/${id}`);
    return response.data;
  } catch {
    return null;
  }
}

async function addLesson(input: LessonInput): Promise<Lesson> {
  const response: any = await apiClient.post(`/admin/lessons/day/${input.dayNumber || 1}`, {
    title: input.title,
    rawContent: input.rawContent,
    mode: "replace",
  });
  return response.data;
}

async function updateLesson(
  id: string,
  patch: Partial<LessonInput>,
): Promise<Lesson | null> {
  const response: any = await apiClient.post(`/admin/lessons/day/${patch.dayNumber || 1}`, {
    title: patch.title,
    rawContent: patch.rawContent,
    mode: "replace",
  });
  return response.data;
}

async function deleteLesson(id: string): Promise<Lesson[]> {
  await apiClient.delete(`/admin/lessons/day/${id}`);
  return listLessons();
}

async function listByDay(dayNumber: number): Promise<Lesson[]> {
  try {
    const response: any = await apiClient.get(`/lessons/day/${dayNumber}`);
    return response.data ? [response.data] : [];
  } catch {
    return [];
  }
}

async function listByWeek(weekNumber: number): Promise<Lesson[]> {
  const all = await listLessons();
  return all.filter((l) => l.weekNumber === weekNumber);
}

async function listByTopic(topicType: TopicType): Promise<Lesson[]> {
  const all = await listLessons();
  return all.filter((l) => l.topicType === topicType);
}

export const lessonService = {
  listLessons,
  getLesson,
  addLesson,
  updateLesson,
  deleteLesson,
  listByDay,
  listByWeek,
  listByTopic,
  splitIntoSections,
  previewText,
};

export default lessonService;
