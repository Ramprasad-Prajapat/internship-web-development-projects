export interface ExtensionInboxItem {
  id: string;
  title: string;
  sourceUrl?: string;
  rawContent: string;
  sourceType: string; // e.g. "WEBSITE" | "ARTICLE" | "VIDEO" | "PDF" | "CUSTOM"
  receivedAt: string; // ISO date string
  convertedStatus: "PENDING" | "CONVERTED";
  convertedAs?: "DAILY_LESSON" | "PREPOSITION" | "VOCABULARY" | "GRAMMAR" | "GENERAL" | "AI_NOTEBOOK";
  convertedId?: string;
}
