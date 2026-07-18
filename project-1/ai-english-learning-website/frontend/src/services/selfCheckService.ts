import apiClient from "./apiClient";

export interface SelfCheckProgress {
  viewed: boolean;
  checklist_read: boolean;
  checklist_updated: boolean;
  self_check_checked: boolean;
  note_saved: boolean;
  mistake_saved: boolean;
  section_completed: boolean;
  checked_items: Record<number, boolean>;
}

const DEFAULT_PROGRESS: SelfCheckProgress = {
  viewed: false,
  checklist_read: false,
  checklist_updated: false,
  self_check_checked: false,
  note_saved: false,
  mistake_saved: false,
  section_completed: false,
  checked_items: {},
};

class SelfCheckService {
  private getStorageKey(sourceId: string): string {
    return `eng_prog_selfcheck_${sourceId}`;
  }

  async getProgress(sourceId: string): Promise<SelfCheckProgress> {
    if (typeof window === "undefined") return { ...DEFAULT_PROGRESS };
    const key = this.getStorageKey(sourceId);
    
    // First read from backend if authenticated
    try {
      const response: any = await apiClient.get("/self-check/submissions");
      const list = response.data || [];
      // Find latest submission matching checkId = sourceId
      const found = list.find((sub: any) => sub.checkId === sourceId);
      if (found && found.answers) {
        try {
          const parsed = JSON.parse(found.answers);
          const progress = { ...DEFAULT_PROGRESS, ...parsed };
          // Sync to localStorage as temporary fallback/cache
          localStorage.setItem(key, JSON.stringify(progress));
          return progress;
        } catch (e) {
          console.warn("Failed to parse self-check answers from backend", e);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch self-check progress from backend", e);
    }

    // Fallback/cache
    const data = localStorage.getItem(key);
    if (!data) return { ...DEFAULT_PROGRESS };
    try {
      const parsed = JSON.parse(data);
      return { ...DEFAULT_PROGRESS, ...parsed };
    } catch {
      return { ...DEFAULT_PROGRESS };
    }
  }

  async updateProgress(sourceId: string, updates: Partial<SelfCheckProgress>): Promise<SelfCheckProgress> {
    const current = await this.getProgress(sourceId);
    const updated = { ...current, ...updates };
    
    const key = this.getStorageKey(sourceId);
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(updated));
    }

    // Post submission to backend
    try {
      const checkedCount = Object.values(updated.checked_items).filter(v => v).length;
      const totalItems = Object.keys(updated.checked_items).length || 1;
      const score = Math.round((checkedCount / totalItems) * 100);

      await apiClient.post("/self-check/submissions", {
        checkId: sourceId,
        score: score,
        answers: JSON.stringify(updated),
      });
    } catch (e) {
      console.warn("Failed to post self-check progress to backend", e);
    }

    return updated;
  }
}

export const selfCheckService = new SelfCheckService();
export default selfCheckService;
