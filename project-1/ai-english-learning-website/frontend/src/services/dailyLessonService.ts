import apiClient from "./apiClient";
import type { Lesson } from "../types/lesson.types";
import type {
  DailyLessonProgress,
  DailyProgressSummary,
  DayGroup,
  ProgressMap,
  WeekGroup,
} from "../types/dailyLesson.types";

async function listDailyLessons(): Promise<Lesson[]> {
  const response: any = await apiClient.get("/lessons");
  return response.data || [];
}

async function getByDay(dayNumber: number): Promise<Lesson[]> {
  const response: any = await apiClient.get(`/lessons/day/${dayNumber}`);
  return [response.data];
}

async function getProgress(): Promise<ProgressMap> {
  const response: any = await apiClient.get("/progress");
  const list = response.data || [];
  const map: ProgressMap = {};
  list.forEach((p: any) => {
    map[p.dayNumber] = {
      dayNumber: p.dayNumber,
      completed: p.completed,
      practiceCount: 1,
      lastPracticedAt: new Date().toISOString()
    };
  });
  return map;
}

async function getDayProgress(dayNumber: number): Promise<DailyLessonProgress> {
  const map = await getProgress();
  return map[dayNumber] ?? { dayNumber, completed: false, practiceCount: 0, lastPracticedAt: null };
}

async function markDayPracticed(dayNumber: number): Promise<DailyLessonProgress> {
  return getDayProgress(dayNumber);
}

async function setDayCompleted(
  dayNumber: number,
  completed: boolean,
): Promise<DailyLessonProgress> {
  await apiClient.post("/progress", {
    dayNumber,
    completed,
  });
  return { dayNumber, completed, practiceCount: 1, lastPracticedAt: new Date().toISOString() };
}

async function getProgressSummary(): Promise<DailyProgressSummary> {
  const all = await listDailyLessons();
  const progressMap = await getProgress();
  return summarize(all, progressMap);
}

function groupByWeekDay(lessons: Lesson[], progress: ProgressMap): WeekGroup[] {
  const byWeek = new Map<number | null, Map<number, Lesson[]>>();

  for (const lesson of lessons) {
    if (lesson.dayNumber == null) continue;
    const week = lesson.weekNumber ?? null;
    if (!byWeek.has(week)) byWeek.set(week, new Map());
    const byDay = byWeek.get(week)!;
    if (!byDay.has(lesson.dayNumber)) byDay.set(lesson.dayNumber, []);
    byDay.get(lesson.dayNumber)!.push(lesson);
  }

  const weeks: WeekGroup[] = [];
  for (const [weekNumber, byDay] of byWeek) {
    const days: DayGroup[] = [];
    for (const [dayNumber, dayLessons] of byDay) {
      days.push({
        dayNumber,
        lessons: dayLessons,
        progress: progress[dayNumber] ?? { dayNumber, completed: false, practiceCount: 0, lastPracticedAt: null },
      });
    }
    days.sort((a, b) => a.dayNumber - b.dayNumber);
    weeks.push({ weekNumber, days });
  }

  weeks.sort((a, b) => {
    if (a.weekNumber == null) return 1;
    if (b.weekNumber == null) return -1;
    return a.weekNumber - b.weekNumber;
  });
  return weeks;
}

function summarize(lessons: Lesson[], progress: ProgressMap): DailyProgressSummary {
  const dayNumbers = new Set<number>();
  for (const l of lessons) if (l.dayNumber != null) dayNumbers.add(l.dayNumber);
  let completedDays = 0;
  let practicedDays = 0;
  for (const day of dayNumbers) {
    const p = progress[day];
    if (p?.completed) completedDays += 1;
    if (p && p.practiceCount > 0) practicedDays += 1;
  }
  return { totalDays: dayNumbers.size, completedDays, practicedDays };
}

async function getStudyTimeToday(): Promise<number> {
  try {
    return JSON.parse(localStorage.getItem("eng_study_time_today") || "0");
  } catch {
    return 0;
  }
}

async function saveStudyTimeToday(minutes: number): Promise<number> {
  localStorage.setItem("eng_study_time_today", JSON.stringify(minutes));
  return minutes;
}

export const dailyLessonService = {
  listDailyLessons,
  getByDay,
  getProgress,
  getDayProgress,
  markDayPracticed,
  setDayCompleted,
  groupByWeekDay,
  summarize,
  getStudyTimeToday,
  saveStudyTimeToday,
};

export default dailyLessonService;
