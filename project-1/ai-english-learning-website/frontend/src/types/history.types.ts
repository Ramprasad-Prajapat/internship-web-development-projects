// Activity history types (mock; stored in localStorage via historyService).

export const HISTORY_EVENT_TYPES = [
  "IMPORT_DRAFT_SAVED",
  "IMPORT_PREVIEW_CREATED",
  "IMPORT_FINAL_SAVED",
  "LESSON_SAVED",
  "DAILY_LESSON_SAVED",
  "PREPOSITION_NOTE_SAVED",
  "LESSON_VIEWED",
  "DAILY_LESSON_VIEWED",
  "PREPOSITION_VIEWED",
  // Phase 4 — practice + mock AI + mistakes
  "QUESTIONS_GENERATED",
  "ANSWER_CHECKED",
  "MISTAKE_SAVED",
  "DAILY_LESSON_PRACTICED",
  "PREPOSITION_PRACTICED",
  "MISTAKE_REVIEWED",
  // Phase 5 — extension inbox & profile polish
  "EXTENSION_CONTENT_IMPORTED",
  "EXTENSION_CONTENT_CONVERTED",
  "EXTENSION_INBOX_ITEM_DELETED",
  "PROFILE_UPDATED",
  // AI Notebook MVP event types
  "NOTEBOOK_ITEM_CREATED",
  "NOTEBOOK_ITEM_UPDATED",
  "NOTEBOOK_VOCABULARY_PRACTICED",
  "NOTEBOOK_SPEAKING_PRACTICED",
  "NOTEBOOK_LISTENING_PRACTICED",
  "NOTEBOOK_WRITING_CHECKED",
  "NOTEBOOK_READING_CHECKED",
  "NOTEBOOK_QUESTIONS_GENERATED",
  "NOTEBOOK_ANSWERS_CHECKED",
  "NOTEBOOK_MISTAKE_SAVED",
  // Section practice events
  "SECTION_NOTEBOOK_SAVED",
  "SECTION_WRITING_CHECKED",
  "SECTION_SPEAKING_CHECKED",
  "SECTION_AI_RECOMMENDATION_VIEWED",
  "SECTION_MISTAKE_FOUND",
  "LESSON_SECTION_VIEWED",
  "SECTION_SAVED_TO_NOTEBOOK",
  "SECTION_VIEWED",
  "SECTION_LISTENED",
  "SECTION_NOTE_SAVED",
  "SECTION_COMPLETED",
  "AI_COACH_TIP_SAVED",
  "REVISION_PLAN_GENERATED",
  "REVISION_TASK_COMPLETED",
  "REVISION_PRACTICE_CHECKED",
  "WEAK_AREA_REVIEWED",
  "USER_TEXT_IMPORTED",
  "USER_SENTENCE_SAVED",
  "USER_IMPORT_WRITING_CHECKED",
  "USER_IMPORT_SPEAKING_CHECKED",
  "PRACTICE_CENTER_QUIZ_COMPLETED",
  "PRACTICE_CENTER_WRITING_CHECKED",
  "PRACTICE_CENTER_SPEAKING_PRACTICED",
  "PRACTICE_CENTER_MISTAKE_REVIEWED",
] as const;
export type HistoryEventType = (typeof HISTORY_EVENT_TYPES)[number];

export interface HistoryEntry {
  id: string;
  type: HistoryEventType;
  title: string;
  description: string;
  /** Related lesson id, if any (links back to /lesson/:id). */
  lessonId: string | null;
  /** Related day number, if any (links back to /daily-lessons/day/:n). */
  dayNumber: number | null;
  /** Generic source tag (e.g. "DAILY_LESSON" / "PREPOSITION") for practice events. */
  sourceType: string | null;
  /** Generic source id (lessonId or preposition type) for practice events. */
  sourceId: string | null;
  createdAt: string; // ISO
}

/** Input for creating a history entry (id/timestamp added by the service). */
export interface HistoryInput {
  type: HistoryEventType;
  title: string;
  description?: string;
  lessonId?: string | null;
  dayNumber?: number | null;
  sourceType?: string | null;
  sourceId?: string | null;
}
