export type NotebookSourceType =
  | "Daily Lesson"
  | "Preposition"
  | "Extension Inbox"
  | "Extension Clip"
  | "Mistake"
  | "Vocabulary"
  | "Speaking"
  | "Listening"
  | "Reading"
  | "Writing"
  | "Grammar"
  | "Manual Note"
  | "User Import";

export interface NotebookVocabulary {
  word: string;
  meaning: string;
  example: string;
  status: "known" | "need-practice";
}

export interface NotebookQuestion {
  id: string;
  type: "fill_blank" | "true_false" | "short_answer" | "make_sentence";
  questionText: string;
  expectedAnswer?: string;
  choices?: string[];
}

export interface NotebookMistake {
  id: string;
  type: "vocabulary" | "speaking" | "listening" | "writing" | "reading" | "questions";
  original: string;
  corrected: string;
  rule: string;
  sourceTitle: string;
  date: string;
}

export interface NotebookItem {
  id: string;
  title: string;
  sourceType: NotebookSourceType;
  originalContent: string;
  note?: string;
  tags?: string[];
  savedVocabulary?: NotebookVocabulary[];
  generatedQuestions?: NotebookQuestion[];
  userAnswers?: Record<string, string>;
  correctedAnswers?: Record<string, { isCorrect: boolean; feedback: string }>;
  speakingTranscript?: string;
  listeningText?: string;
  writingDraft?: string;
  readingTranscript?: string;
  mistakes?: NotebookMistake[];
  createdAt: string;
  updatedAt: string;
  status: "active" | "archived";
  isUserCreated?: boolean;
  isAdminContent?: boolean;
  contentOwner?: "user" | "admin";
  moduleKey?: string;
  reviewedAt?: string;
}
