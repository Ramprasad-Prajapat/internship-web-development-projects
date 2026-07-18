// Import-flow types: clipboard paste → auto-detect → draft → preview → save.

import type { LessonSection, TopicType } from "./lesson.types";
import type { PrepositionType } from "./preposition.types";

/** Where a finished import is stored. */
export type ImportSaveType = "daily" | "preposition" | "general";

/** Fields auto-detected from pasted content. */
export interface ImportDetection {
  title: string;
  dayNumber: number | null;
  weekNumber: number | null;
  topicType: TopicType;
  prepositionType: PrepositionType | null;
  tags: string[];
}

/** The editable, auto-saved import draft (one current draft at a time). */
export interface ImportDraft {
  rawContent: string;
  title: string;
  dayNumber: number | null;
  weekNumber: number | null;
  topicType: TopicType;
  prepositionType: PrepositionType | null;
  tags: string[];
  saveType: ImportSaveType;
  updatedAt: string; // ISO
}

/** Draft + computed clean sections for the preview page. */
export interface ImportPreviewData {
  draft: ImportDraft;
  sections: LessonSection[];
}

/** Result returned after a final save. */
export interface ImportSaveResult {
  saveType: ImportSaveType;
  lessonId: string | null;
  prepositionType: PrepositionType | null;
  /** True when a preposition save had no detected preposition and fell back to a lesson. */
  fellBackToLesson: boolean;
  title: string;
}
