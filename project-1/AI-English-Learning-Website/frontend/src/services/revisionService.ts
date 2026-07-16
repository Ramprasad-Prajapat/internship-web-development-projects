import mistakeService from "./mistakeService";
import aiNotebookService from "./aiNotebookService";
import historyService from "./historyService";
import sectionProgressService from "./sectionProgressService";
import type {
  WeakArea,
  WeakAreaKey,
  RevisionTask,
  RevisionPracticeQuestion,
  RevisionPracticeResult,
} from "../types/revision.types";

const KEYS = {
  tasks: "eng_revision_tasks",
  attempts: "eng_revision_attempts", // array of { timestamp: string, correct: boolean }
} as const;

function readLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

/** Detect weak areas dynamically from mistakes, notebook vocabulary, and incomplete sections */
async function detectWeakAreas(): Promise<WeakArea[]> {
  const mistakes = await mistakeService.getMistakes();
  const notes = await aiNotebookService.listNotes();
  
  // Read section progress from local storage
  let sectionProgressList: any[] = [];
  try {
    const rawSec = localStorage.getItem("eng_section_progress");
    sectionProgressList = rawSec ? JSON.parse(rawSec) : [];
  } catch {}

  const areas: WeakArea[] = [];

  // 1. Grammar
  const grammarMistakes = mistakes.filter(m => m.mistakeType === "grammar" || m.wrongSentence.toLowerCase().includes("rule"));
  const grammarNotes = notes.filter(n => (n.tags || []).includes("grammar") || (n.tags || []).includes("past-perfect"));
  const incompleteGrammarSections = sectionProgressList.filter(p => !p.completed && p.sourceId.includes("grammar"));
  const grammarReasons: string[] = [];
  if (grammarMistakes.length > 0) grammarReasons.push(`You have ${grammarMistakes.length} unresolved grammar mistakes.`);
  if (incompleteGrammarSections.length > 0) grammarReasons.push(`You have ${incompleteGrammarSections.length} incomplete grammar sections.`);
  if (grammarNotes.length > 0) grammarReasons.push(`You have study notes about grammar saved in your notebook.`);

  if (grammarReasons.length > 0) {
    areas.push({
      key: "grammar",
      label: "Grammar & Structure",
      count: grammarMistakes.length + incompleteGrammarSections.length || 1,
      description: "Needs practice with subject-verb agreement, tense usages, and auxiliary structures.",
      reasons: grammarReasons,
    });
  }

  // 2. Prepositions
  const prepMistakes = mistakes.filter(m => m.sourceType === "PREPOSITION");
  const prepNotes = notes.filter(n => (n.tags || []).includes("prepositions") || n.sourceType === "Preposition");
  const incompletePrepSections = sectionProgressList.filter(p => !p.completed && p.sourceType === "PREPOSITION");
  const prepReasons: string[] = [];
  if (prepMistakes.length > 0) prepReasons.push(`You made ${prepMistakes.length} errors in Preposition practices.`);
  if (incompletePrepSections.length > 0) prepReasons.push(`You have ${incompletePrepSections.length} unfinished preposition sub-sections.`);
  if (prepNotes.length > 0) prepReasons.push(`You have preposition study cards in your notebook.`);

  if (prepReasons.length > 0) {
    areas.push({
      key: "prepositions",
      label: "Prepositions",
      count: prepMistakes.length + incompletePrepSections.length || 1,
      description: "Weakness detected in using spatial/temporal prepositions like IN, ON, AT, BY.",
      reasons: prepReasons,
    });
  }

  // 3. Vocabulary
  let weakVocabCount = 0;
  notes.forEach(n => {
    n.savedVocabulary?.forEach(v => {
      if (v.status === "need-practice") {
        weakVocabCount++;
      }
    });
  });
  const vocabMistakes = mistakes.filter(m => m.mistakeType === "vocabulary");
  const vocabReasons: string[] = [];
  if (weakVocabCount > 0) vocabReasons.push(`You have ${weakVocabCount} vocabulary words flagged for revision in your AI Notebook.`);
  if (vocabMistakes.length > 0) vocabReasons.push(`You registered ${vocabMistakes.length} mistakes due to incorrect vocabulary usage.`);

  if (vocabReasons.length > 0) {
    areas.push({
      key: "vocabulary",
      label: "Vocabulary",
      count: weakVocabCount + vocabMistakes.length,
      description: "Review meanings, spelling, and contextual usage of saved vocabulary words.",
      reasons: vocabReasons,
    });
  }

  // 4. Writing
  const writingMistakes = mistakes.filter(m => m.sourceType === "WRITING");
  const writingNotes = notes.filter(n => n.sourceType === "Writing" || n.writingDraft);
  const writingReasons: string[] = [];
  if (writingMistakes.length > 0) writingReasons.push(`You have ${writingMistakes.length} writing draft mistakes.`);
  if (writingNotes.length > 0) writingReasons.push(`You have saved ${writingNotes.length} custom writing drafts in your notebook.`);

  if (writingReasons.length > 0) {
    areas.push({
      key: "writing",
      label: "Writing",
      count: writingMistakes.length || 1,
      description: "Guided composition prompts to correct writing errors and build sentence structures.",
      reasons: writingReasons,
    });
  }

  // 5. Speaking & Pronunciation
  const speakingMistakes = mistakes.filter(m => m.sourceType === "SPEAKING");
  const speakingNotes = notes.filter(n => n.sourceType === "Speaking" || n.speakingTranscript);
  const speakingReasons: string[] = [];
  if (speakingMistakes.length > 0) speakingReasons.push(`You have ${speakingMistakes.length} recorded speaking mistakes.`);
  if (speakingNotes.length > 0) speakingReasons.push(`You have saved speaking transcripts in your notebook.`);

  if (speakingReasons.length > 0) {
    areas.push({
      key: "speaking",
      label: "Speaking & Fluency",
      count: speakingMistakes.length || 1,
      description: "Fluency drills, transcription reviews, and mock AI oral correction exercises.",
      reasons: speakingReasons,
    });
    areas.push({
      key: "pronunciation",
      label: "Pronunciation & Phonetics",
      count: speakingMistakes.length || 1,
      description: "Phonetic accuracy practice repeating key lesson lines.",
      reasons: speakingReasons,
    });
  }

  // 6. Reading
  const readingNotes = notes.filter(n => n.sourceType === "Reading");
  if (readingNotes.length > 0) {
    areas.push({
      key: "reading",
      label: "Reading Comprehension",
      count: readingNotes.length,
      description: "Reading checks, vocabulary scans, and sentence syntax drills.",
      reasons: [`You have ${readingNotes.length} reading materials saved to study.`],
    });
  }

  // 7. Questions
  const notesWithQuestions = notes.filter(n => n.generatedQuestions && n.generatedQuestions.length > 0);
  if (notesWithQuestions.length > 0) {
    areas.push({
      key: "questions",
      label: "Notebook Quiz Drills",
      count: notesWithQuestions.length,
      description: "Practicing generated fill-in-the-blank and true/false questions from your AI Notebook.",
      reasons: [`You have generated quizzes waiting inside ${notesWithQuestions.length} notebook items.`],
    });
  }

  return areas;
}

