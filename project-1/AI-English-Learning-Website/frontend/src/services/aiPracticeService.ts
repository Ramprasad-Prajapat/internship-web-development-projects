import apiClient from "./apiClient";
import lessonService from "./lessonService";
import type {
  AnswerCheckResult,
  CheckAnswerInput,
  PracticeAnswer,
  PracticeSession,
  PracticeSummary,
  Question,
  SaveAnswerInput,
} from "../types/ai.types";

function topicFromTitle(title: string): string {
  const dash = title.split(/[—-]/).pop()?.trim();
  return dash && dash.length > 1 ? dash : title.trim();
}

function keywordFromLesson(tags: string[], rawContent: string): string {
  if (tags[0]) return tags[0];
  const word = rawContent
    .replace(/[^a-zA-Z\s]/g, " ")
    .split(/\s+/)
    .find((w) => w.length >= 4);
  return word ?? "today";
}

async function generateDailyLessonQuestions(
  lessonId: string,
): Promise<Question[]> {
  const lesson = await lessonService.getLesson(lessonId);
  if (!lesson) return [];
  const topic = topicFromTitle(lesson.title);
  const keyword = keywordFromLesson(lesson.tags, lesson.rawContent);
  const at = new Date().toISOString();

  const specs = [
    {
      questionText: `Write 3 simple sentences about "${topic}".`,
      sampleAnswer: "I get up early. I drink tea. Then I study English.",
      answerType: "sentence",
      difficulty: "easy",
    },
    {
      questionText: `Make one sentence using the word "${keyword}".`,
      sampleAnswer: `This is a good ${keyword}.`,
      answerType: "sentence",
      difficulty: "easy",
    },
    {
      questionText: `Answer in your own words: what did you learn from "${topic}"?`,
      sampleAnswer: `I learned how to talk about ${topic.toLowerCase()} in simple English.`,
      answerType: "sentence",
      difficulty: "medium",
    },
    {
      questionText: `Fill in the blank: I ____ English every day. (practice / practices)`,
      sampleAnswer: "practice",
      answerType: "fill-blank",
      difficulty: "easy",
    },
    {
      questionText: `Write 2 sentences you can say out loud about "${topic}".`,
      sampleAnswer: "I want to improve. I will practice daily.",
      answerType: "sentence",
      difficulty: "medium",
    },
  ];

  const questions: Question[] = specs.map((spec, i) => ({
    id: `q_daily_${lessonId}_${i}`,
    sourceType: "DAILY_LESSON",
    sourceId: lessonId,
    questionText: spec.questionText,
    sampleAnswer: spec.sampleAnswer,
    answerType: spec.answerType as any,
    difficulty: spec.difficulty as any,
    createdAt: at,
  }));

  return questions;
}

async function generatePrepositionQuestions(
  prepName: string,
): Promise<Question[]> {
  const at = new Date().toISOString();
  return [
    {
      id: `q_prep_${prepName}_0`,
      sourceType: "PREPOSITION",
      sourceId: prepName.toLowerCase(),
      questionText: `Write a sentence describing an object using the preposition "${prepName}".`,
      sampleAnswer: `The book is ${prepName.toLowerCase()} the table.`,
      answerType: "sentence",
      difficulty: "easy",
      createdAt: at,
    },
  ];
}

async function checkAnswer(input: CheckAnswerInput): Promise<AnswerCheckResult> {
  const response: any = await apiClient.post("/practice/check", {
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    questionText: input.questionText,
    answerText: input.userAnswer,
  });

  const data = response.data;
  return {
    wrongSentence: data.status === "failed" ? input.userAnswer : "",
    correctSentence: data.status === "failed" ? (input.sampleAnswer || "Correct sentence") : input.userAnswer,
    simpleRule: data.feedback,
    practiceAgain: data.status === "failed" ? "Please try formatting the sentence again." : "Looks great!",
    score: data.score,
    isCorrect: data.status === "passed",
  };
}

async function saveAnswer(input: SaveAnswerInput): Promise<PracticeAnswer> {
  // Directly evaluated when saved on backend
  const response: any = await apiClient.post("/practice/check", {
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    questionText: input.questionText,
    answerText: input.userAnswer,
  });
  
  const data = response.data;
  return {
    id: data.id,
    questionId: input.questionId,
    sourceType: data.sourceType,
    sourceId: data.sourceId,
    questionText: data.questionText,
    userAnswer: data.answerText,
    result: {
      wrongSentence: data.status === "failed" ? data.answerText : "",
      correctSentence: data.answerText,
      simpleRule: data.feedback,
      practiceAgain: "",
      score: data.score,
      isCorrect: data.status === "passed",
    },
    createdAt: data.createdAt,
  };
}

async function getPracticeSummary(
  sourceType: PracticeSummary["sourceType"],
  sourceId: string,
): Promise<PracticeSummary> {
  const response: any = await apiClient.get("/practice/history", {
    params: { sourceType }
  });
  const answers = (response.data || []).filter((a: any) => a.sourceId === sourceId);
  const answered = answers.length;
  const correct = answers.filter((a: any) => a.status === "passed").length;
  const averageScore = answered > 0 
    ? Math.round(answers.reduce((sum: number, a: any) => sum + a.score, 0) / answered)
    : 0;

  return {
    sourceType,
    sourceId,
    sourceTitle: "Daily Lesson Practice",
    answered,
    correct,
    averageScore,
    mistakesSaved: 0,
    lastPracticedAt: answers[0]?.createdAt ?? null,
  };
}

async function getRecentSessions(n = 5): Promise<PracticeSession[]> {
  const response: any = await apiClient.get("/practice/history");
  const history = response.data || [];
  // Map practice_answers to sessions view
  const sessions: PracticeSession[] = [];
  const seen = new Set<string>();
  
  for (const h of history) {
    const key = `${h.sourceType}_${h.sourceId}`;
    if (!seen.has(key)) {
      seen.add(key);
      sessions.push({
        id: `s_${h.id}`,
        sourceType: h.sourceType,
        sourceId: h.sourceId,
        sourceTitle: h.questionText || "Practice Session",
        answered: 1,
        correct: h.status === "passed" ? 1 : 0,
        lastScore: h.score,
        createdAt: h.createdAt,
        updatedAt: h.createdAt
      });
    }
    if (sessions.length >= n) break;
  }
  return sessions;
}

async function listSessions(): Promise<PracticeSession[]> {
  return await getRecentSessions(50);
}

async function listAnswers(): Promise<PracticeAnswer[]> {
  const response: any = await apiClient.get("/practice/history");
  const history = response.data || [];
  return history.map((h: any) => ({
    id: h.id,
    questionId: `q_${h.sourceId}`,
    sourceType: h.sourceType,
    sourceId: h.sourceId,
    questionText: h.questionText,
    userAnswer: h.answerText,
    result: {
      wrongSentence: h.status === "failed" ? h.answerText : "",
      correctSentence: h.answerText,
      simpleRule: h.feedback,
      practiceAgain: "",
      score: h.score,
      isCorrect: h.status === "passed",
    },
    createdAt: h.createdAt,
  }));
}

async function getLatestSession(
  sourceType?: PracticeSession["sourceType"],
): Promise<PracticeSession | null> {
  const all = await getRecentSessions(1);
  return all[0] ?? null;
}

export const aiPracticeService = {
  generateDailyLessonQuestions,
  generatePrepositionQuestions,
  checkAnswer,
  saveAnswer,
  getPracticeSummary,
  getRecentSessions,
  listSessions,
  listAnswers,
  getLatestSession,
};

export default aiPracticeService;
