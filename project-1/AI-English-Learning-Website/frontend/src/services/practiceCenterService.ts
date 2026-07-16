import mockDatabase, { DB_KEYS } from "./mockDatabase";
import dailyLessonService from "./dailyLessonService";
import { aiNotebookService } from "./aiNotebookService";
import learnerInsightsService from "./learnerInsightsService";
import mistakeService from "./mistakeService";
import historyService from "./historyService";
import type {
  QuizQuestion,
  QuizAttempt,
  QuizAnswerInput,
  WritingCheckResult,
  SpeakingCheckResult,
} from "../types/practiceCenter.types";

const DEFAULT_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "quiz_default_1",
    type: "choice",
    question: "Choose the correct preposition: 'I live ___ London.'",
    choices: ["in", "on", "at", "to"],
    correctAnswer: "in",
    simpleRule: "Use 'in' for cities, countries, and large regions.",
    source: "Default Bank"
  },
  {
    id: "quiz_default_2",
    type: "blank",
    question: "Fill in the blank: She ____ (read / reads) a book every evening.",
    correctAnswer: "reads",
    simpleRule: "Use third-person singular 's' for he/she/it.",
    source: "Default Bank"
  },
  {
    id: "quiz_default_3",
    type: "correct",
    question: "Correct the sentence: 'They is playing football.'",
    correctAnswer: "They are playing football",
    simpleRule: "Use 'are' with third-person plural pronoun 'They'.",
    source: "Default Bank"
  },
  {
    id: "quiz_default_4",
    type: "make",
    question: "Make a sentence using the word: 'improve'",
    correctAnswer: "improve",
    simpleRule: "Write a short sentence about improving your English.",
    source: "Default Bank",
    sampleAnswer: "I want to improve my English."
  },
  {
    id: "quiz_default_5",
    type: "short",
    question: "Answer in your own words: What did you do yesterday?",
    correctAnswer: "yesterday",
    simpleRule: "Use past tense verbs like 'went', 'did', 'played', etc.",
    source: "Default Bank",
    sampleAnswer: "Yesterday I studied English and walked in the park."
  },
  {
    id: "quiz_default_6",
    type: "speaking",
    question: "Read and type this sentence: 'Continuous practice makes us fluent.'",
    correctAnswer: "Continuous practice makes us fluent",
    simpleRule: "Focus on standard punctuation and spelling.",
    source: "Default Bank"
  }
];

// Helper to extract keywords from sentences
function extractKeyword(sentence: string): string {
  const clean = sentence.replace(/[^a-zA-Z\s]/g, " ").trim();
  const words = clean.split(/\s+/).filter(w => w.length > 5);
  return words.length > 0 ? words[Math.floor(Math.random() * words.length)] : "English";
}

