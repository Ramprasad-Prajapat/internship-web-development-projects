export type QuizQuestionType =
  | "choice"          // Multiple choice
  | "blank"           // Fill in the blank
  | "correct"         // Correct the sentence
  | "make"            // Make a sentence
  | "short"           // Short answer
  | "speaking";       // Speaking typed check

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  choices?: string[]; // Only for multiple choice
  correctAnswer: string;
  simpleRule: string;
  source: string; // e.g. "Daily Lesson 1", "Mistakes", "AI Notebook", "Default Bank"
  sampleAnswer?: string; // Optional helper for sentence making/short answers
}

export interface QuizAnswerInput {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  score: number;
}

export interface QuizAttempt {
  id: string;
  score: number; // 0-100 overall score
  totalQuestions: number;
  correctAnswers: number;
  answers: QuizAnswerInput[];
  createdAt: string; // ISO
}

export interface WritingCheckResult {
  score: number;
  betterSentence: string;
  hints: string[];
  simpleRule: string;
}

export interface SpeakingCheckResult {
  score: number;
  missingWords: string[];
  extraWords: string[];
  wordsToRepeat: string[];
  recommendedLine: string;
}
