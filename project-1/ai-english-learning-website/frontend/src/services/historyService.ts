import apiClient from "./apiClient";
import type {
  HistoryEntry,
  HistoryEventType,
  HistoryInput,
} from "../types/history.types";

async function addEntry(input: HistoryInput): Promise<HistoryEntry> {
  try {
    const response: any = await apiClient.post("/reports/history", input);
    return response.data;
  } catch {
    return {} as HistoryEntry; // Safe empty state
  }
}

async function list(): Promise<HistoryEntry[]> {
  const response: any = await apiClient.get("/reports/history");
  return response.data || [];
}

async function recent(n = 5): Promise<HistoryEntry[]> {
  const all = await list();
  return all.slice(0, n);
}

async function clearHistory(): Promise<void> {
  // Clear mock history
}

async function exportJson(): Promise<string> {
  const all = await list();
  return JSON.stringify(all, null, 2);
}

async function countByType(): Promise<Record<HistoryEventType, number>> {
  const listArr = await list();
  const counts = {} as Record<HistoryEventType, number>;
  for (const e of listArr) counts[e.type] = (counts[e.type] ?? 0) + 1;
  return counts;
}

export const historyService = {
  addEntry,
  list,
  recent,
  clearHistory,
  exportJson,
  countByType,
};

export default historyService;
