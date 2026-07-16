// Phase 4 — Practice + Mock AI types.
//
// There is NO real AI here. Question generation and answer checking are simple
// rule-based mock logic (frontend only, no API keys). Everything is plain data
// so swapping to a real Spring Boot AI endpoint later needs no UI change.

/**
 * Where a practice question / answer / mistake comes from. Daily Lesson practice
 * and Preposition practice are kept fully separate via this field — they share
 * the practice engine but never mix their data.
 */
export const PRACTICE_SOURCE_TYPES = [
  "DAILY_LESSON",
  "PREPOSITION",
  "WRITING",
  "SPEAKING",
  "USER_IMPORT",
] as const;
export type PracticeSourceType = (typeof PRACTICE_SOURCE_TYPES)[number];

export type AnswerType = "sentence" | "short" | "fill-blank" | "choice";
export type Difficulty = "easy" | "medium" | "hard";

/** A mock-generated practice question. */
export interface Question {
  id: string;
  sourceType: PracticeSourceType;
  sourceId: string; // lessonId (daily) or preposition type (e.g. "to")
  questionText: string;
  sampleAnswer: string;
  answerType: AnswerType;
  difficulty: Difficulty;
  createdAt: string; // ISO
}

/** Beginner-friendly feedback from the mock answer checker. */
export interface AnswerCheckResult {
  wrongSentence: string;
  correctSentence: string;
  simpleRule: string;
  practiceAgain: string;
  score: number; // 0-100
  isCorrect: boolean;
}

/** A saved practice answer (stored via mockDatabase). */
export interface PracticeAnswer {
  id: string;
  questionId: string;
  sourceType: PracticeSourceType;
  sourceId: string;
  questionText: string;
  userAnswer: string;
  result: AnswerCheckResult;
  createdAt: string;
}

/** Input to check an answer (pure — no storage). */
export interface CheckAnswerInput {
  sourceType: PracticeSourceType;
  sourceId: string;
  questionText: string;
  sampleAnswer?: string;
  userAnswer: string;
}

/** Input to save an answer after it has been checked. */
export interface SaveAnswerInput {
  questionId: string;
  sourceType: PracticeSourceType;
  sourceId: string;
  sourceTitle: string;
  questionText: string;
  userAnswer: string;
  result: AnswerCheckResult;
}

/** One rolling practice session per (sourceType, sourceId). */
export interface PracticeSession {
  id: string;
  sourceType: PracticeSourceType;
  sourceId: string;
  sourceTitle: string;
  answered: number;
  correct: number;
  lastScore: number;
  createdAt: string;
  updatedAt: string;
}

/** Summary shown on the practice page and the dashboard. */
export interface PracticeSummary {
  sourceType: PracticeSourceType;
  sourceId: string;
  sourceTitle: string;
  answered: number;
  correct: number;
  averageScore: number;
  mistakesSaved: number;
  lastPracticedAt: string | null;
}
