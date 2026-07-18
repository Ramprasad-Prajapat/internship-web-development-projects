import type {
  DailyTask,
  DashboardData,
  HomeworkTask,
  Mistake,
  MistakeCategory,
  ReadingSession,
  SkillKey,
  SkillProgress,
  SpeakingSession,
  VocabStatus,
  VocabularyWord,
  WeeklyPoint,
  WritingCheckResult,
} from "../types/learning.types";
import { lastNDays, todayKey } from "../utils/dateUtils";

/**
 * MOCK learning service (frontend prototype only).
 *
 * Everything is stored in localStorage. All functions are async so the
 * components do not need to change when we swap this for real API calls
 * (via src/api/axiosClient.ts) once the Spring Boot backend exists.
 *
 * No API keys, no secrets — this is safe demo data only.
 */

const KEYS = {
  vocab: "eng_vocab",
  mistakes: "eng_mistakes",
  homework: "eng_homework",
  speaking: "eng_speaking",
  reading: "eng_reading",
  tasks: "eng_today_tasks",
  counts: "eng_counts", // { [date]: { speaking, writing, reading, vocabulary, grammar } }
  scores: "eng_daily_scores", // { [date]: number }
  streak: "eng_streak",
  seeded: "eng_seeded_v1",
} as const;

type CountMap = Record<string, Partial<Record<SkillKey, number>>>;

const TARGETS: Record<SkillKey, number> = {
  speaking: 3,
  writing: 5,
  reading: 1,
  vocabulary: 5,
  grammar: 3,
};

const SKILL_LABELS: Record<SkillKey, string> = {
  speaking: "Speaking",
  writing: "Writing",
  reading: "Reading",
  vocabulary: "Vocabulary",
  grammar: "Grammar",
};

const MOTIVATIONS = [
  "Small practice every day beats big practice once a week. 🌱",
  "Every mistake is a step forward. Keep going! 💪",
  "Speak a little today. Tomorrow it gets easier. 🗣️",
  "You don't need perfect English — you need daily English. ✨",
  "One paragraph, one word, one sentence. That's progress. 📈",
];

