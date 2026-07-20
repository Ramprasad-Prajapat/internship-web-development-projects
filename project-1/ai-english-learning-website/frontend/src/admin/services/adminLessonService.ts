import apiClient from "../../services/apiClient";
import type { Lesson, LessonSection } from "../../types/lesson.types";
import type { AdminDaySummary, AdminSectionDetail } from "../types/admin.types";

export const adminLessonService = {
  async getDashboardStats() {
    const days = await this.getAllDays();
    let totalSections = 0;
    let publishedSections = 0;
    let draftSections = 0;
    days.forEach(d => {
      totalSections += d.totalSections;
      publishedSections += d.publishedSections;
      draftSections += d.draftSections;
    });
    
    return {
      totalDays: days.length,
      totalSections,
      publishedSections,
      draftSections,
    };
  },
  
  async getDailyLessons(): Promise<Lesson[]> {
    const response: any = await apiClient.get("/lessons");
    return response.data || [];
  },
  
  async getLessonByDay(dayNumber: number): Promise<Lesson | null> {
    try {
      const response: any = await apiClient.get(`/lessons/day/${dayNumber}`);
      return response.data;
    } catch {
      return null;
    }
  },

  async getAllDays(): Promise<AdminDaySummary[]> {
    const response: any = await apiClient.get("/admin/days");
    const raw = response.data;
    let dataArray: any[] = [];
    if (Array.isArray(raw)) {
      dataArray = raw;
    } else if (Array.isArray(raw?.data)) {
      dataArray = raw.data;
    } else if (Array.isArray(raw?.content)) {
      dataArray = raw.content;
    }
    return dataArray.map((day: any) => {
      const sections = day.sections || [];
      const published = sections.filter((s: any) => (s.status || "").toLowerCase() !== "draft").length;
      const drafts = sections.filter((s: any) => (s.status || "").toLowerCase() === "draft").length;
      return {
        id: day.id,
        dayNumber: day.dayNumber,
        title: day.title || `Day ${day.dayNumber}`,
        totalSections: sections.length,
        publishedSections: published,
        draftSections: drafts,
        lastUpdated: new Date().toISOString(),
      };
    });
  },

  async addNextDay(): Promise<any> {
    const response: any = await apiClient.post("/admin/days/add-next");
    return response.data;
  },

  async deleteDay(id: number): Promise<void> {
    await apiClient.delete(`/admin/days/${id}`);
  },

  async createDay(dayNumber: number, title: string): Promise<Lesson> {
    const existing = await this.getLessonByDay(dayNumber);
    if (existing) return existing;

    const response: any = await apiClient.post(`/admin/lessons/day/${dayNumber}`, {
      title,
      mode: "replace",
      sections: [
        { heading: "Introduction", body: `Welcome to Day ${dayNumber} lesson.` }
      ]
    });
    return response.data;
  },

  async saveDayContent(
    dayNumber: number,
    title: string,
    parsedSections: LessonSection[],
    mode: "replace" | "merge"
  ): Promise<Lesson> {
    const response: any = await apiClient.post(`/admin/lessons/day/${dayNumber}`, {
      title,
      mode,
      sections: parsedSections.map(s => ({ heading: s.heading, body: s.body }))
    });
    return response.data;
  },

  async clearDayContent(dayNumber: number): Promise<void> {
    await apiClient.delete(`/admin/lessons/day/${dayNumber}`);
  },

  async getDaySections(dayNumber: number): Promise<AdminSectionDetail[]> {
    const response: any = await apiClient.get(`/admin/days/${dayNumber}/sections`);
    const sections = response.data || [];
    return sections.map((sec: any, index: number) => ({
      id: sec.id,
      heading: sec.title || sec.heading || "",
      content: sec.content || sec.body || "",
      status: sec.status || "Published",
      order: sec.order !== undefined ? sec.order : index,
      description: ""
    }));
  },

  async addSection(dayId: number, sectionData: any): Promise<void> {
    await apiClient.post(`/admin/days/${dayId}/sections`, {
      title: sectionData.heading,
      content: sectionData.content,
      category: sectionData.category,
      status: sectionData.status || "Published"
    });
  },
 
  async updateSection(
    dayNumber: number,
    oldHeading: string,
    updatedSection: LessonSection,
    status: "Published" | "Draft" | "published" | "draft",
    description?: string
  ): Promise<void> {
    const lesson = await this.getLessonByDay(dayNumber);
    if (!lesson) throw new Error("Lesson not found");
    const sec = ((lesson as any).sections || []).find((s: any) => (s.heading || s.title) === oldHeading);
    if (sec) {
      await apiClient.put(`/admin/lessons/sections/${sec.id}`, {
        heading: updatedSection.heading,
        body: updatedSection.body,
        status: status
      });
    }
  },
 
  async deleteSection(dayNumber: number, sectionId: string): Promise<void> {
    await apiClient.delete(`/admin/lessons/sections/${sectionId}`);
  },
 
  async updateSectionStatus(dayNumber: number, sectionId: string, nextStatus: "Published" | "Draft"): Promise<void> {
    await apiClient.put(`/admin/sections/${sectionId}`, {
      status: nextStatus
    });
  },
 
  async getSectionDetail(dayNumber: number, sectionHeading: string): Promise<AdminSectionDetail | null> {
    const lesson = await this.getLessonByDay(dayNumber);
    if (!lesson) return null;
    const sec = ((lesson as any).sections || []).find((s: any) => (s.heading || s.title) === sectionHeading);
    if (!sec) return null;
 
    return {
      id: sec.id,
      heading: sec.title || sec.heading || "",
      content: sec.content || sec.body || "",
      status: sec.status || "Published",
      order: sec.order !== undefined ? sec.order : 0,
      description: ""
    };
  },

  async previewDayContent(dayNumber: number, rawContent: string): Promise<any> {
    const response: any = await apiClient.post(`/admin/days/${dayNumber}/content/preview`, { rawContent });
    return response.data;
  },

  async importDayContent(dayNumber: number, data: { title: string; rawContent: string; mode: string; sections?: any[] }): Promise<any> {
    const response: any = await apiClient.post(`/admin/days/${dayNumber}/content/import`, data);
    return response.data;
  },

  async getAdminLessonByDay(dayNumber: number): Promise<any> {
    const response: any = await apiClient.get(`/admin/lessons/day/${dayNumber}`);
    return response.data;
  },

  async updateAdminLessonContent(dayNumber: number, data: { title: string; rawContent: string; sections?: any[] }): Promise<any> {
    const response: any = await apiClient.put(`/admin/lessons/day/${dayNumber}/content`, data);
    return response.data;
  },

  async replaceAdminLessonContent(dayNumber: number, data: { title: string; rawContent: string; sections?: any[] }): Promise<any> {
    const response: any = await apiClient.post(`/admin/lessons/day/${dayNumber}/replace`, data);
    return response.data;
  },

  async removeAdminLessonContent(dayNumber: number): Promise<any> {
    const response: any = await apiClient.delete(`/admin/lessons/day/${dayNumber}/content`);
    return response.data;
  },

  async exportMockData(): Promise<string> {
    const response: any = await apiClient.get("/admin/settings/backup/export");
    return JSON.stringify(response.data, null, 2);
  },

  async importMockData(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);
    await apiClient.post("/admin/settings/backup/import", data);
  },

  async resetMockData(): Promise<void> {
    await apiClient.post("/admin/settings/backup/reset");
  }
};

export default adminLessonService;
