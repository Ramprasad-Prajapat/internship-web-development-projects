export interface SectionProgress {
  sourceId: string; // e.g. "1_vocabulary" or "in_grammar-rules"
  sourceType: "DAILY_LESSON" | "PREPOSITION";
  viewed: boolean;
  listened: boolean;
  savedToNotebook: boolean;
  writingChecked: boolean;
  speakingChecked: boolean;
  mistakeFound: boolean;
  completed: boolean;
  completedAt?: string; // ISO string
  updatedAt: string; // ISO string
}

export interface ProgressSummary {
  totalSections: number;
  completedSections: number;
  viewedCount: number;
  listenedCount: number;
  writingChecksCount: number;
  speakingChecksCount: number;
  notebookSavesCount: number;
  mistakesFoundCount: number;
}
