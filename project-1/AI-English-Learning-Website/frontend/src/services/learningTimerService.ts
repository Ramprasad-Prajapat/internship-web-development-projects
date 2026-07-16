import sectionTimeService from "./sectionTimeService";

let currentSession: {
  moduleKey: string;
  dayNumber: string;
  sectionId: string;
  startedAt: string;
} | null = null;

export const learningTimerService = {
  startTimer(moduleKey: string, dayNumber: string, sectionId: string): void {
    if (currentSession) {
      this.stopTimer();
    }
    currentSession = {
      moduleKey,
      dayNumber,
      sectionId,
      startedAt: new Date().toISOString(),
    };
  },

  stopTimer(): { durationSeconds: number } | null {
    if (!currentSession) return null;
    const endedAt = new Date().toISOString();
    const duration = Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(currentSession.startedAt).getTime()) / 1000));
    
    if (duration > 0) {
      void sectionTimeService.saveSectionTime(
        currentSession.moduleKey,
        currentSession.dayNumber,
        currentSession.sectionId,
        currentSession.startedAt,
        endedAt,
        duration
      );
    }
    const result = { durationSeconds: duration };
    currentSession = null;
    return result;
  },

  getCurrentSessionDuration(): number {
    if (!currentSession) return 0;
    return Math.max(0, Math.round((Date.now() - new Date(currentSession.startedAt).getTime()) / 1000));
  }
};

export default learningTimerService;
