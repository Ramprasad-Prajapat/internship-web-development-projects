import apiClient from "./apiClient";
import type { SectionProgress, ProgressSummary } from "../types/sectionProgress.types";

const STORAGE_KEY = "eng_section_progress";

function readProgressList(): SectionProgress[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SectionProgress[]) : [];
  } catch {
    return [];
  }
}

function writeProgressList(list: SectionProgress[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

async function getProgress(sourceId: string, sourceType: "DAILY_LESSON" | "PREPOSITION"): Promise<SectionProgress> {
  const list = readProgressList();
  let localFound = list.find(p => p.sourceId === sourceId);

  // Sync section completion status from backend
  try {
    const response: any = await apiClient.get(`/progress/section/${sourceId}`);
    if (response && response.data && response.data.completed !== undefined) {
      const completed = !!response.data.completed;
      if (localFound) {
        localFound.completed = completed;
      } else {
        localFound = {
          sourceId,
          sourceType,
          viewed: completed,
          listened: false,
          savedToNotebook: false,
          writingChecked: false,
          speakingChecked: false,
          mistakeFound: false,
          completed,
          updatedAt: new Date().toISOString()
        };
        list.push(localFound);
      }
      writeProgressList(list);
    }
  } catch (e) {
    console.warn("Failed to fetch section progress from backend", e);
  }

  if (localFound) return localFound;

  return {
    sourceId,
    sourceType,
    viewed: false,
    listened: false,
    savedToNotebook: false,
    writingChecked: false,
    speakingChecked: false,
    mistakeFound: false,
    completed: false,
    updatedAt: new Date().toISOString()
  };
}

async function updateProgress(
  sourceId: string,
  sourceType: "DAILY_LESSON" | "PREPOSITION",
  updates: Partial<SectionProgress>
): Promise<SectionProgress> {
  const list = readProgressList();
  const index = list.findIndex(p => p.sourceId === sourceId);
  
  let current: SectionProgress;
  if (index >= 0) {
    current = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
    list[index] = current;
  } else {
    current = {
      sourceId,
      sourceType,
      viewed: false,
      listened: false,
      savedToNotebook: false,
      writingChecked: false,
      speakingChecked: false,
      mistakeFound: false,
      completed: false,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    list.push(current);
  }
  
  writeProgressList(list);

  // Post completion status to backend
  if (updates.completed !== undefined) {
    try {
      await apiClient.post(`/progress/section/${sourceId}`, {
        completed: updates.completed,
        score: 100
      });
    } catch (e) {
      console.warn("Failed to post section progress to backend", e);
    }
  }

  return current;
}

async function getSummary(): Promise<ProgressSummary> {
  const list = readProgressList();
  
  let completedSections = 0;
  let viewedCount = 0;
  let listenedCount = 0;
  let writingChecksCount = 0;
  let speakingChecksCount = 0;
  let notebookSavesCount = 0;
  let mistakesFoundCount = 0;

  for (const item of list) {
    if (item.completed) completedSections++;
    if (item.viewed) viewedCount++;
    if (item.listened) listenedCount++;
    if (item.writingChecked) writingChecksCount++;
    if (item.speakingChecked) speakingChecksCount++;
    if (item.savedToNotebook) notebookSavesCount++;
    if (item.mistakeFound) mistakesFoundCount++;
  }

  return {
    totalSections: list.length,
    completedSections,
    viewedCount,
    listenedCount,
    writingChecksCount,
    speakingChecksCount,
    notebookSavesCount,
    mistakesFoundCount
  };
}

export const sectionProgressService = {
  getProgress,
  updateProgress,
  getSummary
};

export default sectionProgressService;
