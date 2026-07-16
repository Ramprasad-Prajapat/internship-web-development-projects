// Daily Lessons types. A "daily lesson" is any saved Lesson that has a
// dayNumber set (Day 1, Day 2, ...). Daily Lessons reuse the existing lesson
// data — they do not add a new storage table — and add per-day progress.

import type { Lesson, TopicType } from "./lesson.types";

/** Per-day practice progress (mock; one record per day number). */
export interface DailyLessonProgress {
  dayNumber: number;
  completed: boolean;
  practiceCount: number;
  lastPracticedAt: string | null; // ISO or null
}

/** All lessons saved under one day number, with that day's progress. */
export interface DayGroup {
  dayNumber: number;
  lessons: Lesson[];
  progress: DailyLessonProgress;
}

/** Days grouped under a week. weekNumber === null means "no week set". */
export interface WeekGroup {
  weekNumber: number | null;
  days: DayGroup[];
}

/** Small summary for the progress card. */
export interface DailyProgressSummary {
  totalDays: number;
  completedDays: number;
  practicedDays: number;
}

/** Filter state for the Daily Lessons page. */
export interface DailyLessonFilter {
  weekNumber: number | "all";
  dayNumber: number | "all";
  topicType: TopicType | "all";
  search: string;
}

export type ProgressMap = Record<number, DailyLessonProgress>;
