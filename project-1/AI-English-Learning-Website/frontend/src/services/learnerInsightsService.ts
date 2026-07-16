import mockDatabase, { DB_KEYS } from "./mockDatabase";
import historyService from "./historyService";
import mistakeService from "./mistakeService";
import dailyLessonService from "./dailyLessonService";
import { aiNotebookService } from "./aiNotebookService";
import authService from "./authService";
import type { HistoryEntry } from "../types/history.types";

export interface Bookmark {
  id: string;
  type: "lesson" | "section";
  title: string;
  routePath: string;
  createdAt: string;
}

export interface SavedSentence {
  id: string;
  sentence: string;
  meaning: string;
  source: string;
  routePath?: string;
  createdAt: string;
  reviewedAt?: string;
}

import sectionProgressService from "./sectionProgressService";
import lessonService from "./lessonService";

export interface LearnerInsights {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string;
  lastLessonTitle: string;
  lastLessonDay: number;
  lastSectionId: string;
  lastSectionTitle: string;
  
  nextRecommendedDayNumber: number | null;
  nextRecommendedSectionId: string;
  nextRecommendedSectionTitle: string;
  
  dailyGoalMinutes: number;
  completedMinutesToday: number;
  goalProgressPercent: number;
  lessonsCompletedCount: number;
  sectionsCompletedCount: number;
  totalRoadmapProgressPercent: number;
  
  writingChecksCount: number;
  speakingChecksCount: number;
  notebookNotesCount: number;
  userImportsCount: number;
  savedSentencesCount: number;
  bookmarksCount: number;
  recentBookmarks: Bookmark[];
  notebookReviewedCount: number;
  
  mistakesCount: number;
  reviewedMistakesCount: number;
  pendingMistakesCount: number;
  mistakesByCategories: {
    grammar: number;
    vocabulary: number;
    sentence: number;
    other: number;
  };
  
  revisionsCompletedCount: number;
  practiceAttemptsCount: number;
  quizzesCount: number;
  avgQuizScore: number;
  latestQuizScore: number | null;
  
  levelProgressPercent: number;
  calculatedLevel: string;
  mockAiSuggestion: string;
  weeklyReport: {
    lessonsViewed: number;
    writingChecks: number;
    speakingChecks: number;
    listeningChecks: number;
    notesSaved: number;
    mistakesSaved: number;
    mistakesReviewed: number;
    notebookNotesSaved: number;
    practiceCompleted: number;
    studyMinutes: number;
    strongestArea: string;
    weakArea: string;
    nextWeekFocus: string;
  };
  dailyTasks: Array<{ id: string; title: string; done: boolean; route: string }>;
  weakAreaScores: Record<string, number>;
  activityHeatmap: Record<string, string[]>;
}

// Bookmarks CRUD
function getBookmarks(): Bookmark[] {
  return mockDatabase.getCollection<Bookmark>(DB_KEYS.bookmarks);
}

async function addBookmark(type: "lesson" | "section", title: string, routePath: string): Promise<Bookmark[]> {
  const current = getBookmarks();
  if (current.some((b) => b.routePath === routePath)) return current;

  const newItem: Bookmark = {
    id: mockDatabase.uid("bm"),
    type,
    title,
    routePath,
    createdAt: mockDatabase.nowIso(),
  };

  const updated = mockDatabase.addToCollection<Bookmark>(DB_KEYS.bookmarks, newItem);
  
  // Log event in history
  await historyService.addEntry({
    type: "BOOKMARK_SAVED" as any,
    title: `Bookmarked ${type === "lesson" ? "Lesson" : "Section"}: ${title}`,
    description: `Added "${title}" to your personal learning bookmarks.`,
    sourceType: type === "lesson" ? "DAILY_LESSON" : "LESSON_SECTION" as any,
    sourceId: routePath,
  });

  return updated;
}

function removeBookmark(id: string): Bookmark[] {
  const current = getBookmarks();
  const next = current.filter((b) => b.id !== id);
  mockDatabase.setCollection(DB_KEYS.bookmarks, next);
  return next;
}

