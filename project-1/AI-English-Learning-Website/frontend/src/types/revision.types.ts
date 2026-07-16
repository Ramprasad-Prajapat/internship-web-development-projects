export type WeakAreaKey =
  | "grammar"
  | "prepositions"
  | "vocabulary"
  | "speaking"
  | "writing"
  | "reading"
  | "pronunciation"
  | "questions";

export interface WeakArea {
  key: WeakAreaKey;
  label: string;
  count: number; // number of identified issues
  description: string;
  reasons: string[];
}

export type RevisionModule =
  | "Mistakes"
  | "AI Notebook"
  | "Prepositions"
  | "Daily Lessons"
  | "Study Planner"
  | "Practice";

export interface RevisionTask {
  id: string;
  title: string;
  module: RevisionModule;
  reason: string;
  timeEstimate: string;
  route: string;
  completed: boolean;
  skipped: boolean;
}

export type RevisionPracticeType =
  | "mistake_repeat"
  | "fill_blank"
  | "correct_sentence"
  | "make_sentence"
  | "speaking_repeat"
  | "preposition_choice"
  | "vocabulary_recall";

export interface RevisionPracticeQuestion {
  id: string;
  weakAreaKey: WeakAreaKey;
  practiceType: RevisionPracticeType;
  prompt: string;
  contextText?: string;
  options?: string[];
  correctAnswer: string;
  ruleExplanation: string;
  relatedMistakeId?: string; // if repeating a specific mistake
}

export interface RevisionPracticeResult {
  correct: boolean;
  score: number;
  userAnswer: string;
  correctAnswer: string;
  ruleExplanation: string;
  feedbackMessage: string;
  nextSuggestion: string;
}
