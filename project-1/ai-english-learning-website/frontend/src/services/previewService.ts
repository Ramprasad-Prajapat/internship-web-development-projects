export interface PreviewProgress {
  viewed?: boolean;
  preview_read?: boolean;
  preview_listened?: boolean;
  preview_prepared?: boolean;
  note_saved?: boolean;
  section_completed?: boolean;
}

class PreviewService {
  private getStorageKey(sourceId: string): string {
    return `preview_progress_${sourceId}`;
  }

  async getProgress(sourceId: string): Promise<PreviewProgress | null> {
    const data = localStorage.getItem(this.getStorageKey(sourceId));
    return data ? JSON.parse(data) : null;
  }

  async updateProgress(sourceId: string, updates: Partial<PreviewProgress>): Promise<PreviewProgress> {
    const current = await this.getProgress(sourceId) || {};
    const updated = { ...current, ...updates };
    localStorage.setItem(this.getStorageKey(sourceId), JSON.stringify(updated));
    return updated;
  }
}

export const previewService = new PreviewService();
