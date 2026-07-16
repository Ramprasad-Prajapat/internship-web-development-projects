export interface AdminDaySummary {
  id?: number;
  dayNumber: number;
  title: string;
  totalSections: number;
  publishedSections: number;
  draftSections: number;
  lastUpdated?: string;
}

export interface AdminSectionDetail {
  id: string;
  heading: string;
  content: string;
  status: "Published" | "Draft";
  order: number;
  description?: string;
}
