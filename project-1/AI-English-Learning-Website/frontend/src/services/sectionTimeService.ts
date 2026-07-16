import mockDatabase from "./mockDatabase";
import type { SectionTimeRecord } from "../types/sectionTime.types";

const DB_KEY = mockDatabase.DB_KEYS.learningTimes;

export const sectionTimeService = {
  getCollection(): SectionTimeRecord[] {
    return mockDatabase.getCollection<SectionTimeRecord>(DB_KEY);
  },

  getSectionTime(moduleKey: string, dayNumber: string, sectionId: string): { totalSectionTime: number; lastVisitedAt: string } {
    const list = this.getCollection();
    const matches = list.filter(
      r => r.moduleKey === moduleKey && r.dayNumber === dayNumber && r.sectionId === sectionId
    );
    if (matches.length === 0) {
      return { totalSectionTime: 0, lastVisitedAt: "" };
    }
    const totalSectionTime = matches.reduce((acc, curr) => acc + curr.durationSeconds, 0);
    const lastVisitedAt = matches.reduce((latest, curr) => curr.endedAt > latest ? curr.endedAt : latest, "");
    return { totalSectionTime, lastVisitedAt };
  },

  async saveSectionTime(
    moduleKey: string,
    dayNumber: string,
    sectionId: string,
    startedAt: string,
    endedAt: string,
    durationSeconds: number
  ): Promise<SectionTimeRecord> {
    const prev = this.getSectionTime(moduleKey, dayNumber, sectionId);
    const totalSectionTime = prev.totalSectionTime + durationSeconds;
    
    const record: SectionTimeRecord = {
      id: mockDatabase.uid("st"),
      moduleKey,
      dayNumber,
      sectionId,
      startedAt,
      endedAt,
      durationSeconds,
      totalSectionTime,
      lastVisitedAt: endedAt
    };

    mockDatabase.addToCollection(DB_KEY, record);
    return record;
  },

  getTotalTimeToday(): number {
    const list = this.getCollection();
    const today = new Date().toDateString();
    return list
      .filter(r => new Date(r.endedAt).toDateString() === today)
      .reduce((acc, r) => acc + r.durationSeconds, 0);
  },

  getTimeStats(): {
    dayWise: Record<string, number>;
    weekWise: Record<string, number>;
    monthWise: Record<string, number>;
    sectionWise: Record<string, number>;
  } {
    const list = this.getCollection();
    const dayWise: Record<string, number> = {};
    const weekWise: Record<string, number> = {};
    const monthWise: Record<string, number> = {};
    const sectionWise: Record<string, number> = {};

    list.forEach(r => {
      const date = new Date(r.endedAt);
      const dateString = date.toDateString();
      dayWise[dateString] = (dayWise[dateString] || 0) + r.durationSeconds;

      const firstDayOfWeek = new Date(date);
      firstDayOfWeek.setDate(date.getDate() - date.getDay());
      const weekKey = firstDayOfWeek.toDateString();
      weekWise[weekKey] = (weekWise[weekKey] || 0) + r.durationSeconds;

      const monthKey = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      monthWise[monthKey] = (monthWise[monthKey] || 0) + r.durationSeconds;

      const secKey = `${r.dayNumber}_${r.sectionId}`;
      sectionWise[secKey] = (sectionWise[secKey] || 0) + r.durationSeconds;
    });

    return { dayWise, weekWise, monthWise, sectionWise };
  }
};

export default sectionTimeService;