/** Get overall stats for Revision dashboard */
async function getRevisionStats() {
  const weakAreas = await detectWeakAreas();
  const mistakes = await mistakeService.getMistakes();
  const tasks = getRevisionTasks();
  
  const completedToday = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.filter(t => !t.completed && !t.skipped).length;

  const attempts = readLocalStorage<{ timestamp: string; correct: boolean }[]>(KEYS.attempts, []);
  let accuracy = 100;
  if (attempts.length > 0) {
    const correctCount = attempts.filter(a => a.correct).length;
    accuracy = Math.round((correctCount / attempts.length) * 100);
  }

  return {
    weakAreasCount: weakAreas.length,
    mistakesCount: mistakes.filter(m => m.practicedCount === 0).length,
    tasksCount: pendingCount,
    completedToday,
    accuracy,
  };
}

/** Get list of generated tasks in revision queue */
function getRevisionTasks(): RevisionTask[] {
  return readLocalStorage<RevisionTask[]>(KEYS.tasks, []);
}

/** Generate custom revision plan with Mock AI */
async function generateRevisionPlan(): Promise<RevisionTask[]> {
  const mistakes = await mistakeService.getMistakes();
  const notes = await aiNotebookService.listNotes();
  const tasks: RevisionTask[] = [];

  // Task 1: Mistakes repeat
  const pendingMistakes = mistakes.filter(m => m.practicedCount === 0);
  if (pendingMistakes.length > 0) {
    tasks.push({
      id: "rev_t_mistakes",
      title: `Revise ${Math.min(3, pendingMistakes.length)} saved mistakes`,
      module: "Mistakes",
      reason: `You have ${pendingMistakes.length} mistakes waiting for practice. Repeat wrong sentences.`,
      timeEstimate: "5 mins",
      route: "/mistakes",
      completed: false,
      skipped: false,
    });
  }

  // Task 2: Preposition Choice
  const prepMistakes = mistakes.filter(m => m.sourceType === "PREPOSITION");
  tasks.push({
    id: "rev_t_preposition",
    title: "Practice IN / ON / AT preposition choice",
    module: "Prepositions",
    reason: prepMistakes.length > 0 
      ? `Correct preposition errors logged in your practice.`
      : "Strengthen preposition usage rules for places and times.",
    timeEstimate: "4 mins",
    route: "/prepositions",
    completed: false,
    skipped: false,
  });

  // Task 3: Speaking repetition
  tasks.push({
    id: "rev_t_speaking",
    title: "Repeat speaking sentences 5 times",
    module: "Practice",
    reason: "Log spoken text and check pronunciation accuracy with Mock AI.",
    timeEstimate: "5 mins",
    route: "/modules/english-course",
    completed: false,
    skipped: false,
  });

  // Task 4: Grammar writing practice
  tasks.push({
    id: "rev_t_writing",
    title: "Write 3 examples for 'There is / There are'",
    module: "Daily Lessons",
    reason: "Cement sentence building rules from Day 5 Daily Lesson.",
    timeEstimate: "6 mins",
    route: "/daily-lessons/day/5",
    completed: false,
    skipped: false,
  });

  // Task 5: AI Notebook review
  if (notes.length > 0) {
    const randomNote = notes[Math.floor(Math.random() * notes.length)];
    tasks.push({
      id: "rev_t_notebook",
      title: `Review note: "${randomNote.title}"`,
      module: "AI Notebook",
      reason: "Spaced repetition of your custom saved study summaries.",
      timeEstimate: "3 mins",
      route: "/ai-notebook",
      completed: false,
      skipped: false,
    });
  }

  writeLocalStorage(KEYS.tasks, tasks);

  // Log to history
  await historyService.addEntry({
    type: "REVISION_PLAN_GENERATED",
    title: "Smart Revision Plan generated",
    description: `Generated ${tasks.length} targeted revision exercises for today.`,
    sourceType: "REVISION",
    sourceId: "daily_plan",
  });

  return tasks;
}

