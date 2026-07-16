import learningService from "./mockLearningService";
import {
  PREPOSITION_TYPES,
  type PrepositionContent,
  type PrepositionNote,
  type PrepositionQuizResult,
  type PrepositionType,
} from "../types/preposition.types";

/**
 * MOCK preposition service (frontend prototype only).
 *
 * Lesson CONTENT is static beginner-friendly data (no AI, no backend). Only
 * user-created notes and quiz results are stored in localStorage. Saving a
 * mistake delegates to the existing learningService so it appears on the
 * Mistakes page too. All functions are async to stay backend-ready.
 *
 * Later backend endpoints can be:
 *   GET  /api/prepositions
 *   GET  /api/prepositions/{type}
 *   POST /api/prepositions/notes
 */

const KEYS = {
  notes: "eng_prep_notes",
  quiz: "eng_prep_quiz_results",
} as const;

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
function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now()
    .toString(36)
    .slice(-3)}`;
}
function nowIso(): string {
  return new Date().toISOString();
}

// ---------- static content (beginner-friendly) ----------
const CONTENT: Record<PrepositionType, PrepositionContent> = {
  in: {
    type: "in",
    name: "IN",
    meaning: "Inside something, or a longer period of time.",
    rule: 'Use "in" for months, years, seasons, and big places like cities and countries.',
    whenToUse: [
      "Months, years, seasons: in May, in 2025, in winter",
      "Big places: in India, in Delhi",
      "Parts of the day: in the morning, in the evening",
    ],
    whenNotToUse: [
      'Days and dates use "on", not "in": on Monday.',
      'Clock times use "at", not "in": at 6 o\'clock.',
    ],
    examples: [
      { sentence: "I was born in 1999." },
      { sentence: "It is very cold in winter." },
      { sentence: "She lives in Mumbai." },
      { sentence: "I study in the morning." },
    ],
    commonMistakes: [
      {
        wrong: "I will meet you in Monday.",
        correct: "I will meet you on Monday.",
        rule: 'Use "on" for days, not "in".',
      },
      {
        wrong: "He comes in 7 o'clock.",
        correct: "He comes at 7 o'clock.",
        rule: 'Use "at" for clock times.',
      },
    ],
    quiz: [
      {
        id: "in-q1",
        prompt: "I was born ____ 2001.",
        options: ["in", "on", "at"],
        answerIndex: 0,
        explanation: 'Use "in" for years.',
      },
      {
        id: "in-q2",
        prompt: "We play cricket ____ the evening.",
        options: ["at", "in", "on"],
        answerIndex: 1,
        explanation: 'Use "in" for parts of the day (the morning/evening).',
      },
    ],
  },
  on: {
    type: "on",
    name: "ON",
    meaning: "On the surface of something, or a specific day/date.",
    rule: 'Use "on" for days, dates, and surfaces.',
    whenToUse: [
      "Days and dates: on Monday, on 5th May",
      "Surfaces: on the table, on the wall",
      "Special days: on my birthday",
    ],
    whenNotToUse: [
      'Months and years use "in", not "on".',
      'Clock times use "at", not "on".',
    ],
    examples: [
      { sentence: "The book is on the table." },
      { sentence: "I have a class on Monday." },
      { sentence: "We met on 10th January." },
    ],
    commonMistakes: [
      {
        wrong: "My exam is in Monday.",
        correct: "My exam is on Monday.",
        rule: 'Use "on" for days.',
      },
    ],
    quiz: [
      {
        id: "on-q1",
        prompt: "The keys are ____ the table.",
        options: ["in", "on", "at"],
        answerIndex: 1,
        explanation: 'Use "on" for surfaces.',
      },
      {
        id: "on-q2",
        prompt: "My holiday starts ____ Friday.",
        options: ["on", "in", "at"],
        answerIndex: 0,
        explanation: 'Use "on" for days.',
      },
    ],
  },
  at: {
    type: "at",
    name: "AT",
    meaning: "An exact point — a place or a time.",
    rule: 'Use "at" for exact clock times and specific places.',
    whenToUse: [
      "Clock times: at 6 o'clock, at noon",
      "Exact places: at the bus stop, at home, at school",
      "Events: at the party",
    ],
    whenNotToUse: [
      'Months and years use "in".',
      'Days use "on".',
    ],
    examples: [
      { sentence: "The bus comes at 8 o'clock." },
      { sentence: "I am at home now." },
      { sentence: "We will meet at the station." },
    ],
    commonMistakes: [
      {
        wrong: "I get up in 6 o'clock.",
        correct: "I get up at 6 o'clock.",
        rule: 'Use "at" for clock times.',
      },
    ],
    quiz: [
      {
        id: "at-q1",
        prompt: "School starts ____ 9 o'clock.",
        options: ["in", "on", "at"],
        answerIndex: 2,
        explanation: 'Use "at" for clock times.',
      },
      {
        id: "at-q2",
        prompt: "I will wait ____ the bus stop.",
        options: ["at", "in", "on"],
        answerIndex: 0,
        explanation: 'Use "at" for exact places.',
      },
    ],
  },
  to: {
    type: "to",
    name: "TO",
    meaning: "Movement towards a place or person.",
    rule: 'Use "to" to show direction or movement towards something.',
    whenToUse: [
      "Going somewhere: go to school, go to the market",
      "Giving to someone: give it to me",
      "From one point to another: from 9 to 5",
    ],
    whenNotToUse: [
      '"home" does not need "to": say "go home".',
      'Staying in a place uses "at" or "in", not "to".',
    ],
    examples: [
      { sentence: "I go to school every day." },
      { sentence: "Please give this book to her." },
      { sentence: "We walked to the park." },
    ],
    commonMistakes: [
      {
        wrong: "I go to home after work.",
        correct: "I go home after work.",
        rule: '"home" does not need "to".',
      },
    ],
    quiz: [
      {
        id: "to-q1",
        prompt: "Every morning I go ____ the gym.",
        options: ["to", "at", "in"],
        answerIndex: 0,
        explanation: 'Use "to" for movement towards a place.',
      },
      {
        id: "to-q2",
        prompt: "She gave the pen ____ me.",
        options: ["at", "to", "for"],
        answerIndex: 1,
        explanation: 'Use "to" when giving something to someone.',
      },
    ],
  },
  from: {
    type: "from",
    name: "FROM",
    meaning: "The starting point of something.",
    rule: 'Use "from" to show where something starts (place, time or person).',
    whenToUse: [
      "Starting place: I am from India.",
      "Starting time: open from 9 am.",
      "Sender: a gift from my friend.",
    ],
    whenNotToUse: [
      'The end point uses "to": from 9 to 5.',
    ],
    examples: [
      { sentence: "I am from a small village." },
      { sentence: "The shop is open from 10 am." },
      { sentence: "This letter is from my brother." },
    ],
    commonMistakes: [
      {
        wrong: "I come to Delhi.",
        correct: "I come from Delhi.",
        rule: 'Use "from" to show your origin/start.',
      },
    ],
    quiz: [
      {
        id: "from-q1",
        prompt: "Where are you ____?",
        options: ["from", "to", "at"],
        answerIndex: 0,
        explanation: 'Use "from" for origin.',
      },
      {
        id: "from-q2",
        prompt: "The class runs ____ 9 to 11.",
        options: ["at", "from", "on"],
        answerIndex: 1,
        explanation: 'Use "from ... to ..." for a time range.',
      },
    ],
  },
  by: {
    type: "by",
    name: "BY",
    meaning: "Near something, or how you do something.",
    rule: 'Use "by" for "how" (method) and for "near" or "not later than" a time.',
    whenToUse: [
      "Method: by bus, by car, by hand",
      "Near: sit by the window",
      "Deadline: finish by 5 pm",
    ],
    whenNotToUse: [
      'For an exact start time use "at": at 5, not by 5 (unless you mean a deadline).',
    ],
    examples: [
      { sentence: "I go to work by bus." },
      { sentence: "Please finish it by Friday." },
      { sentence: "She sat by the window." },
    ],
    commonMistakes: [
      {
        wrong: "I came with bus.",
        correct: "I came by bus.",
        rule: 'Use "by" for transport: by bus, by car.',
      },
    ],
    quiz: [
      {
        id: "by-q1",
        prompt: "I travel ____ train.",
        options: ["with", "by", "on"],
        answerIndex: 1,
        explanation: 'Use "by" for transport.',
      },
      {
        id: "by-q2",
        prompt: "Submit the homework ____ Monday.",
        options: ["by", "at", "in"],
        answerIndex: 0,
        explanation: 'Use "by" for a deadline (not later than).',
      },
    ],
  },
  with: {
    type: "with",
    name: "WITH",
    meaning: "Together, or using something.",
    rule: 'Use "with" for "together with" someone or "using" a tool.',
    whenToUse: [
      "Together: I live with my family.",
      "Using a tool: cut it with a knife.",
      "Having a feature: a man with a beard.",
    ],
    whenNotToUse: [
      'Transport uses "by", not "with": by bus, not with bus.',
    ],
    examples: [
      { sentence: "I play with my friends." },
      { sentence: "She writes with a pen." },
      { sentence: "Tea with milk, please." },
    ],
    commonMistakes: [
      {
        wrong: "I will go with foot.",
        correct: "I will go on foot.",
        rule: 'Say "on foot", not "with foot".',
      },
    ],
    quiz: [
      {
        id: "with-q1",
        prompt: "I cut the apple ____ a knife.",
        options: ["by", "with", "on"],
        answerIndex: 1,
        explanation: 'Use "with" for the tool you use.',
      },
      {
        id: "with-q2",
        prompt: "He lives ____ his parents.",
        options: ["with", "by", "at"],
        answerIndex: 0,
        explanation: 'Use "with" for "together with".',
      },
    ],
  },
  for: {
    type: "for",
    name: "FOR",
    meaning: "Purpose, who gets something, or a length of time.",
    rule: 'Use "for" to show purpose, the receiver, or how long.',
    whenToUse: [
      "Purpose: this is for cleaning.",
      "Receiver: a gift for you.",
      "Duration: I studied for two hours.",
    ],
    whenNotToUse: [
      'A starting point in time uses "since": since Monday (not for Monday).',
    ],
    examples: [
      { sentence: "This gift is for you." },
      { sentence: "I waited for ten minutes." },
      { sentence: "We use it for cooking." },
    ],
    commonMistakes: [
      {
        wrong: "I have lived here since five years.",
        correct: "I have lived here for five years.",
        rule: 'Use "for" with a length of time.',
      },
    ],
    quiz: [
      {
        id: "for-q1",
        prompt: "I have been waiting ____ 20 minutes.",
        options: ["since", "for", "at"],
        answerIndex: 1,
        explanation: 'Use "for" with a length of time.',
      },
      {
        id: "for-q2",
        prompt: "This letter is ____ you.",
        options: ["for", "to", "by"],
        answerIndex: 0,
        explanation: 'Use "for" for who receives something.',
      },
    ],
  },
  about: {
    type: "about",
    name: "ABOUT",
    meaning: "On the topic of, or approximately.",
    rule: 'Use "about" for the topic of something, or to mean "around / approximately".',
    whenToUse: [
      "Topic: a book about animals.",
      "Talking of: we talked about you.",
      "Approximately: about 20 people came.",
    ],
    whenNotToUse: [
      'For an exact number, say the number directly (do not add "about").',
    ],
    examples: [
      { sentence: "This story is about a brave girl." },
      { sentence: "Tell me about your day." },
      { sentence: "There were about fifty students." },
    ],
    commonMistakes: [
      {
        wrong: "We talked on the weather.",
        correct: "We talked about the weather.",
        rule: 'Use "about" for the topic you talk of.',
      },
    ],
    quiz: [
      {
        id: "about-q1",
        prompt: "This video is ____ healthy food.",
        options: ["about", "for", "on"],
        answerIndex: 0,
        explanation: 'Use "about" for the topic.',
      },
      {
        id: "about-q2",
        prompt: "____ 30 people joined the class.",
        options: ["At", "About", "On"],
        answerIndex: 1,
        explanation: '"About" can mean approximately.',
      },
    ],
  },
  between: {
    type: "between",
    name: "BETWEEN",
    meaning: "In the middle of two things or people.",
    rule: 'Use "between" for two clear things; use "among" for three or more.',
    whenToUse: [
      "Two things: sit between Ram and Sita.",
      "Two times/places: between Monday and Friday.",
      "A choice of two: choose between tea and coffee.",
    ],
    whenNotToUse: [
      'For more than two items use "among": among the students.',
    ],
    examples: [
      { sentence: "The bank is between the school and the park." },
      { sentence: "I will call between 4 and 5 pm." },
      { sentence: "It is a secret between you and me." },
    ],
    commonMistakes: [
      {
        wrong: "Share it between all five friends.",
        correct: "Share it among all five friends.",
        rule: 'Use "among" for more than two.',
      },
    ],
    quiz: [
      {
        id: "between-q1",
        prompt: "My house is ____ the shop and the temple.",
        options: ["among", "between", "with"],
        answerIndex: 1,
        explanation: 'Use "between" for two things.',
      },
      {
        id: "between-q2",
        prompt: "Divide the sweets ____ the two kids.",
        options: ["between", "among", "by"],
        answerIndex: 0,
        explanation: 'Two kids → "between".',
      },
    ],
  },
};

// ---------- content reads ----------
async function listPrepositions(): Promise<PrepositionContent[]> {
  return PREPOSITION_TYPES.map((t) => CONTENT[t]);
}

function isPrepositionType(t: string): t is PrepositionType {
  return (PREPOSITION_TYPES as readonly string[]).includes(t);
}

async function getPreposition(
  type: string,
): Promise<PrepositionContent | null> {
  return isPrepositionType(type) ? CONTENT[type] : null;
}

// ---------- notes ----------
async function listNotes(type?: PrepositionType): Promise<PrepositionNote[]> {
  const all = read<PrepositionNote[]>(KEYS.notes, []);
  return type ? all.filter((n) => n.type === type) : all;
}

async function addNote(
  type: PrepositionType,
  text: string,
): Promise<PrepositionNote> {
  const list = read<PrepositionNote[]>(KEYS.notes, []);
  const note: PrepositionNote = {
    id: uid("pn"),
    type,
    text: text.trim(),
    createdAt: nowIso(),
  };
  write(KEYS.notes, [note, ...list]);
  return note;
}

async function deleteNote(id: string): Promise<PrepositionNote[]> {
  const list = read<PrepositionNote[]>(KEYS.notes, []).filter(
    (n) => n.id !== id,
  );
  write(KEYS.notes, list);
  return list;
}

// ---------- mistakes (delegated to learningService) ----------
async function saveMistake(input: {
  type: PrepositionType;
  wrong: string;
  correct: string;
  rule: string;
}): Promise<void> {
  await learningService.addMistake({
    category: "grammar",
    wrong: input.wrong,
    correct: input.correct,
    rule: input.rule,
    source: `Preposition ${CONTENT[input.type].name}`,
  });
}

// ---------- quiz results (placeholder storage) ----------
async function saveQuizResult(
  type: PrepositionType,
  score: number,
  total: number,
): Promise<PrepositionQuizResult> {
  const list = read<PrepositionQuizResult[]>(KEYS.quiz, []);
  const result: PrepositionQuizResult = {
    id: uid("pq"),
    type,
    score,
    total,
    createdAt: nowIso(),
  };
  write(KEYS.quiz, [result, ...list]);
  return result;
}

async function listQuizResults(): Promise<PrepositionQuizResult[]> {
  return read<PrepositionQuizResult[]>(KEYS.quiz, []);
}

// ---------- counts for cards (notes + saved preposition mistakes) ----------
async function getCounts(): Promise<
  Record<PrepositionType, { notes: number; mistakes: number }>
> {
  const [notes, mistakes] = await Promise.all([
    listNotes(),
    learningService.listMistakes(),
  ]);
  const counts = {} as Record<
    PrepositionType,
    { notes: number; mistakes: number }
  >;
  for (const t of PREPOSITION_TYPES) {
    const src = `Preposition ${CONTENT[t].name}`;
    counts[t] = {
      notes: notes.filter((n) => n.type === t).length,
      mistakes: mistakes.filter((m) => m.source === src).length,
    };
  }
  return counts;
}

export const prepositionService = {
  listPrepositions,
  getPreposition,
  listNotes,
  addNote,
  deleteNote,
  saveMistake,
  saveQuizResult,
  listQuizResults,
  getCounts,
};

export default prepositionService;
