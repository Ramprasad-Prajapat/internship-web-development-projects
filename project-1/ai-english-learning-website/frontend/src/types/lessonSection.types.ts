export interface MockWritingCheckResult {
  status: "correct" | "needs-improvement";
  betterSentence: string;
  simpleRule: string;
  capitalizationHint?: string;
  punctuationHint?: string;
  grammarHint?: string;
  wordsToImprove?: string[];
  score: number;
}

export interface MockSpeakingCheckResult {
  accuracy: number;
  missingWords: string[];
  extraWords: string[];
  wordsToRepeat: string[];
  recommendedPracticeLine: string;
  speakingTip?: string;
}
