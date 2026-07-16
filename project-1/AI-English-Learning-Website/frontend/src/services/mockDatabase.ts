// Phase 4 — mock database: a tiny typed gateway over localStorage.
//
// Services talk to THIS module; pages never touch localStorage directly, so the
// data flow stays:  Page → service → mockDatabase → localStorage.
//
// Backend-ready: when the Spring Boot API exists, swap these read/write calls
// for axiosClient calls inside the services and the page/component code is
// unchanged. This module is intentionally generic (collections of T[]).
//
// It owns ONLY the new Phase-4 collections. Existing data (lessons, dailyLessons
// progress, prepositions notes, history, auth, legacy mistakes) keeps its own
// service + keys and is NOT touched here.

export const DB_KEYS = {
  generatedQuestions: "eng_p4_questions",
  practiceAnswers: "eng_p4_answers",
  practiceSessions: "eng_p4_sessions",
  mistakes: "eng_p4_mistakes",
  extensionInboxItems: "eng_p5_extension_inbox",
  notebookItems: "eng_ai_notebook_items",
  bookmarks: "eng_p5_bookmarks",
  savedSentences: "eng_p5_saved_sentences",
  practiceAttempts: "eng_practice_center_attempts",
  englishAssessmentResult: "eng_english_assessment_result",
  learningTimes: "eng_learning_times",
  homeworkProgress: "eng_homework_progress",
  selfCheckSubmissions: "eng_selfcheck_submissions",
} as const;

export type DbKey = (typeof DB_KEYS)[keyof typeof DB_KEYS];

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore (storage full / private mode)
  }
}

/** Read a whole collection (defaults to an empty array). */
export function getCollection<T>(key: DbKey): T[] {
  return read<T[]>(key, []);
}

/** Overwrite a whole collection. */
export function setCollection<T>(key: DbKey, items: T[]): void {
  write(key, items);
}

/** Prepend an item to a collection and return the new list. */
export function addToCollection<T>(key: DbKey, item: T): T[] {
  const next = [item, ...getCollection<T>(key)];
  setCollection(key, next);
  return next;
}

/** Short unique id with a readable prefix. */
export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now()
    .toString(36)
    .slice(-3)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function clearKeys(keys: string[]): void {
  keys.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch { }
  });
}

export const mockDatabase = {
  DB_KEYS,
  getCollection,
  setCollection,
  addToCollection,
  uid,
  nowIso,
  clearKeys,
};

export default mockDatabase;