async function markTaskCompleted(id: string): Promise<RevisionTask[]> {
  const tasks = getRevisionTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index >= 0) {
    tasks[index].completed = true;
    writeLocalStorage(KEYS.tasks, tasks);

    await historyService.addEntry({
      type: "REVISION_TASK_COMPLETED",
      title: `Revision task completed`,
      description: `Completed task: "${tasks[index].title}".`,
      sourceType: "REVISION",
      sourceId: id,
    });
  }
  return tasks;
}

function skipTask(id: string): RevisionTask[] {
  const tasks = getRevisionTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index >= 0) {
    tasks[index].skipped = true;
    writeLocalStorage(KEYS.tasks, tasks);
  }
  return tasks;
}

/** Generate target practice questions for a selected Weak Area */
async function getPracticeQuestions(weakAreaKey: WeakAreaKey): Promise<RevisionPracticeQuestion[]> {
  const mistakes = await mistakeService.getMistakes();
  const notes = await aiNotebookService.listNotes();

  const questions: RevisionPracticeQuestion[] = [];

  if (weakAreaKey === "grammar" || weakAreaKey === "writing") {
    // Look for grammar mistakes
    const list = mistakes.filter(m => m.mistakeType === "grammar" || m.sourceType === "WRITING");
    if (list.length > 0) {
      list.slice(0, 2).forEach((m, idx) => {
        questions.push({
          id: `rev_q_grammar_${m.id}_${idx}`,
          weakAreaKey,
          practiceType: "correct_sentence",
          prompt: `Correct this sentence: "${m.wrongSentence}"`,
          contextText: `Error category: ${m.mistakeType}. Rule explanation: ${m.simpleRule}`,
          correctAnswer: m.correctSentence,
          ruleExplanation: m.simpleRule,
          relatedMistakeId: m.id,
        });
      });
    } else {
      // Fallback
      questions.push({
        id: "rev_q_grammar_fb1",
        weakAreaKey,
        practiceType: "correct_sentence",
        prompt: `Correct this sentence: "She do not likes tea."`,
        contextText: "Hint: Pay attention to subject-verb agreement with singular 'She' and auxiliary 'do'.",
        correctAnswer: "She does not like tea.",
        ruleExplanation: "Use 'does not' + base verb (like) for third-person singular (he/she/it) present negative.",
      });
      questions.push({
        id: "rev_q_grammar_fb2",
        weakAreaKey,
        practiceType: "fill_blank",
        prompt: "Complete the sentence: 'We ___ (go) to the zoo yesterday.'",
        contextText: "Hint: The sentence references past time 'yesterday'.",
        correctAnswer: "went",
        ruleExplanation: "Yesterday indicates past simple tense. The past form of the irregular verb 'go' is 'went'.",
      });
    }
  } else if (weakAreaKey === "prepositions") {
    const list = mistakes.filter(m => m.sourceType === "PREPOSITION");
    if (list.length > 0) {
      list.slice(0, 2).forEach((m, idx) => {
        const matchResult = m.correctSentence.match(/in|on|at|to|from/i);
        const correctPrep = matchResult && matchResult[0] ? matchResult[0] : "at";
        questions.push({
          id: `rev_q_prep_${m.id}_${idx}`,
          weakAreaKey,
          practiceType: "preposition_choice",
          prompt: `Fill in the preposition: "${m.wrongSentence.replace(/in|on|at|to|from/gi, "___")}"`,
          contextText: `Rule: ${m.simpleRule}`,
          options: ["in", "on", "at", "to", "from"],
          correctAnswer: correctPrep,
          ruleExplanation: m.simpleRule,
          relatedMistakeId: m.id,
        });
      });
    } else {
      questions.push({
        id: "rev_q_prep_fb1",
        weakAreaKey,
        practiceType: "preposition_choice",
        prompt: "Choose the correct preposition: 'The keys are ___ the table.'",
        contextText: "The table represents a flat surface.",
        options: ["in", "on", "at", "under"],
        correctAnswer: "on",
        ruleExplanation: "We use 'on' for flat surfaces (e.g., table, wall, floor).",
      });
      questions.push({
        id: "rev_q_prep_fb2",
        weakAreaKey,
        practiceType: "preposition_choice",
        prompt: "Choose the correct preposition: 'I am waiting ___ the bus stop.'",
        contextText: "The bus stop is a specific location point.",
        options: ["in", "on", "at", "to"],
        correctAnswer: "at",
        ruleExplanation: "We use 'at' for specific points in space (e.g., bus stop, corner, entrance).",
      });
    }
  } else if (weakAreaKey === "vocabulary") {
    // Find vocabulary words in AI Notebook
    const words: { word: string; meaning: string; example: string }[] = [];
    notes.forEach(n => {
      n.savedVocabulary?.forEach(v => {
        if (v.status === "need-practice") {
          words.push({ word: v.word, meaning: v.meaning, example: v.example });
        }
      });
    });

    if (words.length > 0) {
      words.slice(0, 2).forEach((w, idx) => {
        questions.push({
          id: `rev_q_vocab_${w.word}_${idx}`,
          weakAreaKey,
          practiceType: "vocabulary_recall",
          prompt: `What is the word that matches the meaning: "${w.meaning}"?`,
          contextText: `Example: "${w.example.replace(w.word, "___")}"`,
          correctAnswer: w.word,
          ruleExplanation: `Word: ${w.word}. Example: ${w.example}`,
        });
      });
    } else {
      questions.push({
        id: "rev_q_vocab_fb1",
        weakAreaKey,
        practiceType: "vocabulary_recall",
        prompt: "What word means: 'to continue in a course of action even in the face of difficulty'?",
        contextText: "Example: 'She ___ through the cold weather.'",
        correctAnswer: "persevered",
        ruleExplanation: "Persevere means to keep going despite hardships or obstacles.",
      });
    }
  } else if (weakAreaKey === "speaking" || weakAreaKey === "pronunciation") {
    const list = mistakes.filter(m => m.sourceType === "SPEAKING");
    if (list.length > 0) {
      list.slice(0, 2).forEach((m, idx) => {
        questions.push({
          id: `rev_q_speaking_${m.id}_${idx}`,
          weakAreaKey,
          practiceType: "speaking_repeat",
          prompt: `Read aloud: "${m.correctSentence}"`,
          contextText: `Correction reference for: "${m.wrongSentence}"`,
          correctAnswer: m.correctSentence,
          ruleExplanation: m.simpleRule,
          relatedMistakeId: m.id,
        });
      });
    } else {
      questions.push({
        id: "rev_q_speak_fb1",
        weakAreaKey,
        practiceType: "speaking_repeat",
        prompt: "Read aloud: 'The path was steep and covered with gravel.'",
        contextText: "Focus on clean pronunciation and pacing.",
        correctAnswer: "The path was steep and covered with gravel.",
        ruleExplanation: "Practice clarity and rhythm when speaking longer sentences.",
      });
    }
  } else if (weakAreaKey === "reading") {
    questions.push({
      id: "rev_q_reading_fb1",
      weakAreaKey,
      practiceType: "fill_blank",
      prompt: "Complete the sentence: 'The climber persevered until reaching the ___.'",
      contextText: "Reference notes: The climber climbed up the mountain.",
      correctAnswer: "summit",
      ruleExplanation: "'Summit' means the highest point of a hill or mountain.",
    });
  } else if (weakAreaKey === "questions") {
    // Find generated notebook questions
    const qList: { text: string; ans: string }[] = [];
    notes.forEach(n => {
      n.generatedQuestions?.forEach(g => {
        qList.push({ text: g.questionText, ans: g.expectedAnswer || "" });
      });
    });

    if (qList.length > 0) {
      qList.slice(0, 2).forEach((g, idx) => {
        questions.push({
          id: `rev_q_nbq_${idx}`,
          weakAreaKey,
          practiceType: "fill_blank",
          prompt: g.text,
          contextText: "Answer matching generated notes.",
          correctAnswer: g.ans,
          ruleExplanation: `Expected answer stored in your notebook quiz parameters.`,
        });
      });
    } else {
      questions.push({
        id: "rev_q_nbq_fb1",
        weakAreaKey,
        practiceType: "fill_blank",
        prompt: "True or False: We use past perfect to describe actions that will happen in the future.",
        correctAnswer: "false",
        ruleExplanation: "Past perfect describes events that happened *before* another event in the past, not future actions.",
      });
    }
  } else {
    // Generic mistake repeat
    const list = mistakes.slice(0, 2);
    if (list.length > 0) {
      list.forEach((m, idx) => {
        questions.push({
          id: `rev_q_misc_${m.id}_${idx}`,
          weakAreaKey: "grammar",
          practiceType: "mistake_repeat",
          prompt: `Repeat correcting: "${m.wrongSentence}"`,
          contextText: `Simple Rule: ${m.simpleRule}`,
          correctAnswer: m.correctSentence,
          ruleExplanation: m.simpleRule,
          relatedMistakeId: m.id,
        });
      });
    } else {
      questions.push({
        id: "rev_q_generic_fb1",
        weakAreaKey: "grammar",
        practiceType: "correct_sentence",
        prompt: "Correct this sentence: 'I speaks english good.'",
        correctAnswer: "I speak English well.",
        ruleExplanation: "Use base verb 'speak' for subject 'I', capitalize 'English', and use adverb 'well' instead of adjective 'good'.",
      });
    }
  }

  return questions;
}

