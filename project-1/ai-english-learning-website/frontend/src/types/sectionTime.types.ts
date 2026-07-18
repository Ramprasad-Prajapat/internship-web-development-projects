export interface SectionTimeRecord {
  id: string;
  moduleKey: string;       // courseId or moduleKey (e.g. 'english-course')
  dayNumber: string;       // lessonId or dayNumber (e.g. '1', 'preposition-in')
  sectionId: string;       // sectionId (e.g. 'concept', 'examples')
  startedAt: string;       // ISO string when session started
  endedAt: string;         // ISO string when session ended
  durationSeconds: number; // duration of this session
  totalSectionTime: number;// cumulative seconds spent on this section
  lastVisitedAt: string;   // ISO string of the latest visit
}