// ---------- low-level storage helpers ----------
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
    // ignore (e.g. storage full / private mode)
  }
}
function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now()
    .toString(36)
    .slice(-3)}`;
}
function nowIso(): string {
  return new Date().toISOString();
}

// ---------- seeding (runs once) ----------
function ensureSeeded(): void {
  if (localStorage.getItem(KEYS.seeded)) return;

  const seedVocab: VocabularyWord[] = [
    {
      id: uid("v"),
      word: "improve",
      meaning: "to make better",
      hindiMeaning: "sudhaarna",
      example: "I want to improve my English.",
      status: "learning",
      createdAt: nowIso(),
    },
    {
      id: uid("v"),
      word: "routine",
      meaning: "things you do regularly",
      hindiMeaning: "dincharya",
      example: "My morning routine starts at 7 AM.",
      status: "learning",
      createdAt: nowIso(),
    },
    {
      id: uid("v"),
      word: "confident",
      meaning: "sure about yourself",
      hindiMeaning: "aatmavishwaasi",
      example: "I feel confident when I speak slowly.",
      status: "weak",
      createdAt: nowIso(),
    },
    {
      id: uid("v"),
      word: "practice",
      meaning: "to do something to get better",
      hindiMeaning: "abhyaas",
      example: "I practice speaking every day.",
      status: "learned",
      createdAt: nowIso(),
    },
    {
      id: uid("v"),
      word: "mistake",
      meaning: "something done wrong",
      hindiMeaning: "galti",
      example: "A small mistake is okay while learning.",
      status: "learning",
      createdAt: nowIso(),
    },
  ];

  const seedMistakes: Mistake[] = [
    {
      id: uid("m"),
      category: "grammar",
      wrong: "I am go to market.",
      correct: "I am going to the market.",
      rule: "Use verb + ing after am/is/are (present continuous).",
      source: "Speaking",
      fixed: false,
      createdAt: nowIso(),
    },
    {
      id: uid("m"),
      category: "sentence",
      wrong: "She no like tea.",
      correct: "She does not like tea.",
      rule: "Use does not + base verb for he/she/it in negatives.",
      source: "Writing",
      fixed: false,
      createdAt: nowIso(),
    },
  ];

  const seedHomework: HomeworkTask[] = [
    { id: uid("h"), title: "Learn 5 new vocabulary words", done: false, createdAt: nowIso() },
    { id: uid("h"), title: "Write 5 sentences about your day", done: false, createdAt: nowIso() },
    { id: uid("h"), title: "Speak for 1 minute about your routine", done: false, createdAt: nowIso() },
    { id: uid("h"), title: "Read one short paragraph aloud", done: false, createdAt: nowIso() },
    { id: uid("h"), title: "Correct 3 old mistakes", done: false, createdAt: nowIso() },
  ];

  const seedTasks: DailyTask[] = [
    { id: uid("t"), label: "Learn 5 new words", type: "vocabulary", done: false },
    { id: uid("t"), label: "Write 5 sentences about your day", type: "writing", done: false },
    { id: uid("t"), label: "Answer 3 speaking questions", type: "speaking", done: false },
    { id: uid("t"), label: "Read 1 short paragraph aloud", type: "reading", done: false },
    { id: uid("t"), label: "Correct yesterday's mistakes", type: "homework", done: false },
  ];

  // Seed a little past history so the weekly chart is not empty.
  const days = lastNDays(7);
  const scores: Record<string, number> = {};
  const sample = [45, 60, 70, 55, 80, 65];
  days.slice(0, 6).forEach((d, i) => {
    scores[d.date] = sample[i] ?? 50;
  });

  write(KEYS.vocab, seedVocab);
  write(KEYS.mistakes, seedMistakes);
  write(KEYS.homework, seedHomework);
  write(KEYS.tasks, { date: todayKey(), items: seedTasks });
  write(KEYS.scores, scores);
  write(KEYS.streak, 4);
  localStorage.setItem(KEYS.seeded, "1");
}

// ---------- counts (per-day skill activity) ----------
function getCountsForToday(): Partial<Record<SkillKey, number>> {
  const map = read<CountMap>(KEYS.counts, {});
  return map[todayKey()] ?? {};
}

async function incrementCount(skill: SkillKey, by = 1): Promise<void> {
  ensureSeeded();
  const map = read<CountMap>(KEYS.counts, {});
  const today = todayKey();
  const day = map[today] ?? {};
  day[skill] = (day[skill] ?? 0) + by;
  map[today] = day;
  write(KEYS.counts, map);
  // keep today's daily score in sync
  const scores = read<Record<string, number>>(KEYS.scores, {});
  scores[today] = computeTodayScore();
  write(KEYS.scores, scores);
}

function computeTodayScore(): number {
  const counts = getCountsForToday();
  const keys = Object.keys(TARGETS) as SkillKey[];
  const total = keys.reduce((sum, k) => {
    const pct = Math.min(100, ((counts[k] ?? 0) / TARGETS[k]) * 100);
    return sum + pct;
  }, 0);
  return Math.round(total / keys.length);
}

// ---------- skills ----------
async function getSkills(): Promise<SkillProgress[]> {
  ensureSeeded();
  const counts = getCountsForToday();
  return (Object.keys(TARGETS) as SkillKey[]).map((key) => {
    const done = counts[key] ?? 0;
    const target = TARGETS[key];
    return {
      key,
      label: SKILL_LABELS[key],
      done,
      target,
      value: Math.min(100, Math.round((done / target) * 100)),
    };
  });
}

// ---------- today tasks ----------
async function getTodayTasks(): Promise<DailyTask[]> {
  ensureSeeded();
  const stored = read<{ date: string; items: DailyTask[] }>(KEYS.tasks, {
    date: "",
    items: [],
  });
  if (stored.date !== todayKey()) {
    // new day → reset checkboxes but keep labels
    const items = stored.items.map((t) => ({ ...t, done: false }));
    write(KEYS.tasks, { date: todayKey(), items });
    return items;
  }
  return stored.items;
}

async function toggleTask(id: string): Promise<DailyTask[]> {
  const stored = read<{ date: string; items: DailyTask[] }>(KEYS.tasks, {
    date: todayKey(),
    items: [],
  });
  const items = stored.items.map((t) =>
    t.id === id ? { ...t, done: !t.done } : t,
  );
  write(KEYS.tasks, { date: todayKey(), items });
  return items;
}

// ---------- streak + weekly ----------
async function getStreak(): Promise<number> {
  ensureSeeded();
  return read<number>(KEYS.streak, 0);
}

async function getWeekly(): Promise<WeeklyPoint[]> {
  ensureSeeded();
  const scores = read<Record<string, number>>(KEYS.scores, {});
  scores[todayKey()] = computeTodayScore();
  return lastNDays(7).map((d) => ({
    day: d.day,
    date: d.date,
    score: scores[d.date] ?? 0,
  }));
}

// ---------- vocabulary ----------
async function listVocab(): Promise<VocabularyWord[]> {
  ensureSeeded();
  return read<VocabularyWord[]>(KEYS.vocab, []);
}

async function addVocab(input: {
  word: string;
  meaning: string;
  hindiMeaning: string;
  example: string;
}): Promise<VocabularyWord> {
  ensureSeeded();
  const list = read<VocabularyWord[]>(KEYS.vocab, []);
  const word: VocabularyWord = {
    id: uid("v"),
    word: input.word.trim(),
    meaning: input.meaning.trim(),
    hindiMeaning: input.hindiMeaning.trim(),
    example: input.example.trim(),
    status: "learning",
    createdAt: nowIso(),
  };
  write(KEYS.vocab, [word, ...list]);
  return word;
}

async function setVocabStatus(
  id: string,
  status: VocabStatus,
): Promise<VocabularyWord[]> {
  const list = read<VocabularyWord[]>(KEYS.vocab, []);
  const updated = list.map((w) => (w.id === id ? { ...w, status } : w));
  write(KEYS.vocab, updated);
  if (status === "learned") await incrementCount("vocabulary");
  return updated;
}

async function deleteVocab(id: string): Promise<VocabularyWord[]> {
  const list = read<VocabularyWord[]>(KEYS.vocab, []).filter((w) => w.id !== id);
  write(KEYS.vocab, list);
  return list;
}

// ---------- mistakes ----------
async function listMistakes(): Promise<Mistake[]> {
  ensureSeeded();
  return read<Mistake[]>(KEYS.mistakes, []);
}

async function addMistake(input: {
  category: MistakeCategory;
  wrong: string;
  correct: string;
  rule: string;
  source: string;
}): Promise<Mistake> {
  ensureSeeded();
  const list = read<Mistake[]>(KEYS.mistakes, []);
  const mistake: Mistake = {
    id: uid("m"),
    category: input.category,
    wrong: input.wrong,
    correct: input.correct,
    rule: input.rule,
    source: input.source,
    fixed: false,
    createdAt: nowIso(),
  };
  write(KEYS.mistakes, [mistake, ...list]);
  return mistake;
}

async function markMistakeFixed(id: string): Promise<Mistake[]> {
  const list = read<Mistake[]>(KEYS.mistakes, []);
  const updated = list.map((m) => (m.id === id ? { ...m, fixed: true } : m));
  write(KEYS.mistakes, updated);
  return updated;
}

// ---------- homework ----------
async function listHomework(): Promise<HomeworkTask[]> {
  ensureSeeded();
  return read<HomeworkTask[]>(KEYS.homework, []);
}

async function addHomework(title: string): Promise<HomeworkTask[]> {
  ensureSeeded();
  const list = read<HomeworkTask[]>(KEYS.homework, []);
  const task: HomeworkTask = {
    id: uid("h"),
    title: title.trim(),
    done: false,
    createdAt: nowIso(),
  };
  const updated = [...list, task];
  write(KEYS.homework, updated);
  return updated;
}

async function toggleHomework(id: string): Promise<HomeworkTask[]> {
  const list = read<HomeworkTask[]>(KEYS.homework, []);
  const updated = list.map((t) =>
    t.id === id ? { ...t, done: !t.done } : t,
  );
  write(KEYS.homework, updated);
  return updated;
}

// ---------- speaking ----------
async function listSpeaking(): Promise<SpeakingSession[]> {
  return read<SpeakingSession[]>(KEYS.speaking, []);
}

async function saveSpeaking(input: {
  question: string;
  transcript: string;
  feedback: string;
  score: number;
}): Promise<SpeakingSession> {
  ensureSeeded();
  const list = read<SpeakingSession[]>(KEYS.speaking, []);
  const session: SpeakingSession = {
    id: uid("s"),
    question: input.question,
    transcript: input.transcript,
    feedback: input.feedback,
    score: input.score,
    createdAt: nowIso(),
  };
  write(KEYS.speaking, [session, ...list]);
  await incrementCount("speaking");
  return session;
}

// ---------- reading ----------
async function listReading(): Promise<ReadingSession[]> {
  return read<ReadingSession[]>(KEYS.reading, []);
}

async function saveReading(input: {
  title: string;
  accuracy: number;
}): Promise<ReadingSession> {
  ensureSeeded();
  const list = read<ReadingSession[]>(KEYS.reading, []);
  const session: ReadingSession = {
    id: uid("r"),
    title: input.title,
    accuracy: input.accuracy,
    createdAt: nowIso(),
  };
  write(KEYS.reading, [session, ...list]);
  await incrementCount("reading");
  return session;
}

// ---------- mock grammar check (rule-based) ----------
async function checkWriting(text: string): Promise<WritingCheckResult> {
  const original = text.trim();
  let corrected = original;
  const notes: string[] = [];

  // 1) lone "i" -> "I"
  if (/\bi\b/.test(corrected)) {
    corrected = corrected.replace(/\bi\b/g, "I");
    notes.push('Always write "I" with a capital letter.');
  }
  // 2) "am/is/are go" -> "am/is/are going" (simple present-continuous fix)
  corrected = corrected.replace(
    /\b(am|is|are)\s+go\b/gi,
    (_m, aux: string) => `${aux} going`,
  );
  if (/\b(am|is|are)\s+go\b/i.test(original)) {
    notes.push('Use verb + ing after am/is/are. Example: "am going".');
  }
  // 3) "go to market" -> "go to the market"
  corrected = corrected.replace(/\bto market\b/gi, "to the market");
  if (/\bto market\b/i.test(original)) {
    notes.push('Use "the" before common places: "to the market".');
  }
  // 4) capitalise first letter
  if (corrected.length > 0) {
    corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
  }
  // 5) add a full stop
  if (corrected.length > 0 && !/[.!?]$/.test(corrected)) {
    corrected += ".";
    notes.push("End your sentence with a full stop (.).");
  }

  const hasMistake = corrected !== original;
  return {
    original,
    corrected,
    rule: notes.length
      ? notes.join(" ")
      : "Looks good! No common mistakes found.",
    hasMistake,
  };
}

// ---------- dashboard ----------
async function getDashboard(): Promise<DashboardData> {
  ensureSeeded();
  const [streak, tasks, skills, mistakes] = await Promise.all([
    getStreak(),
    getTodayTasks(),
    getSkills(),
    listMistakes(),
  ]);

  const weakAreas = Array.from(
    new Set(
      mistakes
        .filter((m) => !m.fixed)
        .map((m) =>
          m.category === "grammar"
            ? "Present continuous tense"
            : m.category === "sentence"
              ? "Sentence structure"
              : m.category === "vocabulary"
                ? "Word choice"
                : "Speaking fluency",
        ),
    ),
  ).slice(0, 4);

  const motivation = MOTIVATIONS[new Date().getDay() % MOTIVATIONS.length];

  return {
    streak,
    motivation,
    tasks,
    skills,
    weakAreas,
    recentMistakes: mistakes.slice(0, 3),
  };
}

export const learningService = {
  // dashboard / progress
  getDashboard,
  getSkills,
  getStreak,
  getWeekly,
  getTodayTasks,
  toggleTask,
  incrementCount,
  // vocabulary
  listVocab,
  addVocab,
  setVocabStatus,
  deleteVocab,
  // mistakes
  listMistakes,
  addMistake,
  markMistakeFixed,
  // homework
  listHomework,
  addHomework,
  toggleHomework,
  // speaking / reading
  listSpeaking,
  saveSpeaking,
  listReading,
  saveReading,
  // writing
  checkWriting,
};

export default learningService;