/** Check user's answer locally with Mock AI */
async function checkPracticeAnswer(
  question: RevisionPracticeQuestion,
  userAnswer: string,
): Promise<RevisionPracticeResult> {
  const cleanedUser = userAnswer.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
  const cleanedCorrect = question.correctAnswer.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");

  let correct = false;
  let score = 0;
  let feedbackMessage = "";
  let nextSuggestion = "";

  if (question.practiceType === "speaking_repeat") {
    // Mock speaking check
    const matchCount = cleanedUser.split(" ").filter(w => cleanedCorrect.includes(w)).length;
    const totalWords = cleanedCorrect.split(" ").length;
    score = totalWords > 0 ? Math.round((matchCount / totalWords) * 100) : 100;
    correct = score >= 80;
    
    if (correct) {
      feedbackMessage = `Excellent speaking pronunciation! Score: ${score}% match.`;
      nextSuggestion = "You have mastered this sentence. Try another speaking repetition.";
    } else {
      feedbackMessage = `Pronunciation accuracy needs improvement: ${score}% match. Try speaking closer to: "${question.correctAnswer}".`;
      nextSuggestion = "Try speaking slower and enunciating clear consonant sounds.";
    }
  } else if (question.practiceType === "preposition_choice") {
    correct = cleanedUser === cleanedCorrect;
    score = correct ? 100 : 0;
    if (correct) {
      feedbackMessage = "Correct preposition! Excellent spatial comprehension.";
      nextSuggestion = "Great. Let's move to the next preposition task.";
    } else {
      feedbackMessage = `Incorrect. Prepositions can be tricky. Correct choice is: "${question.correctAnswer}".`;
      nextSuggestion = "Review preposition rules for places or check the Prepositions module.";
    }
  } else {
    // Grammar / spelling / vocab
    correct = cleanedUser === cleanedCorrect;
    score = correct ? 100 : 0;
    
    // Fuzzy check fallback
    if (!correct) {
      // If user answer contains the correct answer or vice versa (for vocab)
      if (cleanedUser.length > 2 && (cleanedCorrect.includes(cleanedUser) || cleanedUser.includes(cleanedCorrect))) {
        correct = true;
        score = 85;
      }
    }

    if (correct) {
      feedbackMessage = `Perfect! Correct answer: "${question.correctAnswer}".`;
      nextSuggestion = "Your sentence matches the grammatical structure. Excellent job!";
    } else {
      feedbackMessage = `Incorrect structure. Expected: "${question.correctAnswer}".`;
      nextSuggestion = "Check grammatical parts or revise your notes in AI Notebook.";
    }
  }

  // Save revision attempt statistics
  const attempts = readLocalStorage<{ timestamp: string; correct: boolean }[]>(KEYS.attempts, []);
  attempts.push({ timestamp: new Date().toISOString(), correct });
  writeLocalStorage(KEYS.attempts, attempts);

  // If this was a mistake repeat and user succeeded, mark mistake as practiced
  if (correct && question.relatedMistakeId) {
    await mistakeService.markMistakePracticed(question.relatedMistakeId);
  }

  // Log history events
  await historyService.addEntry({
    type: "REVISION_PRACTICE_CHECKED",
    title: "Checked revision practice",
    description: `Attempted ${question.practiceType} for ${question.weakAreaKey}. Result: ${correct ? "Correct" : "Needs Improvement"} (${score}% score).`,
    sourceType: "REVISION",
    sourceId: question.id,
  });

  await historyService.addEntry({
    type: "WEAK_AREA_REVIEWED",
    title: `Reviewed Weak Area: ${question.weakAreaKey}`,
    description: `Completed targeted revision exercise under ${question.weakAreaKey}.`,
    sourceType: "REVISION",
    sourceId: question.weakAreaKey,
  });

  return {
    correct,
    score,
    userAnswer,
    correctAnswer: question.correctAnswer,
    ruleExplanation: question.ruleExplanation,
    feedbackMessage,
    nextSuggestion,
  };
}

export const revisionService = {
  detectWeakAreas,
  getRevisionStats,
  getRevisionTasks,
  generateRevisionPlan,
  markTaskCompleted,
  skipTask,
  getPracticeQuestions,
  checkPracticeAnswer,
};

export default revisionService;
