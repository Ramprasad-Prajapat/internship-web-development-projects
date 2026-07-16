// Phase 4 — Mistake types.
//
// A richer mistake model than the legacy learning.types `Mistake`: it carries a
// PracticeSourceType (so Daily Lesson and Preposition mistakes stay separate),
// the source title/id, and a practice counter. Stored via mockDatabase.

import type { PracticeSourceType } from "./ai.types";

/** Beginner-friendly mistake category. */
export const MISTAKE_TYPES = [
  "grammar",
  "vocabulary",
  "sentence",
  "spelling",
  "other",
] as const;
export type MistakeType = (typeof MISTAKE_TYPES)[number];

export interface Mistake {
  id: string;
  sourceType: PracticeSourceType;
  sourceId: string | null; // lessonId / preposition type, when known
  sourceTitle: string;
  wrongSentence: string;
  correctSentence: string;
  simpleRule: string;
  mistakeType: MistakeType;
  practicedCount: number;
  createdAt: string; // ISO
  reviewedAt?: string;
}

/** Input to save a mistake (id / count / timestamp added by the service). */
export interface MistakeInput {
  sourceType: PracticeSourceType;
  sourceId?: string | null;
  sourceTitle: string;
  wrongSentence: string;
  correctSentence: string;
  simpleRule: string;
  mistakeType?: MistakeType;
}

/** Filter options on the Mistakes page. */
export type MistakeSourceFilter = "all" | PracticeSourceType;