async function generateDailyQuiz(): Promise<QuizQuestion[]> {
  const quiz: QuizQuestion[] = [];
  const mistakes = await mistakeService.getMistakes();
  const notebookItems = await aiNotebookService.listNotes();
  const savedSentences = learnerInsightsService.getSavedSentences();
  const lessons = await dailyLessonService.listDailyLessons();

  // 1. Add mistake revision if mistakes exist
  if (mistakes.length > 0) {
    const mk = mistakes[Math.floor(Math.random() * mistakes.length)];
    quiz.push({
      id: `quiz_mistake_${mk.id}`,
      type: "correct",
      question: `Correct this sentence: "${mk.wrongSentence}"`,
      correctAnswer: mk.correctSentence,
      simpleRule: mk.simpleRule || "Fix spelling and match correct grammar rules.",
      source: "Mistakes"
    });
  }

  // 2. Add saved sentence practice
  if (savedSentences.length > 0) {
    const sen = savedSentences[Math.floor(Math.random() * savedSentences.length)];
    const typeRand = Math.random() > 0.5 ? "speaking" : "blank";
    
    if (typeRand === "speaking") {
      quiz.push({
        id: `quiz_sentence_sp_${sen.id}`,
        type: "speaking",
        question: `Read and type this sentence: "${sen.sentence}"`,
        correctAnswer: sen.sentence,
        simpleRule: sen.meaning ? `Meaning: "${sen.meaning}"` : "Practise speaking clearly.",
        source: "Saved Sentences"
      });
    } else {
      // blank fill
      const words = sen.sentence.split(/\s+/);
      if (words.length > 3) {
        const replaceIdx = Math.floor(Math.random() * (words.length - 2)) + 1;
        const targetWord = words[replaceIdx].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        words[replaceIdx] = "____";
        
        quiz.push({
          id: `quiz_sentence_bl_${sen.id}`,
          type: "blank",
          question: `Fill in the blank: "${words.join(" ")}"`,
          correctAnswer: targetWord,
          simpleRule: `Complete the sentence: "${sen.sentence}"`,
          source: "Saved Sentences"
        });
      }
    }
  }

  // 3. Add User Import vocabulary check
  const userImports = notebookItems.filter(n => n.sourceType === "User Import" || n.tags?.includes("User Import"));
  if (userImports.length > 0) {
    const note = userImports[Math.floor(Math.random() * userImports.length)];
    const contentText = note.originalContent || note.title || "";
    if (contentText.length > 5) {
      const keyword = extractKeyword(contentText);
      quiz.push({
        id: `quiz_import_make_${note.id}`,
        type: "make",
        question: `Make a sentence using the word from your imports: "${keyword}"`,
        correctAnswer: keyword,
        simpleRule: "Create a simple, grammatically correct sentence using the keyword.",
        source: "User Import",
        sampleAnswer: `I always practice with new words like "${keyword}".`
      });
    }
  }

  // 4. Add Daily Lesson comprehension/fill-blank
  if (lessons.length > 0) {
    const lesson = lessons[Math.floor(Math.random() * lessons.length)];
    const cleanTopic = lesson.title.split(/[—-]/).pop()?.trim() || lesson.title;
    
    quiz.push({
      id: `quiz_lesson_short_${lesson.id}`,
      type: "short",
      question: `In your own words: what did you learn in the lesson "${cleanTopic}"?`,
      correctAnswer: "English",
      simpleRule: "Answer using at least one complete sentence.",
      source: `Daily Lesson: ${cleanTopic}`,
      sampleAnswer: `I studied vocabulary and grammar in ${cleanTopic}.`
    });
  }

  // Fill up the rest with default questions until we have at least 5 questions
  let defaultIdx = 0;
  while (quiz.length < 5 && defaultIdx < DEFAULT_QUIZ_QUESTIONS.length) {
    const defQ = DEFAULT_QUIZ_QUESTIONS[defaultIdx];
    if (!quiz.some(q => q.id === defQ.id)) {
      quiz.push(defQ);
    }
    defaultIdx++;
  }

  return quiz;
}

async function checkAnswer(question: QuizQuestion, userAnswer: string): Promise<{ isCorrect: boolean; score: number; simpleRule: string; correctAnswer: string }> {
  const ans = userAnswer.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  const correctAns = question.correctAnswer.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

  if (question.type === "choice") {
    const matches = ans === correctAns;
    return {
      isCorrect: matches,
      score: matches ? 100 : 0,
      simpleRule: question.simpleRule,
      correctAnswer: question.correctAnswer,
    };
  }

  if (question.type === "blank" || question.type === "correct" || question.type === "speaking") {
    // String matching
    const score = ans === correctAns ? 100 : (correctAns.includes(ans) && ans.length > 2 ? 60 : 0);
    return {
      isCorrect: score >= 90,
      score,
      simpleRule: question.simpleRule,
      correctAnswer: question.correctAnswer,
    };
  }

  if (question.type === "make") {
    // Check if user answer contains target word
    const keyword = correctAns;
    const containsKeyword = ans.includes(keyword);
    const wordsCount = userAnswer.trim().split(/\s+/).filter(Boolean).length;
    
    if (containsKeyword && wordsCount >= 3) {
      return {
        isCorrect: true,
        score: 100,
        simpleRule: "Excellent! Your sentence contains the keyword and is long enough.",
        correctAnswer: question.sampleAnswer || `A sentence containing: ${question.correctAnswer}`,
      };
    }
    
    return {
      isCorrect: false,
      score: containsKeyword ? 40 : 0,
      simpleRule: "Please write a sentence at least 3 words long containing the keyword.",
      correctAnswer: question.sampleAnswer || `A sentence containing: ${question.correctAnswer}`,
    };
  }

  // Short answer
  const count = userAnswer.trim().split(/\s+/).filter(Boolean).length;
  if (count >= 4) {
    return {
      isCorrect: true,
      score: 100,
      simpleRule: "Thank you for sharing your thoughts! Review your spelling and grammar.",
      correctAnswer: question.sampleAnswer || "Any short answer explaining your study content.",
    };
  }

  return {
    isCorrect: false,
    score: count > 0 ? 40 : 0,
    simpleRule: "Please write a fuller answer (at least 4 words).",
    correctAnswer: question.sampleAnswer || "Any short answer explaining your study content.",
  };
}

