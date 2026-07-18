// Lesson-feature TypeScript types. Shared by lessonService, components and pages.
//
// A "lesson" is any English-learning content the user saves — pasted manually
// from the Lesson Import page, or (later) sent from the browser extension.
// We always keep the original pasted text in `rawContent` so nothing is lost.

/** Topic categories a lesson can belong to. */
export const TOPIC_TYPES = [
  "week-day",
  "preposition",
  "vocabulary",
  "grammar",
  "speaking",
  "writing",
  "reading",
  "homework",
  "mixed",
  "other",
] as const;
export type TopicType = (typeof TOPIC_TYPES)[number];

/** Where the lesson content came from. */
export const SOURCE_TYPES = [
  "chatgpt",
  "website",
  "manual",
  "book",
  "extension",
  "other",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export interface Lesson {
  id: string;
  weekNumber: number | null;
  dayNumber: number | null;
  title: string;
  topicType: TopicType;
  sourceType: SourceType;
  tags: string[];
  rawContent: string; // original pasted text — never changed after save
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** Data needed to create a lesson (id / timestamps are added by the service). */
export interface LessonInput {
  weekNumber?: number | null;
  dayNumber?: number | null;
  title: string;
  topicType: TopicType;
  sourceType: SourceType;
  tags?: string[];
  rawContent: string;
}

/** One auto-detected block of a lesson (e.g. "Vocabulary", "Grammar"). */
export interface LessonSection {
  heading: string;
  body: string;
}

/** Filter state used by the Lesson Library page. */
export interface LessonFilter {
  topicType: TopicType | "all";
  search: string;
}
