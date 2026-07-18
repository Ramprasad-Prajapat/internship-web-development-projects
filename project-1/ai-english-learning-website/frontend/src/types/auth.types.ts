// Auth-related TypeScript types. Shared by services, hooks, forms and pages.

export type UserLevel = "BEGINNER" | "BASIC" | "INTERMEDIATE" | "ADVANCED";

export interface User {
  id: string;
  name: string;
  email: string;
  level: UserLevel;
  learningGoal: string;
  dailyGoalMinutes: number;
  preferredPracticeFocus?: string;
  role?: "user" | "admin";
  weakAreas?: string[];
  notebookPrefs?: {
    saveWritingToNotebook: boolean;
    saveSpeakingToNotebook: boolean;
    saveAiTipsToNotebook: boolean;
  };
  preferredLanguage?: string;
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}
