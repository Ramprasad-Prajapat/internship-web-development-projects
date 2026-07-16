// Learning-feature TypeScript types. Shared across services, components and pages.

export type SkillKey =
  | "speaking"
  | "writing"
  | "reading"
  | "vocabulary"
  | "grammar";

export interface SkillProgress {
  key: SkillKey;
  label: string;
  value: number; // percentage 0-100
  done: number;
  target: number;
}

export type TaskType =
  | "speaking"
  | "writing"
  | "reading"
  | "vocabulary"
  | "homework";

export interface DailyTask {
  id: string;
  label: string;
  type: TaskType;
  done: boolean;
}

export type VocabStatus = "learning" | "learned" | "weak";

export interface VocabularyWord {
  id: string;
  word: string;
  meaning: string;
  hindiMeaning: string;
  example: string;
  status: VocabStatus;
  createdAt: string;
}

export type MistakeCategory = "grammar" | "vocabulary" | "sentence" | "speaking";

export interface Mistake {
  id: string;
  category: MistakeCategory;
  wrong: string;
  correct: string;
  rule: string;
  source: string;
  fixed: boolean;
  createdAt: string;
}

export interface HomeworkTask {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface SpeakingSession {
  id: string;
  question: string;
  transcript: string;
  feedback: string;
  score: number;
  createdAt: string;
}

export interface ReadingSession {
  id: string;
  title: string;
  accuracy: number;
  createdAt: string;
}

export interface WeeklyPoint {
  day: string; // Mon, Tue...
  date: string; // YYYY-MM-DD
  score: number; // 0-100
}

/** Result of the mock grammar check (rule-based, frontend only). */
export interface WritingCheckResult {
  original: string;
  corrected: string;
  rule: string;
  hasMistake: boolean;
}

export interface DashboardData {
  streak: number;
  motivation: string;
  tasks: DailyTask[];
  skills: SkillProgress[];
  weakAreas: string[];
  recentMistakes: Mistake[];
}
