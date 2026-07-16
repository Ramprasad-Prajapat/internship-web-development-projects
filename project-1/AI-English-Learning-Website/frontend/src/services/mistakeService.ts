import apiClient from "./apiClient";
import type { Mistake, MistakeInput } from "../types/mistake.types";

async function getMistakes(): Promise<Mistake[]> {
  const response: any = await apiClient.get("/mistakes");
  return response.data || [];
}

async function getRecent(n = 4): Promise<Mistake[]> {
  const all = await getMistakes();
  return all.slice(0, n);
}

async function saveMistake(input: MistakeInput): Promise<Mistake> {
  const response: any = await apiClient.post("/mistakes", {
    wrongSentence: input.wrongSentence,
    correctSentence: input.correctSentence,
    simpleRule: input.simpleRule,
    category: input.mistakeType
  });
  return response.data;
}

async function markMistakeReviewed(id: string): Promise<Mistake> {
  const response: any = await apiClient.patch(`/mistakes/${id}/fixed`, { fixed: true });
  return response.data;
}

async function getMistakesBySource(sourceType: string, sourceId: string): Promise<Mistake[]> {
  const all = await getMistakes();
  return all.filter((m) => m.sourceType === sourceType && m.sourceId === sourceId);
}

async function deleteMistake(id: string): Promise<void> {
  await apiClient.delete(`/mistakes/${id}`);
}

export const mistakeService = {
  getMistakes,
  getRecent,
  saveMistake,
  markMistakeReviewed,
  markMistakePracticed: markMistakeReviewed,
  getMistakesBySource,
  deleteMistake,
};

export default mistakeService;
