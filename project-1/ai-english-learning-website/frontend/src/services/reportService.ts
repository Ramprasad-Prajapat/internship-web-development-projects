import apiClient from "./apiClient";
import type { HistoryEntry } from "../types/history.types";

export interface EnglishReport {
  lessonsViewed: number;
  lessonsPracticed: number;
  questionsAnswered: number;
  mistakesSaved: number;
  recentActivity: HistoryEntry[];
  mostPracticedTopic: string;
  suggestedNextStep: string;
}

export interface PrepositionsReport {
  prepositionsViewed: number;
  prepositionsPracticed: number;
  questionsAnswered: number;
  mistakesSaved: number;
  recentActivity: HistoryEntry[];
  strongPrepositions: string[];
  weakPrepositions: string[];
  suggestedNextPreposition: string;
}

async function getEnglishReport(period: string): Promise<EnglishReport> {
  const response: any = await apiClient.get("/reports/summary");
  const summary = response.data;
  
  const historyResponse: any = await apiClient.get("/reports/history");
  const recentActivity = historyResponse.data || [];

  return {
    lessonsViewed: summary.completedLessons || 0,
    lessonsPracticed: summary.completedLessons || 0,
    questionsAnswered: (summary.completedLessons || 0) * 3, // Mocked question volume
    mistakesSaved: summary.totalMistakes || 0,
    recentActivity: recentActivity.slice(0, 5),
    mostPracticedTopic: "English Grammar Rules",
    suggestedNextStep: "Practice tomorrow's Speaking Practice Drill."
  };
}

async function getPrepositionsReport(period: string): Promise<PrepositionsReport> {
  // Return a mock prepositions report to support the prepositions dashboard tab
  return {
    prepositionsViewed: 2,
    prepositionsPracticed: 1,
    questionsAnswered: 10,
    mistakesSaved: 0,
    recentActivity: [],
    strongPrepositions: ["IN", "ON"],
    weakPrepositions: ["AT"],
    suggestedNextPreposition: "AT"
  };
}

export const reportService = {
  getEnglishReport,
  getPrepositionsReport,
};

export default reportService;