async function saveQuizAttempt(score: number, totalQuestions: number, correctAnswers: number, answers: QuizAnswerInput[]): Promise<QuizAttempt> {
  const attempt: QuizAttempt = {
    id: mockDatabase.uid("qa"),
    score,
    totalQuestions,
    correctAnswers,
    answers,
    createdAt: mockDatabase.nowIso(),
  };

  mockDatabase.addToCollection<QuizAttempt>(DB_KEYS.practiceAttempts, attempt);

  // Save to history log
  await historyService.addEntry({
    type: "PRACTICE_CENTER_QUIZ_COMPLETED" as any,
    title: `Completed Daily Quiz`,
    description: `Scored ${score}% (${correctAnswers}/${totalQuestions} correct answers).`,
    sourceType: "DAILY_QUIZ" as any,
    sourceId: attempt.id,
  });

  return attempt;
}

async function getQuizAttempts(): Promise<QuizAttempt[]> {
  return mockDatabase.getCollection<QuizAttempt>(DB_KEYS.practiceAttempts);
}

// Check Writing draft using Rule-based mock AI
async function evaluateWriting(text: string, target?: string): Promise<WritingCheckResult> {
  const input = text.trim();
  const cleanInput = input.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

  const hints: string[] = [];
  let score = 90;

  if (input.length === 0) {
    return {
      score: 0,
      betterSentence: "",
      hints: ["Please write something first."],
      simpleRule: "Start typing to receive feedback.",
    };
  }

  if (!/^[A-Z]/.test(input)) {
    hints.push("Start your sentence with a capital letter.");
    score -= 10;
  }

  if (!/[.!?]$/.test(input)) {
    hints.push("End your sentence with proper punctuation (period, question mark, or exclamation mark).");
    score -= 10;
  }

  const wordCount = input.split(/\s+/).filter(Boolean).length;
  if (wordCount < 4) {
    hints.push("Try to write a slightly longer sentence for richer context.");
    score -= 10;
  }

  // Lone "i"
  if (/\bi\b/.test(input)) {
    hints.push('Capitalize the letter "I" when talking about yourself.');
    score -= 15;
  }

  // Generate suggested text
  let betterSentence = input;
  betterSentence = betterSentence.charAt(0).toUpperCase() + betterSentence.slice(1);
  betterSentence = betterSentence.replace(/\bi\b/g, "I");
  if (!/[.!?]$/.test(betterSentence)) {
    betterSentence += ".";
  }

  // Save mistake if score is low
  if (score < 80) {
    await mistakeService.saveMistake({
      sourceType: "WRITING",
      sourceTitle: "Practice Center Writing",
      wrongSentence: text,
      correctSentence: target || betterSentence,
      simpleRule: hints[0] || "Follow standard grammar patterns.",
      mistakeType: "grammar",
    });
  }

  // Log in history
  await historyService.addEntry({
    type: "PRACTICE_CENTER_WRITING_CHECKED" as any,
    title: "AI Writing Check",
    description: `Analyzed paragraph check. Score: ${score}%.`,
    sourceType: "PRACTICE_CENTER",
    sourceId: "writing_check",
  });

  return {
    score: Math.max(0, score),
    betterSentence,
    hints,
    simpleRule: "Mock AI evaluated your grammar, capitalization, and punctuation.",
  };
}

async function evaluateSpeaking(spokenText: string, targetText: string): Promise<SpeakingCheckResult> {
  const targetWords = targetText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/).filter(Boolean);
  const spokenWords = spokenText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/).filter(Boolean);

  const missingWords = targetWords.filter(w => !spokenWords.includes(w));
  const extraWords = spokenWords.filter(w => !targetWords.includes(w));
  const wordsToRepeat = spokenWords.filter(w => targetWords.includes(w) && spokenWords.indexOf(w) !== spokenWords.lastIndexOf(w));

  let matches = 0;
  targetWords.forEach(w => {
    if (spokenWords.includes(w)) {
      matches++;
    }
  });

  const score = targetWords.length > 0 ? Math.round((matches / targetWords.length) * 100) : 100;

  // Log in history
  await historyService.addEntry({
    type: "PRACTICE_CENTER_SPEAKING_PRACTICED" as any,
    title: "AI Speaking Check",
    description: `Practiced pronunciation of: "${targetText.slice(0, 30)}...". Match score: ${score}%.`,
    sourceType: "PRACTICE_CENTER",
    sourceId: "speaking_check",
  });

  return {
    score,
    missingWords,
    extraWords,
    wordsToRepeat,
    recommendedLine: `Focus on speaking clearly: "${targetText}"`,
  };
}

export const practiceCenterService = {
  generateDailyQuiz,
  checkAnswer,
  saveQuizAttempt,
  getQuizAttempts,
  evaluateWriting,
  evaluateSpeaking,
};

export default practiceCenterService;