function isBookmarked(routePath: string): boolean {
  return getBookmarks().some((b) => b.routePath === routePath);
}

// Saved Sentences CRUD
function getSavedSentences(): SavedSentence[] {
  return mockDatabase.getCollection<SavedSentence>(DB_KEYS.savedSentences);
}

async function addSavedSentence(sentence: string, meaning: string, source: string, routePath?: string): Promise<SavedSentence[]> {
  const current = getSavedSentences();
  if (current.some((s) => s.sentence.toLowerCase() === sentence.toLowerCase())) return current;

  const newItem: SavedSentence = {
    id: mockDatabase.uid("sen"),
    sentence: sentence.trim(),
    meaning: meaning.trim(),
    source,
    routePath,
    createdAt: mockDatabase.nowIso(),
  };

  const updated = mockDatabase.addToCollection<SavedSentence>(DB_KEYS.savedSentences, newItem);
  
  // Log event in history
  await historyService.addEntry({
    type: "SENTENCE_SAVED" as any,
    title: `Saved Sentence: "${sentence.slice(0, 30)}..."`,
    description: `Saved from ${source} for notebook revision.`,
    sourceType: "AI_NOTEBOOK",
    sourceId: routePath || "",
  });

  return updated;
}

function removeSavedSentence(id: string): SavedSentence[] {
  const current = getSavedSentences();
  const next = current.filter((s) => s.id !== id);
  mockDatabase.setCollection(DB_KEYS.savedSentences, next);
  return next;
}

function updateSavedSentence(id: string, updates: Partial<SavedSentence>): SavedSentence[] {
  const current = getSavedSentences();
  const next = current.map((s) => s.id === id ? { ...s, ...updates } : s);
  mockDatabase.setCollection(DB_KEYS.savedSentences, next);
  return next;
}

