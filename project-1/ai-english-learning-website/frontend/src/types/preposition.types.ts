// Prepositions module types. Content is static beginner-friendly data
// (no AI, no backend in mock mode); only user notes + quiz results are saved.

export const PREPOSITION_TYPES = [
  "in",
  "on",
  "at",
  "to",
  "from",
  "by",
  "with",
  "for",
  "about",
  "between",
] as const;
export type PrepositionType = (typeof PREPOSITION_TYPES)[number];

export interface PrepositionExample {
  sentence: string;
  note?: string;
}

export interface PrepositionMistake {
  wrong: string;
  correct: string;
  rule: string;
}

export interface PrepositionQuizQuestion {
  id: string;
  prompt: string; // sentence with a blank ____
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface PrepositionContent {
  type: PrepositionType;
  name: string; // "IN"
  meaning: string;
  rule: string; // one-line beginner-friendly rule
  whenToUse: string[];
  whenNotToUse: string[];
  examples: PrepositionExample[];
  commonMistakes: PrepositionMistake[];
  quiz: PrepositionQuizQuestion[];
}

/** A note the user saves about a preposition (stored in localStorage). */
export interface PrepositionNote {
  id: string;
  type: PrepositionType;
  text: string;
  createdAt: string;
}

/** Saved quiz result placeholder (stored in localStorage). */
export interface PrepositionQuizResult {
  id: string;
  type: PrepositionType;
  score: number;
  total: number;
  createdAt: string;
}