// Dynamic insights calculation
async function getInsights(): Promise<LearnerInsights> {
  const user = authService.getUser();
  const historyList = await historyService.list();
  const allMistakes = await mistakeService.getMistakes();
  const dailyProgress = await dailyLessonService.getProgress();
  const allNotes = await aiNotebookService.listNotes();
  const bookmarksList = getBookmarks();
  const savedSentencesList = getSavedSentences();
  const sectionSummary = await sectionProgressService.getSummary();
  const allDailyLessons = await dailyLessonService.listDailyLessons();

  // A. Streak calculations
  const uniqueDates = Array.from(
    new Set(historyList.map((h) => h.createdAt.slice(0, 10)))
  ).sort((a, b) => b.localeCompare(a));

  let currentStreak = 0;
  if (uniqueDates.length > 0) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)) {
      let checkDate = uniqueDates.includes(todayStr) ? new Date(todayStr) : new Date(yesterdayStr);
      while (true) {
        const checkStr = checkDate.toISOString().slice(0, 10);
        if (uniqueDates.includes(checkStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  let bestStreak = currentStreak;
  if (uniqueDates.length > 0) {
    const sortedDates = [...uniqueDates].sort().map((d) => new Date(d));
    let currentRun = 1;
    bestStreak = Math.max(bestStreak, 1);
    for (let i = 1; i < sortedDates.length; i++) {
      const diffTime = sortedDates[i].getTime() - sortedDates[i - 1].getTime();
      const diffDays = Math.round(diffTime / 86400000);
      if (diffDays === 1) {
        currentRun++;
        bestStreak = Math.max(bestStreak, currentRun);
      } else if (diffDays > 1) {
        currentRun = 1;
      }
    }
  }

  // B. Last Active Lesson/Section
  const lastLessonView = historyList.find(
    (h) => h.type === "DAILY_LESSON_VIEWED" || h.type === "LESSON_VIEWED"
  );
  const lastSectionView = historyList.find(
    (h) => h.type === "SECTION_VIEWED" || h.type === "LESSON_SECTION_VIEWED"
  );

  const lastLessonTitle = lastLessonView?.title.replace("Studied Lesson: ", "") || "";
  const lastLessonDay = lastLessonView?.dayNumber || 0;
  const lastSectionId = lastSectionView?.sourceId || "";
  const lastSectionTitle = lastSectionView?.title.replace("Section studied: ", "") || "";

  // C. Daily target minutes and today completed minutes
  const dailyGoalMinutes = user?.dailyGoalMinutes || 20;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayEntries = historyList.filter(
    (e) => new Date(e.createdAt).getTime() >= startOfToday.getTime()
  );

  let completedMinutesToday = 0;
  todayEntries.forEach((e) => {
    const typeStr = String(e.type);
    if (typeStr.includes("VIEWED")) completedMinutesToday += 5;
    else if (typeStr.includes("PRACTICED") || typeStr.includes("CHECKED")) completedMinutesToday += 3;
    else completedMinutesToday += 2;
  });
  if (completedMinutesToday === 0 && historyList.length > 0) {
    completedMinutesToday = 0;
  }
  const goalProgressPercent = Math.min(100, Math.round((completedMinutesToday / dailyGoalMinutes) * 100));

  // D. Level progress calculations
  const lessonsCompletedCount = Object.values(dailyProgress).filter((p) => p.completed).length;
  const sectionsCompletedCount = sectionSummary.completedSections;

  const totalWeight = 25;
  const score = lessonsCompletedCount * 2 + sectionsCompletedCount;
  const levelProgressPercent = Math.min(100, Math.round((score / totalWeight) * 100));
  const totalRoadmapProgressPercent = levelProgressPercent;

  const assessmentResult = mockDatabase.getCollection<any>(DB_KEYS.englishAssessmentResult as any)[0] || null;
  let calculatedLevel = "BEGINNER";
  if (assessmentResult) {
    calculatedLevel = assessmentResult.overallLevel.toUpperCase();
  } else if (levelProgressPercent > 75) {
    calculatedLevel = "ADVANCED";
  } else if (levelProgressPercent > 40) {
    calculatedLevel = "INTERMEDIATE";
  } else if (levelProgressPercent > 0) {
    calculatedLevel = "BASIC";
  }

  // E. Counts
  const writingChecksCount = historyList.filter((h) => 
    String(h.type).includes("WRITING") || 
    h.title?.toLowerCase().includes("writing")
  ).length;

  const speakingChecksCount = historyList.filter((h) => 
    String(h.type).includes("SPEAKING") || 
    h.title?.toLowerCase().includes("speaking")
  ).length;

  const notebookNotesCount = allNotes.length;
  const userImportsCount = allNotes.filter((n) => n.sourceType === "User Import").length;
  const savedSentencesCount = savedSentencesList.length;
  const bookmarksCount = bookmarksList.length;

  // F. Mistakes
  const mistakesCount = allMistakes.length;
  const reviewedMistakesCount = allMistakes.filter((m) => m.practicedCount > 0 || m.reviewedAt).length;
  const pendingMistakesCount = Math.max(0, mistakesCount - reviewedMistakesCount);

  const mistakesByCategories = {
    grammar: allMistakes.filter((m) => m.mistakeType === "grammar").length,
    vocabulary: allMistakes.filter((m) => m.mistakeType === "vocabulary").length,
    sentence: allMistakes.filter((m) => m.mistakeType === "sentence").length,
    other: allMistakes.filter((m) => m.mistakeType === "other").length,
  };

  // G. Revisions & Practices
  const reviewedMistakes = allMistakes.filter((m) => m.reviewedAt).length;
  const reviewedSentences = savedSentencesList.filter((s) => s.reviewedAt).length;
  const reviewedNotes = allNotes.filter((n) => n.reviewedAt).length;
  const revisionsCompletedCount = reviewedMistakes + reviewedSentences + reviewedNotes;
  const notebookReviewedCount = revisionsCompletedCount;

  const quizAttempts = mockDatabase.getCollection<any>(DB_KEYS.practiceAttempts);
  const practiceAttemptsCount = quizAttempts.length;
  const quizzesCount = practiceAttemptsCount;
  const avgQuizScore = quizzesCount > 0
    ? Math.round(quizAttempts.reduce((acc, q) => acc + q.score, 0) / quizzesCount)
    : 0;
  const latestQuizScore = quizAttempts.length > 0 ? quizAttempts[0].score : null;

  // H. Recommendations
  let nextRecommendedSectionId = "";
  let nextRecommendedSectionTitle = "";
  let nextRecommendedDayNumber: number | null = null;

  const sortedLessons = [...allDailyLessons].sort((a, b) => {
    const wA = a.weekNumber || 1;
    const wB = b.weekNumber || 1;
    if (wA !== wB) return wA - wB;
    return (a.dayNumber || 0) - (b.dayNumber || 0);
  });

  let foundRecommend = false;
  for (const lesson of sortedLessons) {
    if (lesson.dayNumber == null) continue;
    const sections = lessonService.splitIntoSections(lesson.rawContent, lesson.dayNumber);
    for (const sec of sections) {
      const secId = `${lesson.dayNumber}_${sec.heading.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
      const progress = await sectionProgressService.getProgress(secId, "DAILY_LESSON");
      if (!progress.completed) {
        nextRecommendedSectionId = secId;
        nextRecommendedSectionTitle = sec.heading;
        nextRecommendedDayNumber = lesson.dayNumber;
        foundRecommend = true;
        break;
      }
    }
    if (foundRecommend) break;
  }

  if (!foundRecommend && sortedLessons.length > 0) {
    nextRecommendedDayNumber = sortedLessons[0].dayNumber;
    const firstSections = lessonService.splitIntoSections(sortedLessons[0].rawContent, sortedLessons[0].dayNumber);
    if (firstSections.length > 0) {
      nextRecommendedSectionId = `${sortedLessons[0].dayNumber}_${firstSections[0].heading.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
      nextRecommendedSectionTitle = firstSections[0].heading;
    }
  }

  // I. Weekly summaries (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weeklyEntries = historyList.filter(
    (e) => new Date(e.createdAt).getTime() >= sevenDaysAgo.getTime()
  );

  const weeklyLessonsViewed = weeklyEntries.filter(
    (e) => e.type === "DAILY_LESSON_VIEWED" || e.type === "LESSON_VIEWED"
  ).length;

  const weeklyWritingChecks = weeklyEntries.filter(
    (e) => String(e.type).includes("WRITING") || e.title?.toLowerCase().includes("writing")
  ).length;

  const weeklySpeakingChecks = weeklyEntries.filter(
    (e) => String(e.type).includes("SPEAKING") || e.title?.toLowerCase().includes("speaking")
  ).length;

  const weeklyListeningChecks = weeklyEntries.filter(
    (e) => String(e.type).toLowerCase().includes("listening") || e.title?.toLowerCase().includes("listening")
  ).length;

  const weeklyNotesSaved = weeklyEntries.filter(
    (e) => String(e.type).includes("NOTE_SAVED") || String(e.type).includes("NOTEBOOK_ITEM_CREATED")
  ).length;

  const weeklyMistakesSaved = weeklyEntries.filter(
    (e) => e.type === "MISTAKE_SAVED"
  ).length;

  const weeklyMistakesReviewed = weeklyEntries.filter(
    (e) => e.type === "MISTAKE_REVIEWED"
  ).length;

  const weeklyNotebookNotesSaved = weeklyEntries.filter(
    (e) => String(e.type).includes("NOTEBOOK_ITEM_CREATED") || String(e.type).includes("NOTE_SAVED")
  ).length;

  const weeklyPracticeCompleted = weeklyEntries.filter(
    (e) => String(e.type).toLowerCase().includes("practice") || String(e.type).toLowerCase().includes("quiz")
  ).length;

  let weeklyMinutes = 0;
  weeklyEntries.forEach((e) => {
    const typeStr = String(e.type);
    if (typeStr.includes("VIEWED")) weeklyMinutes += 5;
    else if (typeStr.includes("PRACTICED") || typeStr.includes("CHECKED")) weeklyMinutes += 3;
    else weeklyMinutes += 2;
  });

  const recentWeakArea = user?.weakAreas && user.weakAreas.length > 0 ? user.weakAreas[0] : "Prepositions";

  // J. Mock AI suggestions
  let mockAiSuggestion = "";
  if (mistakesCount > reviewedMistakesCount) {
    mockAiSuggestion = `Mock AI suggests reviewing your ${mistakesCount - reviewedMistakesCount} pending grammar/spelling mistakes to improve accuracy.`;
  } else if (todayEntries.length === 0) {
    mockAiSuggestion = `Mock AI recommends starting today's English lesson Day ${(lessonsCompletedCount || 0) + 1} to keep up your streak.`;
  } else if (allNotes.length === 0) {
    mockAiSuggestion = `Mock AI recommends adding a custom text log to your AI Notebook to begin practice exercises.`;
  } else if (weeklySpeakingChecks < 2) {
    mockAiSuggestion = `Mock AI recommends starting a speaking checker session to audit pronunciation of new words.`;
  } else if (weeklyWritingChecks < 2) {
    mockAiSuggestion = `Mock AI recommends submitting a draft to the writing checker for real-time rule analysis.`;
  } else {
    mockAiSuggestion = `Mock AI suggests reviewing your bookmarked lessons to lock in today's knowledge.`;
  }

  // Daily tasks
  const dailyTasks = [
    {
      id: "task_lesson",
      title: nextRecommendedSectionTitle
        ? `Syllabus Plan: Study next section "${nextRecommendedSectionTitle}"`
        : "Syllabus Plan: Study today's recommended section",
      done: false,
      route: "/modules/english-course",
    },
    {
      id: "task_mistakes",
      title: pendingMistakesCount > 0
        ? `Mistake Coach: Practice ${pendingMistakesCount} pending mistakes`
        : "Mistake Coach: All mistakes reviewed! Keep it clean",
      done: pendingMistakesCount === 0,
      route: "/mistakes",
    },
    {
      id: "task_notebook",
      title: notebookNotesCount > 0
        ? `Notebook: Generate a smart revision quiz from your saved notes`
        : "Notebook: Log a personal text import to unlock workspace exercises",
      done: notebookNotesCount > 3,
      route: notebookNotesCount > 0 ? "/practice-center" : "/ai-notebook",
    }
  ];

  // Weak area scores
  const mistakeTypes = allMistakes.map(m => (m.mistakeType || "").toLowerCase());
  const grammarMistakesCount = mistakeTypes.filter(t => t.includes("grammar")).length;
  const vocabMistakesCount = mistakeTypes.filter(t => t.includes("vocab")).length;
  const pronunciationMistakesCount = mistakeTypes.filter(t => t.includes("pronun") || t.includes("speak")).length;
  const sentenceMistakesCount = mistakeTypes.filter(t => t.includes("sentence")).length;

  const weakAreaScores = {
    Grammar: Math.max(30, Math.min(100, 80 - grammarMistakesCount * 12 + lessonsCompletedCount * 4)),
    Speaking: Math.max(30, Math.min(100, 75 - pronunciationMistakesCount * 10 + speakingChecksCount * 8)),
    Writing: Math.max(30, Math.min(100, 70 + writingChecksCount * 8 - (allMistakes.filter(m => (m.sourceType || "").includes("WRITING")).length * 10))),
    Vocabulary: Math.max(30, Math.min(100, 65 + notebookNotesCount * 6 - vocabMistakesCount * 10)),
    Pronunciation: Math.max(30, Math.min(100, 80 - pronunciationMistakesCount * 15 + speakingChecksCount * 5)),
    "Sentence Making": Math.max(30, Math.min(100, 60 + savedSentencesCount * 8 - sentenceMistakesCount * 10)),
  };

  // Activity heatmap
  const activityHeatmap: Record<string, string[]> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayEntries = historyList.filter(h => h.createdAt.slice(0, 10) === dateStr);
    const activities = dayEntries.map(e => {
      const typeStr = String(e.type);
      if (typeStr.includes("LESSON") || typeStr.includes("SECTION")) return "lesson";
      if (typeStr.includes("WRITING")) return "writing";
      if (typeStr.includes("SPEAKING")) return "speaking";
      if (typeStr.includes("MISTAKE")) return "mistake";
      if (typeStr.includes("NOTEBOOK") || typeStr.includes("IMPORT")) return "notebook";
      return "practice";
    });
    activityHeatmap[dateStr] = Array.from(new Set(activities));
  }

  return {
    currentStreak,
    bestStreak,
    lastActiveDate: historyList[0]
      ? new Date(historyList[0].createdAt).toLocaleDateString()
      : "No activity yet",
    lastLessonTitle,
    lastLessonDay,
    lastSectionId,
    lastSectionTitle,
    nextRecommendedDayNumber,
    nextRecommendedSectionId,
    nextRecommendedSectionTitle,
    dailyGoalMinutes,
    completedMinutesToday,
    goalProgressPercent,
    lessonsCompletedCount,
    sectionsCompletedCount,
    totalRoadmapProgressPercent,
    writingChecksCount,
    speakingChecksCount,
    notebookNotesCount,
    userImportsCount,
    savedSentencesCount,
    bookmarksCount,
    recentBookmarks: bookmarksList.slice(0, 5),
    notebookReviewedCount,
    mistakesCount,
    reviewedMistakesCount,
    pendingMistakesCount,
    mistakesByCategories,
    revisionsCompletedCount,
    practiceAttemptsCount,
    quizzesCount,
    avgQuizScore,
    latestQuizScore,
    levelProgressPercent,
    calculatedLevel,
    mockAiSuggestion,
    weeklyReport: {
      lessonsViewed: weeklyLessonsViewed,
      writingChecks: weeklyWritingChecks,
      speakingChecks: weeklySpeakingChecks,
      listeningChecks: weeklyListeningChecks,
      notesSaved: weeklyNotesSaved,
      mistakesSaved: weeklyMistakesSaved,
      mistakesReviewed: weeklyMistakesReviewed,
      notebookNotesSaved: weeklyNotebookNotesSaved,
      practiceCompleted: weeklyPracticeCompleted,
      studyMinutes: weeklyMinutes,
      strongestArea: assessmentResult
        ? (() => {
            const sorted = Object.entries(assessmentResult.scores).sort((a: any, b: any) => b[1] - a[1]);
            return sorted[0][0].charAt(0).toUpperCase() + sorted[0][0].slice(1);
          })()
        : (levelProgressPercent > 40 ? "Grammar Structure" : "Vocabulary Acquisition"),
      weakArea: assessmentResult && assessmentResult.weakAreas.length > 0
        ? assessmentResult.weakAreas[0]
        : recentWeakArea,
      nextWeekFocus: (() => {
        const wArea = assessmentResult && assessmentResult.weakAreas.length > 0
          ? assessmentResult.weakAreas[0]
          : recentWeakArea;
        if (wArea.toLowerCase() === "speaking") {
          return "Focus on speaking 3 answers daily in the Speaking Practice module.";
        } else if (wArea.toLowerCase() === "grammar") {
          return "Focus on grammar exercises and subject-verb agreement lessons.";
        } else if (wArea.toLowerCase() === "vocabulary") {
          return "Save 5 new vocabulary terms to your Notebook and complete quizzes.";
        } else if (wArea.toLowerCase() === "writing") {
          return "Draft 2 entries in your AI Notebook and review the spelling corrections.";
        } else if (wArea.toLowerCase() === "listening") {
          return "Perform listening audio dictations daily to improve phonetic accuracy.";
        }
        return "Focus on speaking practice to improve daily fluency.";
      })(),
    },
    dailyTasks,
    weakAreaScores,
    activityHeatmap,
  };
}

export const learnerInsightsService = {
  getBookmarks,
  addBookmark,
  removeBookmark,
  isBookmarked,
  getSavedSentences,
  addSavedSentence,
  removeSavedSentence,
  updateSavedSentence,
  getInsights,
};

export default learnerInsightsService;
