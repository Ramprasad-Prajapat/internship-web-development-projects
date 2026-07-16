import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  Copy,
  Check,
  BookOpen,
  Mic,
  PenTool,
  Lightbulb,
  AlertTriangle,
  Trophy,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Bookmark,
  Sparkles,
  Save,
  Trash2
} from "lucide-react";
import Button from "../common/Button";
import Card from "../common/Card";
import Badge from "../common/Badge";
// Services
import dailyLessonService from "../../services/dailyLessonService";
import lessonService from "../../services/lessonService";
import prepositionService from "../../services/prepositionService";
import lessonSectionPracticeService from "../../services/lessonSectionPracticeService";
import aiNotebookService from "../../services/aiNotebookService";
import mistakeService from "../../services/mistakeService";
import historyService from "../../services/historyService";
import sectionProgressService from "../../services/sectionProgressService";
import learnerInsightsService from "../../services/learnerInsightsService";
import aiTutorService from "../../services/aiTutorService";
import speakingAiService, { MockSpeakingCoachFeedback } from "../../services/speakingAiService";
import homeworkService, { HomeworkProgress } from "../../services/homeworkService";
import { selfCheckService, SelfCheckProgress } from "../../services/selfCheckService";
import { previewService, PreviewProgress } from "../../services/previewService";
import ExamplesMakeSentencesSection from "./ExamplesMakeSentencesSection";
// Types
import type { NotebookItem, NotebookSourceType } from "../../types/aiNotebook.types";
import type { MockWritingCheckResult, MockSpeakingCheckResult } from "../../types/lessonSection.types";
import type { PracticeSourceType } from "../../types/ai.types";
import type { Mistake } from "../../types/mistake.types";
import type { SectionProgress } from "../../types/sectionProgress.types";
// Components
import SectionProgressCard from "./SectionProgressCard";
import MockAICoachPanel from "./MockAICoachPanel";

interface SectionData {
  heading: string;
  body: string;
  parentTitle: string;
  parentUrl: string;
  moduleKey: string;
  sourceType: NotebookSourceType;
  practiceSourceType: "DAILY_LESSON" | "PREPOSITION";
  sourceId: string;
}

interface Activity {
  name: string;
  duration: number;
}

const parseTimetable = (body: string): Activity[] => {
  const lines = body.split("\n");
  const result: Activity[] = [];
  for (const line of lines) {
    const cleanLine = line.replace(/^[•\-\*\s]+/, "").trim();
    if (!cleanLine) continue;

    // Split on dash (— or -)
    const parts = cleanLine.split(/—|-/);
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const timeStr = parts[1].replace(/[^0-9]/g, "");
      const duration = parseInt(timeStr, 10) || 5;
      result.push({ name, duration });
    } else {
      // Split on colon (:)
      const partsColon = cleanLine.split(":");
      if (partsColon.length >= 2) {
        const name = partsColon[0].trim();
        const timeStr = partsColon[1].replace(/[^0-9]/g, "");
        const duration = parseInt(timeStr, 10) || 5;
        result.push({ name, duration });
      } else {
        result.push({ name: cleanLine, duration: 5 });
      }
    }
  }
  return result;
};

export default function SectionDetailView() {
  const { dayNumber, id, type, sectionId } = useParams<{
    dayNumber?: string;
    id?: string;
    type?: string;
    sectionId: string;
  }>();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sectionData, setSectionData] = useState<SectionData | null>(null);
  const [activeTab, setActiveTab] = useState<"tips" | "write" | "speak" | "notebook" | "mistakes">("tips");

  // Speaker/TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // AI Tips State
  const [tips, setTips] = useState<string[]>([]);
  const [savingTips, setSavingTips] = useState(false);
  const [tipsSaved, setTipsSaved] = useState(false);

  // Write Mode State
  const [writeInput, setWriteInput] = useState("");
  const [checkingWrite, setCheckingWrite] = useState(false);
  const [writeResult, setWriteResult] = useState<MockWritingCheckResult | null>(null);
  const [savingCorrection, setSavingCorrection] = useState(false);
  const [correctionSaved, setCorrectionSaved] = useState(false);

  // Speak Mode State
  const [speakInput, setSpeakInput] = useState("");
  const [checkingSpeak, setCheckingSpeak] = useState(false);
  const [speakResult, setSpeakResult] = useState<MockSpeakingCheckResult | null>(null);

  // Notebook State
  const [noteText, setNoteText] = useState("");
  const [linkedNote, setLinkedNote] = useState<NotebookItem | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  // Extra saving states for practice
  const [savingWritingNote, setSavingWritingNote] = useState(false);
  const [writingNoteSaved, setWritingNoteSaved] = useState(false);
  const [savingSpeakingNote, setSavingSpeakingNote] = useState(false);
  const [speakingNoteSaved, setSpeakingNoteSaved] = useState(false);
  const [isSpeakingLine, setIsSpeakingLine] = useState(false);

  // Mistakes State
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loadingMistakes, setLoadingMistakes] = useState(false);

  // New Speaking Drill states
  const [speakingChecklist, setSpeakingChecklist] = useState({
    listen: false,
    speak: false,
    check: false,
    saveNote: false,
    saveMistake: false,
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [speakCoachFeedback, setSpeakCoachFeedback] = useState<MockSpeakingCoachFeedback | null>(null);
  const [speakingMistakesCount, setSpeakingMistakesCount] = useState(0);
  const [speakingNotesCount, setSpeakingNotesCount] = useState(0);
  const [extraSpeakingLines, setExtraSpeakingLines] = useState<string[]>([]);
  const [showExtraSpeakingCollapsible, setShowExtraSpeakingCollapsible] = useState(false);
  const [practiceTargetOverride, setPracticeTargetOverride] = useState<string | null>(null);
  const [showTranscriptBox, setShowTranscriptBox] = useState(false);

  // Section Progress State
  const [progress, setProgress] = useState<SectionProgress | null>(null);

  // Bookmarking & Difficult Sentences State
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [diffSentence, setDiffSentence] = useState("");
  const [diffMeaning, setDiffMeaning] = useState("");
  const [sentenceSaved, setSentenceSaved] = useState(false);

  // Custom structured section states
  const [homeworkInput, setHomeworkInput] = useState("");
  const [hwProgress, setHwProgress] = useState<HomeworkProgress | null>(null);
  const [hwFeedback, setHwFeedback] = useState<{
    match: "Good" | "Needs Practice";
    issueType: string;
    hinglishTip: string;
  } | null>(null);
  const [homeworkSaved, setHomeworkSaved] = useState(false);

  const [scProgress, setScProgress] = useState<SelfCheckProgress | null>(null);
  const [scFeedback, setScFeedback] = useState<{
    match: "Good" | "Needs Practice";
    issueType: string;
    hinglishTip: string;
  } | null>(null);

  const [prevProgress, setPrevProgress] = useState<PreviewProgress | null>(null);
  const [isPreparingDay3, setIsPreparingDay3] = useState(false);

  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [repeatCount, setRepeatCount] = useState(0);
  const [drillCompleted, setDrillCompleted] = useState(false);
  const [activeQAIndex, setActiveQAIndex] = useState<number | null>(null);

  // Q&A AI Tutor Practice State
  const [qaMode, setQaMode] = useState<"review" | "practice">("practice");
  const [currentQAIndex, setCurrentQAIndex] = useState(0);
  const [userQAAnswer, setUserQAAnswer] = useState("");
  const [isQAChecking, setIsQAChecking] = useState(false);
  const [qaFeedback, setQaFeedback] = useState<{
    score: number;
    correctedAnswer: string;
    naturalAnswer: string;
    hinglishExplanation: string;
    mistakeType: "grammar" | "vocabulary" | "punctuation" | "none";
  } | null>(null);
  const [showSamples, setShowSamples] = useState(false);
  const [extraQuestions, setExtraQuestions] = useState<Array<{ q: string; a: string; category: string }>>([]);
  const [showExtraCollapsible, setShowExtraCollapsible] = useState(false);
  const [qaChecklist, setQaChecklist] = useState({
    readAll: false,
    listenAnswers: false,
    checkAnswer: false,
    saveItem: false,
  });
  const [qaMistakesCount, setQaMistakesCount] = useState(0);
  const [qaNotesCount, setQaNotesCount] = useState(0);
  const [isQAListening, setIsQAListening] = useState(false);

  // Time Table custom states
  const [isEditing, setIsEditing] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tempActivities, setTempActivities] = useState<Activity[]>([]);
  const [checklist, setChecklist] = useState(() => {
    const saved = localStorage.getItem(`eng_timetable_checklist_day_${dayNumber || 'general'}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return { read: false, understand: false };
  });

  // Mini Conversation states
  const [convReply, setConvReply] = useState("");
  const [checkingConv, setCheckingConv] = useState(false);
  const [convFeedback, setConvFeedback] = useState<{
    status: "Good" | "Needs Practice";
    userReply: string;
    betterReply: string;
    mistake: string;
    hinglishExplanation: string;
  } | null>(null);
  const [isRecordingConv, setIsRecordingConv] = useState(false);
  const [convMistakeSaved, setConvMistakeSaved] = useState(false);

  // Sync checklist state to localStorage
  useEffect(() => {
    localStorage.setItem(`eng_timetable_checklist_day_${dayNumber || 'general'}`, JSON.stringify(checklist));
  }, [checklist, dayNumber]);

  // Custom vocabulary section states
  const [vocabChecklist, setVocabChecklist] = useState(() => {
    const saved = localStorage.getItem(`eng_vocab_checklist_day_${dayNumber || 'general'}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return { readAll: false, listenAll: false, make2Sentences: false, completeQuiz: false };
  });

  const [knownWords, setKnownWords] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(`eng_known_words_day_${dayNumber || 'general'}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return {};
  });

  const [weakWords, setWeakWords] = useState<string[]>(() => {
    const saved = localStorage.getItem(`eng_weak_words_day_${dayNumber || 'general'}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return [];
  });

  const [vocabCoachInput, setVocabCoachInput] = useState("");
  const [vocabCoachChat, setVocabCoachChat] = useState<Array<{ sender: "user" | "coach"; text: string; actionResult?: any }>>([
    { sender: "coach", text: "Hello! I am your Vocabulary Coach. Ask me to explain a word, give you examples, check your sentence, or test you with a quiz." }
  ]);

  const [quizState, setQuizState] = useState<{
    targetWord: string;
    question: string;
    choices: string[];
    correctAnswer: string;
    selectedAnswer: string | null;
    checked: boolean;
    feedback: string | null;
    isCorrect: boolean | null;
    mistakeSaved?: boolean;
  } | null>(null);

  const [sentenceState, setSentenceState] = useState<{
    targetWord: string;
    sentenceText: string;
    checked: boolean;
    feedback: string | null;
    isCorrect: boolean | null;
    successCount: number;
  }>({
    targetWord: "",
    sentenceText: "",
    checked: false,
    feedback: null,
    isCorrect: null,
    successCount: 0
  });

  const [pronounceState, setPronounceState] = useState<{
    targetWord: string;
    feedback: string | null;
    isListening: boolean;
  }>({
    targetWord: "",
    feedback: null,
    isListening: false
  });

  // Sync vocabulary states to localStorage
  useEffect(() => {
    localStorage.setItem(`eng_vocab_checklist_day_${dayNumber || 'general'}`, JSON.stringify(vocabChecklist));
  }, [vocabChecklist, dayNumber]);

  useEffect(() => {
    localStorage.setItem(`eng_known_words_day_${dayNumber || 'general'}`, JSON.stringify(knownWords));
  }, [knownWords, dayNumber]);

  useEffect(() => {
    localStorage.setItem(`eng_weak_words_day_${dayNumber || 'general'}`, JSON.stringify(weakWords));
  }, [weakWords, dayNumber]);

  // Custom grammar section states
  const [grammarChecklist, setGrammarChecklist] = useState(() => {
    const saved = localStorage.getItem(`eng_grammar_checklist_day_${dayNumber || 'general'}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return { readRule: false, understandExamples: false, make2Sentences: false, practicePronounce: false, completeQuiz: false };
  });

  const [grammarWeakPoints, setGrammarWeakPoints] = useState<string[]>(() => {
    const saved = localStorage.getItem(`eng_grammar_weak_points_day_${dayNumber || 'general'}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return [];
  });

  const [weakGrammarPoints, setWeakGrammarPoints] = useState<string[]>(() => {
    const saved = localStorage.getItem(`eng_weak_grammar_points_day_${dayNumber || 'general'}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return [];
  });

  const [grammarCoachInput, setGrammarCoachInput] = useState("");
  const [grammarCoachChat, setGrammarCoachChat] = useState<Array<{ sender: "user" | "coach"; text: string }>>([
    { sender: "coach", text: "Hello! I am your Grammar Coach. Ask me to explain the grammar rule, give you examples, identify parts of speech, check/fix a sentence, or start a quiz." }
  ]);

  const [grammarPracticeTab, setGrammarPracticeTab] = useState<"identify" | "make" | "fix" | "quiz">("identify");

  // Grammar practice states
  const [grammarQuiz, setGrammarQuiz] = useState<{
    question: string;
    choices: string[];
    correctAnswer: string;
    selectedAnswer: string | null;
    checked: boolean;
    feedback: string | null;
    isCorrect: boolean | null;
    mistakeSaved?: boolean;
  } | null>(null);

  const [grammarSentence, setGrammarSentence] = useState<{
    inputText: string;
    checked: boolean;
    feedback: string | null;
    isCorrect: boolean | null;
    successCount: number;
  }>({
    inputText: "",
    checked: false,
    feedback: null,
    isCorrect: null,
    successCount: 0
  });

  const [grammarFix, setGrammarFix] = useState<{
    targetSentence: string;
    wrongSentence: string;
    inputText: string;
    checked: boolean;
    feedback: string | null;
    isCorrect: boolean | null;
  }>({
    targetSentence: "",
    wrongSentence: "",
    inputText: "",
    checked: false,
    feedback: null,
    isCorrect: null
  });

  const [grammarIdentify, setGrammarIdentify] = useState<{
    sentence: string;
    targetWord: string;
    partOfSpeech: string;
    choices: string[];
    selectedAnswer: string | null;
    checked: boolean;
    feedback: string | null;
    isCorrect: boolean | null;
  }>({
    sentence: "",
    targetWord: "",
    partOfSpeech: "",
    choices: [],
    selectedAnswer: null,
    checked: false,
    feedback: null,
    isCorrect: null
  });

  // Grammar pronunciation state
  const [grammarPronounce, setGrammarPronounce] = useState<{
    targetSentence: string;
    feedback: string | null;
    isListening: boolean;
    transcript?: string;
    status?: "Good" | "Needs Practice" | null;
    weakWords?: string[];
  }>({
    targetSentence: "",
    feedback: null,
    isListening: false,
    transcript: "",
    status: null,
    weakWords: []
  });

  // Sync grammar states to localStorage
  useEffect(() => {
    localStorage.setItem(`eng_grammar_checklist_day_${dayNumber || 'general'}`, JSON.stringify(grammarChecklist));
  }, [grammarChecklist, dayNumber]);

  useEffect(() => {
    localStorage.setItem(`eng_grammar_weak_points_day_${dayNumber || 'general'}`, JSON.stringify(grammarWeakPoints));
  }, [grammarWeakPoints, dayNumber]);

  useEffect(() => {
    localStorage.setItem(`eng_weak_grammar_points_day_${dayNumber || 'general'}`, JSON.stringify(weakGrammarPoints));
  }, [weakGrammarPoints, dayNumber]);

  // Custom examples / make sentences states
  const [examplesChecklist, setExamplesChecklist] = useState(() => {
    const saved = localStorage.getItem(`eng_examples_checklist_day_${dayNumber || 'general'}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return {
      readExamples: false,
      listenExamples: false,
      understandPattern: false,
      make3Sentences: false,
      checkOneSentence: false,
    };
  });

  const [weakSentencePatterns, setWeakSentencePatterns] = useState<string[]>(() => {
    const saved = localStorage.getItem(`eng_weak_patterns_day_${dayNumber || 'general'}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(`eng_examples_checklist_day_${dayNumber || 'general'}`, JSON.stringify(examplesChecklist));
  }, [examplesChecklist, dayNumber]);

  useEffect(() => {
    localStorage.setItem(`eng_weak_patterns_day_${dayNumber || 'general'}`, JSON.stringify(weakSentencePatterns));
  }, [weakSentencePatterns, dayNumber]);


  // Custom states to store parsed examples and mistakes from the daily lesson
  const [grammarExamples, setGrammarExamples] = useState<string[]>([]);
  const [grammarMistakes, setGrammarMistakes] = useState<Array<{ wrong: string; correct: string }>>([]);

  // Load lesson-wide sections to extract Examples and Common Mistakes for Grammar practice
  useEffect(() => {
    async function loadLessonContext() {
      if (!sectionData || !sectionData.heading.toLowerCase().includes("grammar")) return;
      try {
        let rawContent = "";
        let dayNum: number | null = null;
        if (dayNumber) {
          dayNum = Number(dayNumber);
          const lessons = await dailyLessonService.getByDay(dayNum);
          if (lessons && lessons[0]) {
            rawContent = lessons[0].rawContent;
          }
        } else if (id) {
          const lesson = await lessonService.getLesson(id);
          if (lesson) {
            rawContent = lesson.rawContent;
            dayNum = lesson.dayNumber;
          }
        }

        if (rawContent) {
          const sections = lessonService.splitIntoSections(rawContent, dayNum);

          // Parse Examples Section
          const examplesSec = sections.find(s => s.heading.toLowerCase().includes("example"));
          if (examplesSec) {
            const parsed = examplesSec.body.split("\n")
              .map(l => l.trim())
              .filter(l => l && !l.toLowerCase().startsWith("example") && !l.includes(":"))
              .map(l => l.replace(/^\d+\.\s*/, ""));
            setGrammarExamples(parsed);
          } else {
            // Fallback: parse sentences with numbers from the grammar body
            const bodySentences = sectionData.body.split("\n")
              .map(l => l.trim())
              .filter(l => /^\d+\./.test(l))
              .map(l => l.replace(/^\d+\.\s*/, ""));
            setGrammarExamples(bodySentences);
          }

          // Parse Common Mistakes Section
          const mistakesSec = sections.find(s => s.heading.toLowerCase().includes("mistake"));
          if (mistakesSec) {
            const lines = mistakesSec.body.split("\n").map(l => l.trim()).filter(Boolean);
            const pairs: Array<{ wrong: string; correct: string }> = [];
            let currentWrong = "";
            for (const line of lines) {
              if (line.toLowerCase().startsWith("wrong:")) {
                currentWrong = line.replace(/wrong:\s*/i, "");
              } else if (line.toLowerCase().startsWith("correct:") && currentWrong) {
                pairs.push({
                  wrong: currentWrong,
                  correct: line.replace(/correct:\s*/i, "")
                });
                currentWrong = "";
              }
            }
            setGrammarMistakes(pairs);
          }
        }
      } catch (e) {
        console.error("Error loading grammar lesson context:", e);
      }
    }
    loadLessonContext();
  }, [sectionData, dayNumber, id]);

  const handleGenerateGrammarIdentify = () => {
    const identifyPool = [
      { sentence: "I read a book.", targetWord: "read", partOfSpeech: "Verb", choices: ["Subject", "Verb", "Object"] },
      { sentence: "She likes hot tea.", targetWord: "She", partOfSpeech: "Subject", choices: ["Subject", "Verb", "Object"] },
      { sentence: "We play cricket.", targetWord: "cricket", partOfSpeech: "Object", choices: ["Subject", "Verb", "Object"] },
      { sentence: "This is my pen.", targetWord: "This", partOfSpeech: "Subject", choices: ["Subject", "Verb", "Object"] },
      { sentence: "He goes to school.", targetWord: "goes", partOfSpeech: "Verb", choices: ["Subject", "Verb", "Object"] }
    ];
    const selected = identifyPool[Math.floor(Math.random() * identifyPool.length)];
    setGrammarIdentify({
      ...selected,
      selectedAnswer: null,
      checked: false,
      feedback: null,
      isCorrect: null
    });
  };

  const handleCheckGrammarIdentify = () => {
    if (!grammarIdentify || !grammarIdentify.selectedAnswer) return;
    const isCorrect = grammarIdentify.selectedAnswer === grammarIdentify.partOfSpeech;
    setGrammarIdentify({
      ...grammarIdentify,
      checked: true,
      isCorrect,
      feedback: isCorrect
        ? `Correct! "${grammarIdentify.targetWord}" is indeed a ${grammarIdentify.partOfSpeech}.`
        : `Incorrect. "${grammarIdentify.targetWord}" acts as a ${grammarIdentify.partOfSpeech} in this sentence.`
    });
    if (!isCorrect) {
      const point = `Parts of Speech: ${grammarIdentify.partOfSpeech}`;
      setWeakGrammarPoints(prev => {
        if (!prev.includes(point)) return [...prev, point];
        return prev;
      });
    }
  };

  const handleCheckGrammarSentence = () => {
    const input = grammarSentence.inputText.trim();
    if (!input) {
      setGrammarSentence({ ...grammarSentence, checked: true, feedback: "Please write a sentence first.", isCorrect: false });
      return;
    }

    const startsWithCap = /^[A-Z]/.test(input);
    const endsWithPunct = /[.!?]$/.test(input);

    let feedback = "";
    let isCorrect = true;

    if (!startsWithCap) {
      feedback = "Make sure your sentence starts with a capital letter.";
      isCorrect = false;
    } else if (!endsWithPunct) {
      feedback = "Remember to end your sentence with a punctuation mark (period, question mark, or exclamation).";
      isCorrect = false;
    } else {
      feedback = `Great job! "${input}" is a grammatically structured sentence.`;
    }

    const nextCount = isCorrect ? grammarSentence.successCount + 1 : grammarSentence.successCount;
    setGrammarSentence({
      ...grammarSentence,
      checked: true,
      feedback,
      isCorrect,
      successCount: nextCount
    });

    if (nextCount >= 2) {
      setGrammarChecklist((prev: any) => ({ ...prev, make2Sentences: true }));
    }

    if (!isCorrect) {
      const point = "Capitalization & Punctuation Mechanics";
      setWeakGrammarPoints(prev => {
        if (!prev.includes(point)) return [...prev, point];
        return prev;
      });
    }
  };

  const handleGenerateGrammarFix = () => {
    const fallbackMistakes = [
      { wrong: "She wake up early.", correct: "She wakes up early." },
      { wrong: "She like tea.", correct: "She likes tea." },
      { wrong: "This are my books.", correct: "These are my books." },
      { wrong: "There is two books.", correct: "There are two books." },
      { wrong: "I read book.", correct: "I read a book." }
    ];
    const pool = grammarMistakes.length > 0 ? grammarMistakes : fallbackMistakes;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    setGrammarFix({
      wrongSentence: selected.wrong,
      targetSentence: selected.correct,
      inputText: "",
      checked: false,
      feedback: null,
      isCorrect: null
    });
  };

  const handleCheckGrammarFix = () => {
    if (!grammarFix) return;
    const inputClean = grammarFix.inputText.trim().toLowerCase().replace(/[.!?]/g, "");
    const targetClean = grammarFix.targetSentence.trim().toLowerCase().replace(/[.!?]/g, "");
    const isCorrect = inputClean === targetClean;

    setGrammarFix({
      ...grammarFix,
      checked: true,
      isCorrect,
      feedback: isCorrect
        ? `Correct! The corrected sentence is: "${grammarFix.targetSentence}".`
        : `Incorrect. Try again. A correct option would be: "${grammarFix.targetSentence}".`
    });

    if (!isCorrect) {
      const point = "Sentence Correction / Verb Agreement";
      setWeakGrammarPoints(prev => {
        if (!prev.includes(point)) return [...prev, point];
        return prev;
      });
    }
  };

  const handleGenerateGrammarQuiz = () => {
    const fallbackQuizzes = [
      {
        question: "Select the correct sentence using Simple Present Tense:",
        choices: ["He walk to work.", "He walks to work.", "He walking to work."],
        correctAnswer: "He walks to work."
      },
      {
        question: "Which demonstrative pronoun is correct for multiple items far away?",
        choices: ["This", "These", "Those"],
        correctAnswer: "Those"
      },
      {
        question: "Choose the correct sentence structure:",
        choices: ["I coffee like.", "I like coffee.", "Like I coffee."],
        correctAnswer: "I like coffee."
      },
      {
        question: "Complete the sentence: 'There ___ a apple on the table.'",
        choices: ["is", "are", "be"],
        correctAnswer: "is"
      }
    ];
    const selected = fallbackQuizzes[Math.floor(Math.random() * fallbackQuizzes.length)];
    setGrammarQuiz({
      ...selected,
      selectedAnswer: null,
      checked: false,
      feedback: null,
      isCorrect: null
    });
  };

  const handleCheckGrammarQuiz = () => {
    if (!grammarQuiz || !grammarQuiz.selectedAnswer) return;
    const isCorrect = grammarQuiz.selectedAnswer === grammarQuiz.correctAnswer;
    setGrammarQuiz({
      ...grammarQuiz,
      checked: true,
      isCorrect,
      feedback: isCorrect
        ? `Correct! "${grammarQuiz.correctAnswer}" is the right choice.`
        : `Incorrect. The correct answer is: "${grammarQuiz.correctAnswer}".`
    });
    if (isCorrect) {
      setGrammarChecklist((prev: any) => ({ ...prev, completeQuiz: true }));
    } else {
      let weakPoint = "General Grammar Rules";
      if (grammarQuiz.question.toLowerCase().includes("present")) {
        weakPoint = "Simple Present Tense";
      } else if (grammarQuiz.question.toLowerCase().includes("demonstrative") || grammarQuiz.question.toLowerCase().includes("those")) {
        weakPoint = "Demonstrative Pronouns (Those/These)";
      } else if (grammarQuiz.question.toLowerCase().includes("structure") || grammarQuiz.question.toLowerCase().includes("like")) {
        weakPoint = "Subject-Verb-Object Structure";
      } else if (grammarQuiz.question.toLowerCase().includes("there")) {
        weakPoint = "There is / There are";
      }
      setWeakGrammarPoints(prev => {
        if (!prev.includes(weakPoint)) return [...prev, weakPoint];
        return prev;
      });
    }
  };

  const handleSaveGrammarQuizMistake = async () => {
    if (!grammarQuiz || grammarQuiz.isCorrect) return;
    try {
      await mistakeService.saveMistake({
        sourceType: "DAILY_LESSON",
        sourceId: dayNumber ?? id ?? null,
        sourceTitle: `Day ${dayNumber || id} Grammar Quiz`,
        wrongSentence: `Grammar error: selected "${grammarQuiz.selectedAnswer}" instead of "${grammarQuiz.correctAnswer}"`,
        correctSentence: `"${grammarQuiz.correctAnswer}"`,
        simpleRule: `Grammar Rule: Review grammar explanations for Day ${dayNumber || id}.`,
        mistakeType: "grammar"
      });
      setGrammarQuiz({
        ...grammarQuiz,
        mistakeSaved: true
      });
    } catch (e) {
      console.error("Failed to save grammar quiz mistake", e);
    }
  };

  const handleStartSpeakGrammar = (sentence: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setGrammarPronounce({
        targetSentence: sentence,
        isListening: false,
        feedback: `Speech synthesis/recognition not supported in this browser. Please read the sentence aloud: "${sentence}"`,
        transcript: undefined,
        status: undefined,
        weakWords: []
      });
      setGrammarChecklist((prev: any) => ({ ...prev, practicePronounce: true }));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setGrammarPronounce({
      targetSentence: sentence,
      isListening: true,
      feedback: "Listening... Read the sentence now.",
      transcript: "",
      status: null,
      weakWords: []
    });

    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript.trim().toLowerCase();
      const targetClean = sentence.replace(/[.!?]/g, "").trim().toLowerCase();

      const targetWords = targetClean.split(/\s+/);
      const spokenWords = spokenText.split(/\s+/);
      const missed: string[] = [];

      for (const w of targetWords) {
        if (!spokenWords.includes(w) && !grammarWeakPoints.includes(w)) {
          missed.push(w);
        }
      }

      const match = spokenText.includes(targetClean) || targetWords.filter(w => spokenWords.includes(w)).length / targetWords.length >= 0.75;

      if (match) {
        setGrammarPronounce({
          targetSentence: sentence,
          isListening: false,
          feedback: `Good Pronunciation! Spoke: "${spokenText}"`,
          transcript: spokenText,
          status: "Good",
          weakWords: []
        });
        setGrammarChecklist((prev: any) => ({ ...prev, practicePronounce: true }));
      } else {
        if (missed.length > 0) {
          setGrammarWeakPoints(prev => {
            const next = [...prev];
            missed.forEach(w => {
              if (!next.includes(w)) next.push(w);
            });
            return next;
          });
        }
        setGrammarPronounce({
          targetSentence: sentence,
          isListening: false,
          feedback: `Needs Practice. Spoke: "${spokenText}". Target: "${sentence}"`,
          transcript: spokenText,
          status: "Needs Practice",
          weakWords: missed
        });
      }
    };

    recognition.onerror = () => {
      setGrammarPronounce({
        targetSentence: sentence,
        isListening: false,
        feedback: "Speech recognition error. Please try again.",
        transcript: undefined,
        status: undefined,
        weakWords: []
      });
    };

    recognition.onend = () => {
      setGrammarPronounce(prev => ({ ...prev, isListening: false }));
    };

    recognition.start();
  };

  const handleListenAllGrammar = () => {
    if (typeof window === "undefined" || !window.speechSynthesis || grammarExamples.length === 0) return;
    window.speechSynthesis.cancel();
    let index = 0;

    const speakNext = () => {
      if (index >= grammarExamples.length) {
        setGrammarChecklist((prev: any) => ({ ...prev, understandExamples: true }));
        return;
      }
      const text = grammarExamples[index];
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.onend = () => {
        index++;
        setTimeout(speakNext, 600);
      };
      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  };

  const handleAskGrammarCoach = async (queryText?: string, overrideAction?: string) => {
    const rawQuery = queryText !== undefined ? queryText : grammarCoachInput;
    if (!rawQuery.trim() && !overrideAction) return;

    const query = rawQuery.trim();
    const newChat = [...grammarCoachChat];
    if (query) {
      newChat.push({ sender: "user", text: query });
    }
    setGrammarCoachInput("");

    let action = overrideAction || "explain_rule";
    const lowerQuery = query.toLowerCase();

    if (!overrideAction) {
      if (lowerQuery.includes("explain") || lowerQuery.includes("rule") || lowerQuery.includes("meaning") || lowerQuery.includes("what is")) {
        action = "explain_rule";
      } else if (lowerQuery.includes("example") || lowerQuery.includes("sentences")) {
        action = "give_examples";
      } else if (lowerQuery.includes("quiz") || lowerQuery.includes("test")) {
        action = "generate_quiz";
      } else if (lowerQuery.includes("identify") || lowerQuery.includes("parts")) {
        action = "identify_parts";
      } else if (lowerQuery.includes("fix") || lowerQuery.includes("correct sentence") || lowerQuery.includes("error")) {
        action = "fix_sentence";
      } else if (lowerQuery.includes("check") || lowerQuery.includes("my sentence")) {
        action = "check_sentence";
      } else if (lowerQuery.includes("pronounce") || lowerQuery.includes("pronunciation") || lowerQuery.includes("speak") || lowerQuery.includes("voice")) {
        action = "pronunciation_help";
      } else {
        const isGrammarWord = sectionData && (sectionData.body.toLowerCase().includes(query.toLowerCase()) || query.split(/\s+/).some(w => sectionData.body.toLowerCase().includes(w)));
        if (!isGrammarWord && query) {
          const coachReply = `Grammar Coach Response:\n` +
            `- **Result**: Out of Scope\n` +
            `- **Answer**: "${query}"\n` +
            `- **Explanation**: This coach helps with this grammar section only. Please ask about today's grammar rules or practice drills.\n` +
            `- **Weak Point**: None`;
          newChat.push({ sender: "coach", text: coachReply });
          setGrammarCoachChat(newChat);
          return;
        }
        action = "explain_rule";
      }
    }

    let coachReply = "";

    if (action === "explain_rule") {
      coachReply = `Grammar Coach Response:\n` +
        `- **Result**: Explanation Loaded\n` +
        `- **Answer**: "${query || 'Explain Rule request'}"\n` +
        `- **Explanation**: ${sectionData ? sectionData.body.split("Examples")[0].trim() : "Focus on correct sentence structure."}\n` +
        `- **Weak Point**: None (Informational)`;
    } else if (action === "give_examples") {
      const examplesList = grammarExamples.length > 0
        ? grammarExamples.map((ex, i) => `  ${i + 1}. "${ex}"`).join("\n")
        : `  1. "I like coffee."\n  2. "He plays football."`;
      coachReply = `Grammar Coach Response:\n` +
        `- **Result**: Examples Provided\n` +
        `- **Answer**: "${query || 'Give Examples request'}"\n` +
        `- **Explanation**: Today's rule examples are:\n${examplesList}\n` +
        `- **Weak Point**: None (Informational)`;
    } else if (action === "generate_quiz") {
      coachReply = `Grammar Coach Response:\n` +
        `- **Result**: Quiz Generated\n` +
        `- **Answer**: "${query || 'Ask Quiz request'}"\n` +
        `- **Explanation**: I have loaded a new multiple-choice question in your Practice Card. Choose the right answer!\n` +
        `- **Weak Point**: None (Practice Mode)`;
      handleGenerateGrammarQuiz();
      setGrammarPracticeTab("quiz");
    } else if (action === "identify_parts") {
      coachReply = `Grammar Coach Response:\n` +
        `- **Result**: Exercise Loaded\n` +
        `- **Answer**: "${query || 'Identify Parts request'}"\n` +
        `- **Explanation**: I have loaded a parts of speech identification exercise in your Practice Card.\n` +
        `- **Weak Point**: None (Practice Mode)`;
      handleGenerateGrammarIdentify();
      setGrammarPracticeTab("identify");
    } else if (action === "fix_sentence") {
      coachReply = `Grammar Coach Response:\n` +
        `- **Result**: Exercise Loaded\n` +
        `- **Answer**: "${query || 'Fix Sentence request'}"\n` +
        `- **Explanation**: I have loaded a sentence correction exercise in your Practice Card.\n` +
        `- **Weak Point**: None (Practice Mode)`;
      handleGenerateGrammarFix();
      setGrammarPracticeTab("fix");
    } else if (action === "check_sentence") {
      let sentenceToCheck = "";
      const quoteMatch = query.match(/"([^"]+)"/) || query.match(/'([^']+)'/);
      if (quoteMatch) {
        sentenceToCheck = quoteMatch[1];
      } else {
        sentenceToCheck = query.replace(/check|correct|my sentence/gi, "").trim();
      }

      if (!sentenceToCheck) {
        coachReply = `Grammar Coach Response:\n` +
          `- **Result**: Input Required\n` +
          `- **Answer**: N/A\n` +
          `- **Explanation**: Please write a sentence for me to check. For example: "Check my sentence: 'I read a book'"`;
      } else {
        const hasCap = /^[A-Z]/.test(sentenceToCheck);
        const hasPunct = /[.!?]$/.test(sentenceToCheck);
        if (hasCap && hasPunct) {
          coachReply = `Grammar Coach Response:\n` +
            `- **Result**: Correct\n` +
            `- **Answer**: "${sentenceToCheck}"\n` +
            `- **Explanation**: Good job starting with a capital letter and ending with punctuation.\n` +
            `- **Weak Point**: None`;
        } else {
          let corrected = sentenceToCheck;
          if (!hasCap) corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
          if (!hasPunct) corrected = corrected + ".";

          coachReply = `Grammar Coach Response:\n` +
            `- **Result**: Incorrect\n` +
            `- **Answer**: "${sentenceToCheck}"\n` +
            `- **Correct Answer**: "${corrected}"\n` +
            `- **Explanation**: Ensure your sentence starts with a capital letter and ends with a punctuation mark (period, question mark, or exclamation).\n` +
            `- **Weak Point**: Capitalization & Punctuation Mechanics`;

          setWeakGrammarPoints(prev => {
            const point = "Capitalization & Punctuation Mechanics";
            if (!prev.includes(point)) return [...prev, point];
            return prev;
          });
        }
      }
    } else if (action === "pronunciation_help") {
      coachReply = `Grammar Coach Response:\n` +
        `- **Result**: Pronunciation Help Provided\n` +
        `- **Answer**: "${query || 'Pronunciation Help request'}"\n` +
        `- **Explanation**: Read slowly and focus on key grammar markers (like the ending 's' in present-simple verbs, e.g. "likes", "wakes"). Also use the Listen buttons to hear correct native pronunciation.\n` +
        `- **Weak Point**: None`;
    }

    newChat.push({ sender: "coach", text: coachReply });
    setGrammarCoachChat(newChat);
  };

  // Initialize grammar states on load
  useEffect(() => {
    if (sectionData && sectionData.heading.toLowerCase().includes("grammar")) {
      handleGenerateGrammarIdentify();
      handleGenerateGrammarFix();
      handleGenerateGrammarQuiz();
      if (grammarExamples.length > 0 && !grammarPronounce.targetSentence) {
        setGrammarPronounce(prev => ({ ...prev, targetSentence: grammarExamples[0] }));
      }
    }
  }, [sectionData, grammarExamples]);

  // Parse vocabulary words from section body
  const lines = sectionData ? sectionData.body.split("\n").map(l => l.trim()).filter(Boolean) : [];
  const rows = lines.map(line => line.split("|").map(c => c.trim()));
  const vocabRows = rows.filter(row => row.length >= 2 && row[0].toLowerCase() !== "word");
  const parsedWords = vocabRows.map(row => ({
    word: row[0] || "",
    meaning: row[1] || "",
    example: row[2] || ""
  })).filter(w => w.word !== "");

  // Sequential audio player for all vocabulary words
  const handleListenAll = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    let index = 0;

    const speakNext = () => {
      if (index >= parsedWords.length) {
        setVocabChecklist((prev: { readAll: boolean; listenAll: boolean; make2Sentences: boolean; completeQuiz: boolean }) => ({ ...prev, listenAll: true }));
        return;
      }
      const item = parsedWords[index];
      const text = `${item.word}. Meaning: ${item.meaning}. Example: ${item.example}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.onend = () => {
        index++;
        setTimeout(speakNext, 600); // delay between words
      };
      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  };

  // Generate a multiple choice quiz question
  const handleGenerateQuiz = (wordToUse?: string) => {
    if (parsedWords.length === 0) return;

    const target = wordToUse
      ? parsedWords.find(w => w.word.toLowerCase() === wordToUse.toLowerCase()) || parsedWords[Math.floor(Math.random() * parsedWords.length)]
      : parsedWords[Math.floor(Math.random() * parsedWords.length)];

    const correctAnswer = target.meaning;

    // Gather incorrect choices
    const otherMeanings = parsedWords
      .filter(w => w.word !== target.word)
      .map(w => w.meaning);

    const choices = [correctAnswer];
    while (choices.length < Math.min(3, parsedWords.length)) {
      const randMeaning = otherMeanings[Math.floor(Math.random() * otherMeanings.length)];
      if (randMeaning && !choices.includes(randMeaning)) {
        choices.push(randMeaning);
      }
    }

    const fallbacks = [
      "To move quickly or rush",
      "To understand or comprehend fully",
      "To express feelings in a creative way",
      "To study or inspect closely"
    ];
    while (choices.length < 3) {
      const fb = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      if (!choices.includes(fb)) {
        choices.push(fb);
      }
    }

    choices.sort(() => Math.random() - 0.5);

    setQuizState({
      targetWord: target.word,
      question: `What is the meaning of the word "${target.word}"?`,
      choices,
      correctAnswer,
      selectedAnswer: null,
      checked: false,
      feedback: null,
      isCorrect: null,
      mistakeSaved: false
    });
  };

  // Verify quiz answer
  const handleCheckQuizAnswer = () => {
    if (!quizState || !quizState.selectedAnswer) return;

    const isCorrect = quizState.selectedAnswer === quizState.correctAnswer;
    let feedback = "";

    if (isCorrect) {
      feedback = `Correct! "${quizState.targetWord}" indeed means: "${quizState.correctAnswer}".`;
      setVocabChecklist((prev: { readAll: boolean; listenAll: boolean; make2Sentences: boolean; completeQuiz: boolean }) => ({ ...prev, completeQuiz: true }));
    } else {
      feedback = `Incorrect. "${quizState.targetWord}" actually means: "${quizState.correctAnswer}".`;
      if (!weakWords.includes(quizState.targetWord)) {
        setWeakWords([...weakWords, quizState.targetWord]);
      }
    }

    setQuizState({
      ...quizState,
      checked: true,
      feedback,
      isCorrect
    });
  };

  // Save quiz mistake to Mistakes log
  const handleSaveQuizMistake = async () => {
    if (!quizState || quizState.isCorrect) return;

    const wordInfo = parsedWords.find(w => w.word === quizState.targetWord);
    const exampleText = wordInfo ? wordInfo.example : "";

    try {
      await mistakeService.saveMistake({
        sourceType: "DAILY_LESSON",
        sourceId: dayNumber ?? id ?? null,
        sourceTitle: `Day ${dayNumber || id} Vocabulary Quiz`,
        wrongSentence: `Definition error: confused definition of "${quizState.targetWord}" with "${quizState.selectedAnswer}"`,
        correctSentence: `"${quizState.targetWord}" means "${quizState.correctAnswer}". Example: "${exampleText}"`,
        simpleRule: `Vocabulary Definition: Learn the correct usage of the word "${quizState.targetWord}".`,
        mistakeType: "vocabulary"
      });
      setQuizState({
        ...quizState,
        mistakeSaved: true
      });
    } catch (e) {
      console.error("Failed to save vocabulary quiz mistake", e);
    }
  };

  // Check user sentence grammar and usage
  const handleCheckSentence = () => {
    const word = sentenceState.targetWord || (parsedWords[0] ? parsedWords[0].word : "");
    if (!word) return;
    const input = sentenceState.sentenceText.trim();
    if (!input) {
      setSentenceState({ ...sentenceState, checked: true, feedback: "Please write a sentence first.", isCorrect: false });
      return;
    }

    if (!input.toLowerCase().includes(word.toLowerCase())) {
      setSentenceState({
        ...sentenceState,
        checked: true,
        feedback: `Your sentence must include the target word "${word}".`,
        isCorrect: false
      });
      return;
    }

    const startsWithCap = /^[A-Z]/.test(input);
    const endsWithPunct = /[.!?]$/.test(input);

    let feedback = "";
    let isCorrect = true;

    if (!startsWithCap) {
      feedback = "Make sure your sentence starts with a capital letter.";
      isCorrect = false;
    } else if (!endsWithPunct) {
      feedback = "Remember to end your sentence with a punctuation mark (period, question mark, or exclamation point).";
      isCorrect = false;
    } else {
      feedback = `Great job! "${input}" is a well-structured sentence using "${word}".`;
    }

    const nextCount = isCorrect ? sentenceState.successCount + 1 : sentenceState.successCount;
    setSentenceState({
      ...sentenceState,
      checked: true,
      feedback,
      isCorrect,
      successCount: nextCount
    });

    if (nextCount >= 2) {
      setVocabChecklist((prev: { readAll: boolean; listenAll: boolean; make2Sentences: boolean; completeQuiz: boolean }) => ({ ...prev, make2Sentences: true }));
    }
  };

  // Evaluate pronunciation speaking drill
  const handleStartSpeakVocab = () => {
    const word = pronounceState.targetWord || (parsedWords[0] ? parsedWords[0].word : "");
    if (!word) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setPronounceState({
        ...pronounceState,
        isListening: false,
        feedback: `Speech synthesis/recognition not supported in this browser. Please read the word "${word}" aloud to yourself to practice!`
      });
      setVocabChecklist((prev: { readAll: boolean; listenAll: boolean; make2Sentences: boolean; completeQuiz: boolean }) => ({ ...prev, listenAll: true }));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setPronounceState({ ...pronounceState, isListening: true, feedback: "Listening... Speak the word now." });

    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript.trim().toLowerCase();
      const match = spokenText.includes(word.toLowerCase());

      if (match) {
        setPronounceState({
          ...pronounceState,
          isListening: false,
          feedback: `Excellent pronunciation! Spoke: "${spokenText}" (100% Match)`
        });
        setVocabChecklist((prev: { readAll: boolean; listenAll: boolean; make2Sentences: boolean; completeQuiz: boolean }) => ({ ...prev, listenAll: true }));
      } else {
        setPronounceState({
          ...pronounceState,
          isListening: false,
          feedback: `Try again. Spoke: "${spokenText}". Make sure to enunciate "${word}".`
        });
      }
    };

    recognition.onerror = () => {
      setPronounceState({
        ...pronounceState,
        isListening: false,
        feedback: "Speech recognition error. Please try again or read the word aloud."
      });
    };

    recognition.onend = () => {
      setPronounceState({ ...pronounceState, isListening: false });
    };

    recognition.start();
  };

  // Rule-based Vocabulary Coach dialog handler
  const handleAskCoach = async (queryText?: string, targetWordOverride?: string) => {
    const rawQuery = queryText !== undefined ? queryText : vocabCoachInput;
    if (!rawQuery.trim() && !targetWordOverride) return;

    const query = rawQuery.trim();
    const newChat = [...vocabCoachChat];
    if (query) {
      newChat.push({ sender: "user", text: query });
    }
    setVocabCoachInput("");

    let action: "explain_word" | "give_examples" | "generate_quiz" | "check_sentence" | "unrelated" = "explain_word";
    let targetWord = targetWordOverride || "";
    let sentenceToCheck = "";

    const lowerQuery = query.toLowerCase();

    if (!targetWord) {
      const foundWord = parsedWords.find(w => lowerQuery.includes(w.word.toLowerCase()));
      if (foundWord) {
        targetWord = foundWord.word;
      }
    }

    if (lowerQuery.includes("quiz") || lowerQuery.includes("test")) {
      action = "generate_quiz";
    } else if (lowerQuery.includes("example") || lowerQuery.includes("sentences")) {
      action = "give_examples";
    } else if (lowerQuery.includes("check") || lowerQuery.includes("correct") || lowerQuery.includes("my sentence")) {
      action = "check_sentence";
      const quoteMatch = query.match(/"([^"]+)"/) || query.match(/'([^']+)'/);
      if (quoteMatch) {
        sentenceToCheck = quoteMatch[1];
      } else {
        sentenceToCheck = query.replace(/check|correct|my sentence/gi, "").trim();
      }
    } else if (lowerQuery.includes("explain") || lowerQuery.includes("meaning") || lowerQuery.includes("what is") || lowerQuery.includes("what does")) {
      action = "explain_word";
    } else {
      if (targetWord) {
        action = "explain_word";
      } else {
        action = "unrelated";
      }
    }

    let coachReply = "";

    if (action === "unrelated") {
      coachReply = "This coach helps with today’s vocabulary words only. You can ask me to explain a word, give you examples, check a sentence, or start a quiz based on today's word list.";
    } else if (action === "generate_quiz") {
      coachReply = "Let's start a quiz! Select the correct definition for the word below.";
      handleGenerateQuiz(targetWord);
    } else if (action === "give_examples") {
      const wordInfo = parsedWords.find(w => w.word.toLowerCase() === targetWord.toLowerCase());
      if (wordInfo) {
        coachReply = `Here are 3 beginner-friendly examples using the word "${wordInfo.word}":\n\n` +
          `1. "I want to ${wordInfo.word} my daily speaking skills."\n` +
          `2. "He tries to ${wordInfo.word} new words in context."\n` +
          `3. "They need to ${wordInfo.word} English sentences every evening."`;
      } else {
        coachReply = "Which word from today's list would you like examples for?";
      }
    } else if (action === "check_sentence") {
      if (!sentenceToCheck) {
        coachReply = "Please provide the sentence you want me to check (e.g. Check my sentence: 'This is my sentence').";
      } else {
        const matchesWord = targetWord ? sentenceToCheck.toLowerCase().includes(targetWord.toLowerCase()) : parsedWords.some(w => sentenceToCheck.toLowerCase().includes(w.word.toLowerCase()));
        if (!matchesWord) {
          coachReply = `Incorrect word usage. Make sure you use one of today's vocabulary words in your sentence (such as: ${parsedWords.map(w => w.word).join(", ")}).`;
        } else {
          const hasCap = /^[A-Z]/.test(sentenceToCheck);
          const hasPunct = /[.!?]$/.test(sentenceToCheck);
          if (hasCap && hasPunct) {
            coachReply = `Excellent! "${sentenceToCheck}" is perfectly correct! Excellent job starting with a capital letter and ending with punctuation.`;
          } else {
            coachReply = `Your sentence is: "${sentenceToCheck}". Feedback:\n` +
              (!hasCap ? "- Start your sentence with a capital letter.\n" : "") +
              (!hasPunct ? "- End your sentence with punctuation (a period, exclamation point, or question mark).\n" : "");
          }
        }
      }
    } else {
      const wordInfo = parsedWords.find(w => w.word.toLowerCase() === targetWord.toLowerCase());
      if (wordInfo) {
        coachReply = `Explanation of "${wordInfo.word}":\n` +
          `- **Meaning**: ${wordInfo.meaning}\n` +
          `- **Example**: ${wordInfo.example}\n\n` +
          `Try making a sentence using "${wordInfo.word}" or practicing its pronunciation!`;
      } else {
        coachReply = `Which word from today's list would you like me to explain? Current words: ${parsedWords.map(w => w.word).join(", ")}`;
      }
    }

    newChat.push({ sender: "coach", text: coachReply });
    setVocabCoachChat(newChat);
  };

  // Initialize vocab states on load
  useEffect(() => {
    if (parsedWords.length > 0) {
      if (!sentenceState.targetWord) {
        setSentenceState(prev => ({ ...prev, targetWord: parsedWords[0].word }));
      }
      if (!pronounceState.targetWord) {
        setPronounceState(prev => ({ ...prev, targetWord: parsedWords[0].word }));
      }
      if (!quizState) {
        handleGenerateQuiz(parsedWords[0].word);
      }
    }
  }, [sectionData]);

  // Load activities when sectionData/dayNumber changes
  useEffect(() => {
    const isTimeTable = sectionData && (sectionData.heading.toLowerCase().includes("time table") || sectionData.heading.toLowerCase().includes("schedule"));
    if (isTimeTable && sectionData) {
      const customKey = `eng_custom_timetable_day_${dayNumber || 'general'}`;
      const stored = localStorage.getItem(customKey);
      let initialActivities: Activity[] = [];
      if (stored) {
        try {
          initialActivities = JSON.parse(stored);
        } catch (e) { }
      }
      if (initialActivities.length === 0) {
        initialActivities = parseTimetable(sectionData.body);
      }
      setActivities(initialActivities);
      setTempActivities(initialActivities);
    }
  }, [sectionData, dayNumber]);

  const handleSaveTimeTable = () => {
    if (!sectionData) return;
    const validated = tempActivities.map(a => ({
      ...a,
      duration: Math.max(1, Math.min(60, a.duration))
    }));
    setActivities(validated);
    setTempActivities(validated);
    setIsEditing(false);
    const customKey = `eng_custom_timetable_day_${dayNumber || 'general'}`;
    localStorage.setItem(customKey, JSON.stringify(validated));
  };

  const handleCancelEdit = () => {
    setTempActivities(activities);
    setIsEditing(false);
  };

  const handleResetDefault = () => {
    if (!sectionData) return;
    const defaultAct = parseTimetable(sectionData.body);
    setActivities(defaultAct);
    setTempActivities(defaultAct);
    setIsEditing(false);
    const customKey = `eng_custom_timetable_day_${dayNumber || 'general'}`;
    localStorage.removeItem(customKey);
  };

  const handleCheckHomework = async () => {
    if (!homeworkInput.trim() || !sectionData) return;
    const updates = { homework_written: true };
    const writtenUpdated = await homeworkService.updateProgress(sectionData.sourceId, updates);
    setHwProgress(writtenUpdated);

    const text = homeworkInput.trim();
    const sentences = text.split(/[.?!]|\n/).filter(s => s.trim().length > 0);
    const familyWords = ["mother", "father", "brother", "sister", "family", "parents", "grandmother", "grandfather"];
    const hasFamilyWord = familyWords.some(w => text.toLowerCase().includes(w));
    
    let match: "Good" | "Needs Practice" = "Needs Practice";
    let issueType = "No issue";
    let hinglishTip = "Great job!";
    
    if (text.length === 0) {
      issueType = "No homework written";
      hinglishTip = "Aapne kuch nahi likha hai. Kripya task ke anusar answer likhein.";
    } else if (sentences.length < 5) {
      issueType = "Less than 5 sentences";
      hinglishTip = `Aapne sirf ${sentences.length} sentence(s) likhe hain. Task ke anusar kam se kam 5 sentences likhne zaroori hain.`;
    } else if (!hasFamilyWord) {
      issueType = "Family topic not clear";
      hinglishTip = "Aapke answer mein family words (jaise mother, father) nahi hain. Kripya family topic par likhein.";
    } else {
      match = "Good";
      issueType = "Homework requirement matched";
      hinglishTip = "Bahut badiya! Aapne 5 sentences likhe hain aur rules follow kiye hain.";
    }
    
    setHwFeedback({ match, issueType, hinglishTip });
    
    const checkedUpdated = await homeworkService.updateProgress(sectionData.sourceId, { homework_checked: true });
    setHwProgress(checkedUpdated);
    checkAndTriggerHWCompletion(checkedUpdated);
  };

  const handleSaveHomework = async () => {
    if (!homeworkInput.trim() || !sectionData) return;
    const updates = { homework_saved: true, homeworkAnswerText: homeworkInput };
    const updated = await homeworkService.updateProgress(sectionData.sourceId, updates);
    setHwProgress(updated);
    checkAndTriggerHWCompletion(updated);
  };

  const handleSaveHWMistake = async () => {
    if (!hwFeedback || !sectionData) return;
    await mistakeService.saveMistake({
      wrongSentence: homeworkInput,
      correctSentence: "Target: 5 simple sentences about family using S+V+O.",
      simpleRule: hwFeedback.hinglishTip,
      sourceType: sectionData.practiceSourceType,
      sourceId: sectionData.sourceId,
      sourceTitle: sectionData.heading,
    });
    const updated = await homeworkService.updateProgress(sectionData.sourceId, { mistake_saved: true });
    setHwProgress(updated);
    checkAndTriggerHWCompletion(updated);
    alert("Mistake saved to Mistakes collection!");
  };

  const handleToggleSelfCheckItem = async (idx: number) => {
    if (!sectionData || !scProgress) return;
    const newChecked = { ...checkedItems, [idx]: !checkedItems[idx] };
    setCheckedItems(newChecked);
    const updated = await selfCheckService.updateProgress(sectionData.sourceId, { checked_items: newChecked, checklist_updated: true });
    setScProgress(updated);
    checkAndTriggerSCCompletion(updated);
  };

  const handleCheckLearning = async () => {
    if (!sectionData || !scProgress) return;
    const itemsCount = sectionData.body.split("\n").map(l => l.trim().replace(/^[•\-\*]\s*/, "")).filter(Boolean).length;
    const checkedCount = Object.values(checkedItems).filter(v => v).length;
    
    const updated = await selfCheckService.updateProgress(sectionData.sourceId, { self_check_checked: true });
    setScProgress(updated);
    
    if (checkedCount === 0) {
      setScFeedback({ match: "Needs Practice", issueType: "No items checked", hinglishTip: "Aapne ek bhi task verify nahi kiya. Kripya shuru se practice karein." });
    } else if (checkedCount < itemsCount) {
      setScFeedback({ match: "Needs Practice", issueType: "Incomplete checklist", hinglishTip: "Aapke kuch tasks abhi baaki hain. Un unchecked points ko wapas revise karein." });
    } else {
      setScFeedback({ match: "Good", issueType: "All checked", hinglishTip: "Bahut badhiya! Aapne saare tasks successfully verify kar liye hain." });
    }
    
    checkAndTriggerSCCompletion(updated);
  };

  const handleSaveSCMistake = async () => {
    if (!scFeedback || !sectionData) return;
    await mistakeService.saveMistake({
      wrongSentence: "Self Check: Need to revise unchecked checklist points.",
      correctSentence: "Target: Master all checklist items in this section.",
      simpleRule: scFeedback.hinglishTip,
      sourceType: sectionData.practiceSourceType,
      sourceId: sectionData.sourceId,
      sourceTitle: sectionData.heading,
    });
    const updated = await selfCheckService.updateProgress(sectionData.sourceId, { mistake_saved: true });
    setScProgress(updated);
    checkAndTriggerSCCompletion(updated);
    alert("Saved self check reminder to Mistakes collection!");
  };

  const handleSaveSCNote = async () => {
    if (!sectionData) return;
    await aiNotebookService.createNote({
      title: sectionData.heading,
      sourceType: sectionData.sourceType || "Daily Lesson",
      originalContent: `Self Check checklist:\n${sectionData.body}`,
      note: "Need to remember these self check points.",
    });
    const updated = await selfCheckService.updateProgress(sectionData.sourceId, { note_saved: true });
    setScProgress(updated);
    checkAndTriggerSCCompletion(updated);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const handleListenPreview = async () => {
    if (!sectionData || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(sectionData.body);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    const updated = await previewService.updateProgress(sectionData.sourceId, { preview_listened: true });
    setPrevProgress(updated);
    checkAndTriggerPreviewCompletion(updated);
  };

  const handlePrepareForDay3 = async () => {
    if (!sectionData) return;
    setIsPreparingDay3(true);
    const updated = await previewService.updateProgress(sectionData.sourceId, { preview_prepared: true });
    setPrevProgress(updated);
    checkAndTriggerPreviewCompletion(updated);
  };

  const handleSavePreviewNote = async () => {
    if (!sectionData) return;
    await aiNotebookService.createNote({
      title: sectionData.heading,
      sourceType: sectionData.sourceType || "Daily Lesson",
      originalContent: `Preview Text:\n${sectionData.body}`,
      note: "Need to remember to prepare for this.",
    });
    const updated = await previewService.updateProgress(sectionData.sourceId, { note_saved: true });
    setPrevProgress(updated);
    checkAndTriggerPreviewCompletion(updated);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const handleRepeatDrill = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Play TTS
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    setRepeatCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setDrillCompleted(true);
      }
      return next;
    });
  };

  const renderSectionContent = (heading: string, body: string) => {
    const h = heading.toLowerCase();

    // 1. Time Table
    if (h.includes("time table") || h.includes("schedule")) {
      const lines = body.split("\n").map(l => l.trim().replace(/^[•\-\*]\s*/, "")).filter(Boolean);
      return (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Lesson Schedule & Duration</p>
          <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-100 overflow-hidden">
            {lines.map((line, idx) => {
              const parts = line.split(/[—\-]/);
              const activity = parts[0]?.trim() || line;
              const duration = parts[1]?.trim() || "5 min";
              return (
                <div key={idx} className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 transition-colors">
                  <span className="text-sm font-semibold text-slate-700">{activity}</span>
                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2.5 py-1 rounded-lg">
                    {duration}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // 2. Vocabulary
    if (h.includes("vocab")) {
      const lines = body.split("\n").map(l => l.trim()).filter(Boolean);
      const rows = lines.map(line => line.split("|").map(c => c.trim()));
      const vocabRows = rows.filter(row => row.length >= 2 && row[0].toLowerCase() !== "word");

      return (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 text-xs font-black text-slate-500 uppercase tracking-wider">Word</th>
                  <th className="p-3 text-xs font-black text-slate-500 uppercase tracking-wider">Meaning</th>
                  <th className="p-3 text-xs font-black text-slate-500 uppercase tracking-wider">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {vocabRows.map((row, idx) => {
                  const word = row[0] || "";
                  const meaning = row[1] || "";
                  const example = row[2] || "";
                  return (
                    <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-3 font-bold text-indigo-600">{word}</td>
                      <td className="p-3 text-slate-700 font-medium">{meaning}</td>
                      <td className="p-3 text-slate-500 italic flex items-center justify-between gap-2">
                        <span>{example}</span>
                        {example && (
                          <button
                            onClick={() => handleListenPracticeLine(example)}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors shrink-0"
                            title="Listen"
                          >
                            <Volume2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // 3. Grammar
    if (h.includes("grammar") || h.includes("rule")) {
      const lines = body.split("\n").map(l => l.trim().replace(/^[•\-\*]\s*/, "")).filter(Boolean);
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {lines.map((line, idx) => {
            const parts = line.split(/[=:]/);
            const concept = parts[0]?.trim() || line;
            const explanation = parts[1]?.trim() || "";
            return (
              <div key={idx} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm/10 flex flex-col justify-between space-y-2">
                <span className="text-sm font-black text-slate-800">{concept}</span>
                {explanation && (
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100/30 px-2.5 py-1.5 rounded-lg inline-block self-start">
                    {explanation}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // 4. Examples / Make Sentences
    if (h.includes("example") || h.includes("make sentence")) {
      const lines = body.split("\n").map(l => l.trim().replace(/^\d+\.\s*/, "")).filter(Boolean);
      return (
        <div className="space-y-2.5">
          {lines.map((line, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm/10 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-extrabold text-slate-500">
                  {idx + 1}
                </span>
                <span className="text-sm font-bold text-slate-700">{line}</span>
              </div>
              <button
                onClick={() => handleListenPracticeLine(line)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Listen Example"
              >
                <Volume2 size={14} />
              </button>
            </div>
          ))}
        </div>
      );
    }

    // 5. Questions & Answers
    if (h.includes("question") || h.includes("q&a") || h.includes("answers")) {
      const lines = body.split("\n").map(l => l.trim()).filter(Boolean);
      const parsedQAs: Array<{ q: string; a: string; category: string }> = [];
      let currentCategoryName = "General Questions";
      let lastQuestion = "";

      for (const line of lines) {
        if (line.startsWith("[") && line.endsWith("]")) {
          currentCategoryName = line.slice(1, -1);
        } else if (line.toUpperCase().startsWith("Q:") || line.toUpperCase().startsWith("Q :")) {
          lastQuestion = line.replace(/^Q\s*:\s*/i, "").trim();
        } else if (line.toUpperCase().startsWith("A:") || line.toUpperCase().startsWith("A :")) {
          const ans = line.replace(/^A\s*:\s*/i, "").trim();
          if (lastQuestion) {
            parsedQAs.push({ q: lastQuestion, a: ans, category: currentCategoryName });
            lastQuestion = "";
          }
        }
      }

      // Combine parsed questions with generated extra questions
      const allQAs = [...parsedQAs, ...extraQuestions];

      if (allQAs.length === 0) {
        return (
          <div className="text-center py-8 text-slate-400 font-semibold text-sm bg-slate-50 border border-slate-100 rounded-xl">
            No questions found in this section.
          </div>
        );
      }

      // Ensure current index is within bounds
      const idx = Math.min(Math.max(0, currentQAIndex), allQAs.length - 1);
      const activeQA = allQAs[idx];

      const handleListenText = (text: string) => {
        if (typeof window === "undefined" || !window.speechSynthesis) {
          alert("Speech synthesis not supported.");
          return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
        void historyService.addEntry({
          type: "SECTION_LISTENED",
          title: "Used Q&A Audio Listening",
          description: `Listened to Q&A text pronunciation.`,
          dayNumber: dayNumber ? Number(dayNumber) : null,
        });
      };

      return (
        <div className="space-y-6">
          {/* Mode Switcher Banner */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setQaMode("practice")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-black rounded-lg transition-all ${
                qaMode === "practice"
                  ? "bg-white text-indigo-655 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles size={13} className="text-indigo-500" />
              Interactive AI Practice
            </button>
            <button
              onClick={() => {
                setQaMode("review");
                setQaChecklist(prev => ({ ...prev, readAll: true }));
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-black rounded-lg transition-all ${
                qaMode === "review"
                  ? "bg-white text-indigo-655 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen size={13} />
              Review Questions List
            </button>
          </div>

          {qaMode === "review" ? (
            /* CLEAN REVIEW LIST VIEW */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Today's Q&A List</span>
                <span className="text-xs font-bold text-slate-400">Total: {allQAs.length} questions</span>
              </div>
              <div className="space-y-2 bg-white rounded-2xl border border-slate-150 p-3.5 shadow-sm/10">
                {allQAs.map((qa, qaIdx) => {
                  const isOpen = activeQAIndex === qaIdx;
                  return (
                    <div key={qaIdx} className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/20 transition-all hover:bg-slate-50/40">
                      <button
                        onClick={() => setActiveQAIndex(isOpen ? null : qaIdx)}
                        className="w-full flex items-center justify-between p-3.5 text-left font-bold text-slate-700 text-xs md:text-sm transition-colors"
                      >
                        <span className="flex items-start gap-2 pr-4">
                          <span className="text-indigo-500 font-extrabold shrink-0 mt-0.5">Q:</span>
                          <span>{qa.q}</span>
                        </span>
                        <span className="text-xs text-indigo-500 font-black shrink-0 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100/50 px-2 py-1 rounded-lg">
                          {isOpen ? "Hide Answer" : "Show Answer"}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="p-4 bg-indigo-50/10 border-t border-slate-100 text-xs md:text-sm text-slate-600 font-semibold flex items-center justify-between gap-3 animate-slide-down">
                          <span className="text-emerald-700 flex items-start gap-2">
                            <span className="text-emerald-600 font-extrabold shrink-0 mt-0.5">A:</span>
                            <span>{qa.a}</span>
                          </span>
                          <button
                            onClick={() => {
                              handleListenText(qa.a);
                              setQaChecklist(prev => ({ ...prev, listenAnswers: true }));
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 border border-slate-100/40 transition-colors shadow-sm bg-white"
                            title="Listen pronunciation"
                          >
                            <Volume2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* INTERACTIVE AI PRACTICE MODE */
            <div className="space-y-6">
              {/* Question card */}
              <Card className="border border-slate-200/80 p-5 md:p-6 space-y-4 bg-white rounded-2xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white px-3 py-1 rounded-bl-xl text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 shadow-sm">
                  <Sparkles size={11} /> {activeQA.category || "Q&A Practice"}
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wide">
                    <span>Question {idx + 1} of {allQAs.length}</span>
                    {idx >= parsedQAs.length && (
                      <span className="text-indigo-600 font-black lowercase bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">Extra Practice</span>
                    )}
                  </div>
                  <h3 className="text-base md:text-lg font-extrabold text-slate-800 leading-snug">
                    {activeQA.q}
                  </h3>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleListenText(activeQA.q)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-750 border border-indigo-100/60 rounded-xl hover:bg-indigo-100 transition-colors shadow-sm/5"
                    >
                      <Volume2 size={13} /> Listen Question
                    </button>
                  </div>
                </div>

                {/* Input area */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">Your Answer</label>
                    <span className="text-[10px] text-slate-450 font-medium">Type or speak your response</span>
                  </div>
                  <textarea
                    rows={3}
                    value={userQAAnswer}
                    onChange={(e) => setUserQAAnswer(e.target.value)}
                    placeholder="Try to answer in a full sentence. For example: 'I wake up at 6 AM.'"
                    className="w-full text-sm p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans leading-relaxed text-slate-700 resize-none bg-slate-50/10 placeholder-slate-400/80"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleStartQASpeak}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl border transition-all shadow-sm ${
                          isQAListening
                            ? "bg-rose-600 border-rose-600 text-white animate-pulse"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                        }`}
                      >
                        <Mic size={14} className={isQAListening ? "animate-bounce" : "text-rose-500"} />
                        {isQAListening ? "Listening..." : "Speak Answer"}
                      </button>
                      <button
                        onClick={() => {
                          setUserQAAnswer("");
                          setQaFeedback(null);
                          setShowSamples(false);
                        }}
                        className="px-3 py-2 text-xs font-bold bg-white text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all hover:text-slate-800 shadow-sm"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowSamples(!showSamples)}
                        className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all shadow-sm ${
                          showSamples
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                        }`}
                      >
                        {showSamples ? "Hide Answer" : "Show Answer"}
                      </button>
                      <button
                        onClick={() => handleCheckQAAnswer(activeQA.q, activeQA.a)}
                        disabled={isQAChecking || !userQAAnswer.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold bg-indigo-600 border border-indigo-650 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-sm hover:shadow"
                      >
                        {isQAChecking ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" /> Checking...
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} /> Check Answer
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sample Answers Box */}
                {showSamples && (
                  <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 space-y-3 animate-slide-down">
                    <span className="text-[10px] font-black text-amber-800 uppercase tracking-wide flex items-center gap-1">
                      <Lightbulb size={12} className="text-amber-500" /> Model Practice Answers
                    </span>
                    <div className="grid gap-2 text-xs md:text-sm">
                      {(() => {
                        const samples = getSampleAnswers(activeQA.q, activeQA.a);
                        return (
                          <>
                            <div className="flex items-start justify-between bg-white border border-amber-100/50 p-2.5 rounded-lg gap-2 shadow-sm/10">
                              <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide block mb-0.5">Simple (Standard)</span>
                                <p className="font-bold text-slate-700">{samples.simple}</p>
                              </div>
                              <button
                                onClick={() => handleListenText(samples.simple)}
                                className="p-1 rounded text-slate-400 hover:text-indigo-650 hover:bg-indigo-50/50 transition-colors"
                              >
                                <Volume2 size={13} />
                              </button>
                            </div>
                            <div className="flex items-start justify-between bg-white border border-amber-100/50 p-2.5 rounded-lg gap-2 shadow-sm/10">
                              <div>
                                <span className="text-[10px] font-black text-indigo-550 uppercase tracking-wide block mb-0.5">Better (More Structured)</span>
                                <p className="font-bold text-indigo-700">{samples.better}</p>
                              </div>
                              <button
                                onClick={() => handleListenText(samples.better)}
                                className="p-1 rounded text-slate-400 hover:text-indigo-650 hover:bg-indigo-50/50 transition-colors"
                              >
                                <Volume2 size={13} />
                              </button>
                            </div>
                            <div className="flex items-start justify-between bg-white border border-amber-100/50 p-2.5 rounded-lg gap-2 shadow-sm/10">
                              <div>
                                <span className="text-[10px] font-black text-emerald-550 uppercase tracking-wide block mb-0.5">Natural (Native Fluency)</span>
                                <p className="font-bold text-emerald-700">{samples.natural}</p>
                              </div>
                              <button
                                onClick={() => handleListenText(samples.natural)}
                                className="p-1 rounded text-slate-400 hover:text-indigo-650 hover:bg-indigo-50/50 transition-colors"
                              >
                                <Volume2 size={13} />
                              </button>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Feedback Panel */}
                {qaFeedback && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4 animate-slide-down">
                    <div className="flex flex-wrap items-center justify-between border-b border-slate-200/60 pb-3 gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-md border ${
                          qaFeedback.score >= 90
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : qaFeedback.score >= 80
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                            : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}>
                          Score: {Math.round(qaFeedback.score / 10)}/10
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Mock AI Assessment</span>
                      </div>
                      
                      {qaFeedback.mistakeType !== "none" && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-50 border border-rose-250 text-rose-600">
                          {qaFeedback.mistakeType} mistake flagged
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 text-xs md:text-sm">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Your Response:</span>
                        <p className="font-semibold text-slate-700 bg-white border border-slate-100 p-2.5 rounded-lg leading-relaxed">{userQAAnswer}</p>
                      </div>

                      {qaFeedback.correctedAnswer !== userQAAnswer && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider block">Corrected Response:</span>
                          <p className="font-bold text-emerald-700 bg-emerald-50/30 border border-emerald-100 p-2.5 rounded-lg leading-relaxed flex items-center justify-between gap-3">
                            <span>{qaFeedback.correctedAnswer}</span>
                            <button
                              onClick={() => handleListenText(qaFeedback.correctedAnswer)}
                              className="p-1 rounded hover:bg-emerald-50 text-emerald-600 transition-colors"
                            >
                              <Volume2 size={13} />
                            </button>
                          </p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider block">How a Native Speaker would say it:</span>
                        <p className="font-bold text-indigo-700 bg-indigo-50/30 border border-indigo-100 p-2.5 rounded-lg leading-relaxed flex items-center justify-between gap-3">
                          <span>{qaFeedback.naturalAnswer}</span>
                          <button
                            onClick={() => handleListenText(qaFeedback.naturalAnswer)}
                            className="p-1 rounded hover:bg-indigo-50 text-indigo-650 transition-colors"
                          >
                            <Volume2 size={13} />
                          </button>
                        </p>
                      </div>

                      <div className="bg-white border border-slate-150 rounded-xl p-3.5 space-y-1 leading-relaxed">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Hinglish Explanation:</span>
                        <p className="text-slate-650 font-bold text-xs">{qaFeedback.hinglishExplanation}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-200/60">
                      <button
                        onClick={() => {
                          setUserQAAnswer("");
                          setQaFeedback(null);
                          setShowSamples(false);
                        }}
                        className="px-3.5 py-2 text-xs font-extrabold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm/5 flex items-center gap-1.5"
                      >
                        <RefreshCw size={13} /> Try Again
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveQANote(activeQA.q, activeQA.a)}
                          className="px-3.5 py-2 text-xs font-extrabold bg-indigo-50 border border-indigo-200/60 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <Save size={13} /> Save Note
                        </button>
                        {qaFeedback.score < 85 ? (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
                            ⚠️ Save Mistake (Auto ✓)
                          </span>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-2 text-[10px] font-bold bg-white text-slate-300 border border-slate-100 rounded-xl cursor-not-allowed"
                          >
                            Save Mistake (Score &ge; 8)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Navigation and generation controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentQAIndex === 0}
                    onClick={() => {
                      setCurrentQAIndex(prev => prev - 1);
                      setQaFeedback(null);
                      setUserQAAnswer("");
                      setShowSamples(false);
                    }}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm"
                  >
                    <ArrowLeft size={13} /> Prev
                  </button>
                  <button
                    disabled={currentQAIndex === allQAs.length - 1}
                    onClick={() => {
                      setCurrentQAIndex(prev => prev + 1);
                      setQaFeedback(null);
                      setUserQAAnswer("");
                      setShowSamples(false);
                    }}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm"
                  >
                    Next <ArrowRight size={13} />
                  </button>
                </div>

                <button
                  onClick={handleGenerateExtraQuestions}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-all shadow-sm"
                >
                  <Sparkles size={13} /> Generate More Practice Questions
                </button>
              </div>

              {/* Extra Practice Area (Collapsible) */}
              {extraQuestions.length > 0 && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm mt-4">
                  <button
                    onClick={() => setShowExtraCollapsible(!showExtraCollapsible)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
                  >
                    <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-500 animate-pulse" />
                      Extra Practice Questions ({extraQuestions.length})
                    </span>
                    <span className="text-xs font-bold text-indigo-650">
                      {showExtraCollapsible ? "Hide" : "Show"}
                    </span>
                  </button>
                  {showExtraCollapsible && (
                    <div className="p-4 border-t border-slate-100 bg-white space-y-2.5">
                      <p className="text-[11px] text-slate-400 font-semibold">
                        Click any question below to load it into the active tutor card for practice:
                      </p>
                      <div className="grid gap-2">
                        {extraQuestions.map((eq, eqIdx) => {
                          const targetIdx = parsedQAs.length + eqIdx;
                          const isActive = currentQAIndex === targetIdx;
                          return (
                            <button
                              key={eqIdx}
                              onClick={() => {
                                setCurrentQAIndex(targetIdx);
                                setQaFeedback(null);
                                setUserQAAnswer("");
                                setShowSamples(false);
                              }}
                              className={`w-full text-left p-3 text-xs rounded-xl font-bold transition-all border ${
                                isActive
                                  ? "bg-indigo-50/30 border-indigo-200 text-indigo-700 font-extrabold"
                                  : "bg-slate-50/30 border-slate-100 text-slate-650 hover:bg-slate-50"
                              }`}
                            >
                              <span className="text-[10px] font-black uppercase text-indigo-500 block mb-0.5">
                                Question {parsedQAs.length + eqIdx + 1}: {eq.category}
                              </span>
                              <span>{eq.q}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mark Section Complete Button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100 mt-6">
                <Button
                  onClick={handleMarkComplete}
                  className="flex-1 flex items-center justify-center gap-2"
                  variant={progress?.completed ? "secondary" : "primary"}
                >
                  {progress?.completed ? (
                    <>
                      <CheckCircle className="text-emerald-500 h-5 w-5" />
                      Section Completed ✓
                    </>
                  ) : (
                    "Mark Section Complete"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 6. Speaking Drill
    if (h.includes("speaking drill") || h.includes("speaking")) {
      const sentences = body.split(/[.!?\n]/).map(s => s.trim()).filter(Boolean);
      const targetLine = sentences[0] || body;
      return (
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Practice Text</span>
            <p className="text-sm font-bold text-slate-800 leading-relaxed italic">
              &ldquo;{body}&rdquo;
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-50">
            <button
              onClick={() => handleListenPracticeLine(body)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              <Volume2 size={14} /> Listen
            </button>
            <button
              onClick={() => setActiveTab("speak")}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              <Mic size={14} /> Speak / Record Answer
            </button>
            <button
              onClick={() => handleRepeatDrill(targetLine)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all border ${drillCompleted
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
            >
              Repeat 5 Times ({repeatCount}/5)
            </button>
          </div>
          {drillCompleted && (
            <p className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg p-2 text-center animate-pulse">
              🎉 Awesome job! You completed the repetition drill!
            </p>
          )}
        </div>
      );
    }

    // 7. Mini Conversation
    if (h.includes("conversation")) {
      const lines = body.split("\n").map(l => l.trim()).filter(Boolean);
      const chat: Array<{ sender: "A" | "B"; text: string }> = [];
      for (const line of lines) {
        const match = line.match(/^([AB])\s*:\s*(.*)$/i);
        if (match) {
          chat.push({ sender: match[1].toUpperCase() as "A" | "B", text: match[2].trim() });
        }
      }

      return (
        <div className="space-y-5 max-w-md mx-auto p-2">
          {/* Conversation bubbles */}
          <div className="space-y-4">
            {chat.map((c, idx) => {
              const isMe = c.sender === "B";
              return (
                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex flex-col space-y-1 max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{c.sender}</span>
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed font-bold shadow-sm/10 flex items-center justify-between gap-3 ${isMe
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                      }`}>
                      <span>{c.text}</span>
                      <button
                        onClick={() => handleListenPracticeLine(c.text)}
                        className={`p-0.5 rounded-lg transition-colors ${isMe ? 'text-indigo-200 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                          }`}
                      >
                        <Volume2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            {/* Listen whole conversation */}
            <button
              onClick={() => handleListenPracticeLine(body)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all shadow-sm w-full justify-center"
            >
              <Volume2 size={14} /> Listen Conversation
            </button>

            {/* Input area */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Your Reply</label>
              
              <div className="flex flex-col gap-2">
                {recognition && (
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={handleToggleRecordingConv}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${isRecordingConv
                        ? "bg-rose-500 text-white border-rose-500 animate-pulse"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      <Mic size={14} />
                      {isRecordingConv ? "Listening... Click to Stop" : "Speak / Record Reply"}
                    </button>
                    {isRecordingConv && (
                      <span className="text-xs text-rose-500 font-semibold animate-pulse">Recording reply...</span>
                    )}
                  </div>
                )}
                
                <textarea
                  rows={3}
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans leading-relaxed text-slate-700 resize-y placeholder-slate-400 min-h-[90px]"
                  placeholder="Type or speak your reply to the conversation..."
                  value={convReply}
                  onChange={(e) => setConvReply(e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCheckConversation}
                disabled={checkingConv || !convReply.trim()}
                className="flex-1 justify-center text-xs font-bold py-2.5"
              >
                {checkingConv ? (
                  <>
                    <RefreshCw size={14} className="animate-spin mr-1.5" /> Checking...
                  </>
                ) : (
                  "Check with AI"
                )}
              </Button>

              <button
                onClick={() => {
                  setConvReply("");
                  setConvFeedback(null);
                  setConvMistakeSaved(false);
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-all"
              >
                Try Again
              </button>
            </div>

            {/* Feedback details */}
            {convFeedback && (
              <div className="border border-indigo-100 rounded-2xl p-4 bg-indigo-50/10 space-y-3.5 text-xs md:text-sm animate-fade-in font-sans">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/50">
                    Mock AI Feedback — based on your typed/spoken reply text only.
                  </span>
                  
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                    convFeedback.status === "Good" 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {convFeedback.status}
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/50 p-4 space-y-3">
                  <div>
                    <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider block">Your Reply</span>
                    <p className="text-slate-700 font-medium mt-0.5 italic">&ldquo;{convFeedback.userReply}&rdquo;</p>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <span className="font-bold text-[10px] uppercase text-emerald-600 tracking-wider block font-semibold">Better Reply</span>
                    <p className="text-emerald-700 font-semibold mt-0.5">&ldquo;{convFeedback.betterReply}&rdquo;</p>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <span className="font-bold text-[10px] uppercase text-rose-500 tracking-wider block font-semibold">Mistake</span>
                    <p className="text-rose-600 font-semibold mt-0.5">{convFeedback.mistake}</p>
                  </div>

                  <div className="border-t border-slate-100 pt-3 bg-slate-50/50 p-3 rounded-lg">
                    <span className="font-bold text-[10px] uppercase text-indigo-500 tracking-wider block font-semibold">Hinglish Explanation</span>
                    <p className="text-slate-700 font-medium mt-0.5 leading-relaxed">{convFeedback.hinglishExplanation}</p>
                  </div>

                  <div className="pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSaveConvMistake}
                      disabled={convMistakeSaved}
                      className="w-full justify-center"
                    >
                      {convMistakeSaved ? "Mistake Saved ✓" : "Save Mistake"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 8. Pronunciation Drill
    if (h.includes("pronun")) {
      const words = body.split(/[,;\s]+/).map(w => w.trim()).filter(Boolean);
      return (
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Click a pill to hear its pronunciation</p>
          <div className="flex flex-wrap gap-2">
            {words.map((w, idx) => (
              <button
                key={idx}
                onClick={() => handleListenPracticeLine(w)}
                className="flex items-center gap-1 bg-slate-50 border border-slate-200 hover:bg-indigo-50/50 hover:border-indigo-200 hover:text-indigo-600 px-3.5 py-2 text-sm font-bold text-slate-600 rounded-full transition-all shadow-sm/10"
              >
                {w} <Volume2 size={13} className="text-slate-400" />
              </button>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-50">
            <button
              onClick={() => setActiveTab("speak")}
              className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm"
            >
              <Mic size={14} /> Practice Pronunciation
            </button>
          </div>
        </div>
      );
    }

    // 9. Common Mistakes
    if (h.includes("mistake")) {
      const lines = body.split("\n").map(l => l.trim()).filter(Boolean);
      const mistakesList: Array<{ wrong: string; correct: string; rule?: string }> = [];
      let currentMistake: Partial<typeof mistakesList[0]> = {};

      for (const line of lines) {
        if (line.toLowerCase().startsWith("wrong:")) {
          currentMistake.wrong = line.replace(/^wrong\s*:\s*/i, "").trim();
        } else if (line.toLowerCase().startsWith("correct:")) {
          currentMistake.correct = line.replace(/^correct\s*:\s*/i, "").trim();
        } else if (line.toLowerCase().startsWith("rule:")) {
          currentMistake.rule = line.replace(/^rule\s*:\s*/i, "").trim();
          if (currentMistake.wrong && currentMistake.correct) {
            mistakesList.push(currentMistake as any);
            currentMistake = {};
          }
        }
      }
      if (currentMistake.wrong && currentMistake.correct) {
        mistakesList.push(currentMistake as any);
      }

      const handlePracticeMistake = (wrongText: string) => {
        setWriteInput(wrongText);
        setActiveTab("write");
      };

      return (
        <div className="space-y-4">
          {mistakesList.map((m, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="bg-rose-50/50 border border-rose-100/50 rounded-lg p-3 text-sm flex items-start gap-2.5">
                  <span className="text-rose-500 font-extrabold text-xs mt-0.5">Wrong:</span>
                  <span className="font-bold text-rose-700 line-through">{m.wrong}</span>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-lg p-3 text-sm flex items-start gap-2.5">
                  <span className="text-emerald-500 font-extrabold text-xs mt-0.5">Correct:</span>
                  <span className="font-bold text-emerald-700">{m.correct}</span>
                </div>
              </div>
              {m.rule && (
                <div className="text-xs bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-slate-600 font-semibold leading-relaxed">
                  💡 Rule: {m.rule}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={() => handlePracticeMistake(m.wrong)}
                  className="flex items-center gap-1 text-[10px] font-black text-indigo-600 hover:text-indigo-700 border border-indigo-100 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <PenTool size={11} /> Practice This Mistake
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // 10. Homework
    if (h.includes("homework")) {
      return (
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Homework Task</span>
            <p className="text-sm font-bold text-slate-800 leading-relaxed">
              {body}
            </p>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-50">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Write your homework here...</label>
            <textarea
              rows={4}
              value={homeworkInput}
              onChange={(e) => setHomeworkInput(e.target.value)}
              placeholder="Type your homework answer here..."
              className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans leading-relaxed text-slate-700 resize-y"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSaveHomework}
                disabled={!homeworkInput.trim() || homeworkSaved}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm ${homeworkSaved
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                    : "bg-indigo-600 border border-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  }`}
              >
                {homeworkSaved ? "Homework Saved ✓" : "Save Homework"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 11. Self Check
    if (h.includes("self check") || h.includes("self-check")) {
      const items = body.split("\n").map(l => l.trim().replace(/^[•\-\*]\s*/, "")).filter(Boolean);
      const toggleItem = (idx: number) => {
        setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
      };

      return (
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Complete the checklist below to verify your learning</p>
          <div className="space-y-2.5">
            {items.map((item, idx) => {
              const isChecked = !!checkedItems[idx];
              return (
                <button
                  key={idx}
                  onClick={() => toggleItem(idx)}
                  className={`w-full flex items-center gap-3 p-3 border rounded-xl text-left transition-all ${isChecked
                      ? "bg-emerald-50/50 border-emerald-200/50 text-emerald-800 font-bold"
                      : "bg-slate-50/30 border-slate-100 text-slate-700 hover:bg-slate-50 font-bold"
                    }`}
                >
                  <span className={`h-5 w-5 rounded-md flex items-center justify-center border transition-all ${isChecked ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-white"
                    }`}>
                    {isChecked && <Check size={12} className="stroke-[3]" />}
                  </span>
                  <span className="text-sm">{item}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }



    // Default
    return (
      <pre className="whitespace-pre-wrap break-words font-sans text-sm md:text-base leading-relaxed text-slate-700">
        {body}
      </pre>
    );
  };

  useEffect(() => {
    if (sectionData) {
      setIsBookmarked(learnerInsightsService.isBookmarked(window.location.pathname));
    }
  }, [sectionData]);

  const onToggleBookmark = () => {
    if (!sectionData) return;
    const path = window.location.pathname;
    const allBookmarks = learnerInsightsService.getBookmarks();
    const existing = allBookmarks.find(b => b.routePath === path);
    if (existing) {
      learnerInsightsService.removeBookmark(existing.id);
      setIsBookmarked(false);
    } else {
      learnerInsightsService.addBookmark(
        "section",
        `${sectionData.parentTitle} — ${sectionData.heading}`,
        path
      );
      setIsBookmarked(true);
    }
  };

  const handleSaveSentence = () => {
    if (!diffSentence.trim() || !sectionData) return;
    learnerInsightsService.addSavedSentence(
      diffSentence.trim(),
      diffMeaning.trim() || "N/A",
      `${sectionData.parentTitle} — ${sectionData.heading}`,
      window.location.pathname
    );
    setSentenceSaved(true);
    setDiffSentence("");
    setDiffMeaning("");
    setTimeout(() => setSentenceSaved(false), 2000);
  };

  // Q&A AI Tutor Helpers
  const handleStartQASpeak = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your answer.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsQAListening(true);

    recognition.onresult = async (event: any) => {
      const spokenText = event.results[0][0].transcript;
      setUserQAAnswer(prev => {
        const space = prev ? " " : "";
        return prev + space + spokenText;
      });
      setQaChecklist(prev => ({ ...prev, listenAnswers: true }));
      try {
        await historyService.addEntry({
          type: "SECTION_SPEAKING_CHECKED",
          title: "Attempted Q&A Speaking",
          description: "Used browser speech recognition to speak response.",
          dayNumber: dayNumber ? Number(dayNumber) : null,
        });
      } catch (err) {
        console.error(err);
      }
    };

    recognition.onend = () => {
      setIsQAListening(false);
    };

    recognition.onerror = (e: any) => {
      console.error("Q&A Speech recognition error:", e);
      setIsQAListening(false);
    };

    recognition.start();
  };

  const handleCheckQAAnswer = async (questionText: string, expectedAnswer: string) => {
    const input = userQAAnswer.trim();
    if (!input) {
      alert("Please write or speak an answer first.");
      return;
    }

    setIsQAChecking(true);
    await new Promise(r => setTimeout(r, 800));

    const clean = (str: string) => str.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
    const inputClean = clean(input);
    const expectedClean = clean(expectedAnswer);

    let score = 100;
    let mistakeType: "grammar" | "vocabulary" | "punctuation" | "none" = "none";
    let correctedAnswer = input;
    let naturalAnswer = expectedAnswer;
    let hinglishExplanation = "";
    let rule = "";

    const words = input.split(/\s+/).filter(Boolean);
    if (words.length < 3) {
      score = 70;
      mistakeType = "vocabulary";
      correctedAnswer = expectedAnswer;
      hinglishExplanation = "Aapka answer thoda chota hai. Hamesha complete sentence me answer dene ki koshish karein, jaise '" + expectedAnswer + "'.";
    } else {
      let formattingIssues = false;
      if (input[0] !== input[0].toUpperCase()) {
        correctedAnswer = correctedAnswer[0].toUpperCase() + correctedAnswer.slice(1);
        score -= 10;
        formattingIssues = true;
      }
      if (!/[.!?]$/.test(input)) {
        correctedAnswer = correctedAnswer + ".";
        score -= 10;
        formattingIssues = true;
      }
      if (formattingIssues) {
        mistakeType = "punctuation";
        hinglishExplanation = "Sentence ka pehla letter capital hona chahiye aur end me period (.) hona chahiye.";
      }

      const lowercaseInput = input.toLowerCase();
      let grammarIssue = false;

      if (lowercaseInput.includes("go to home")) {
        correctedAnswer = correctedAnswer.replace(/go to home/i, "go home");
        score -= 20;
        grammarIssue = true;
        rule = "go home";
        hinglishExplanation = "'go to home' grammatically galat hai. English me direct 'go home' bolte hain, 'to' preposition ki jarurat nahi hoti.";
      } else if (lowercaseInput.includes("in sunday") || lowercaseInput.includes("in monday")) {
        correctedAnswer = correctedAnswer.replace(/in (sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i, (m) => m.replace(/in/i, "on"));
        score -= 20;
        grammarIssue = true;
        rule = "preposition with days";
        hinglishExplanation = "Days ke saath 'on' use hota hai (jaise: on Sunday), 'in' nahi.";
      } else if (lowercaseInput.includes("at the room")) {
        correctedAnswer = correctedAnswer.replace(/at the room/i, "in the room");
        score -= 25;
        grammarIssue = true;
        rule = "preposition of place";
        hinglishExplanation = "Enclosed spaces (jaise: room) ke liye 'in' ka use hota hai, 'at' ka nahi.";
      } else if (lowercaseInput.includes("am wake") || lowercaseInput.includes("am go")) {
        correctedAnswer = correctedAnswer.replace(/am wake/i, "wake").replace(/am go/i, "go");
        score -= 25;
        grammarIssue = true;
        rule = "unnecessary auxiliary verb";
        hinglishExplanation = "Present simple tense me action verb ke saath 'am' nahi lagate. Simple bolein: 'I wake up' ya 'I go'.";
      } else if (lowercaseInput.includes("she start") || lowercaseInput.includes("he wake")) {
        correctedAnswer = correctedAnswer.replace(/she start/i, "she starts").replace(/he wake/i, "he wakes");
        score -= 20;
        grammarIssue = true;
        rule = "subject-verb agreement";
        hinglishExplanation = "Third-person singular (he, she, it) ke saath present simple me verb ke aage 's' lagta hai (jaise: starts, wakes).";
      }

      if (grammarIssue) {
        mistakeType = "grammar";
      } else if (!formattingIssues) {
        if (inputClean === expectedClean) {
          score = 100;
          hinglishExplanation = "Bilkul sahi jawab! Aapka sentence structure aur grammar bilkul perfect hai.";
        } else {
          score = Math.max(85, Math.floor(85 + Math.random() * 10));
          hinglishExplanation = "Great job! Aapka sentence grammatically correct hai. Aap practice ke liye sample options dekh sakte hain.";
        }
      }
    }

    const questionLower = questionText.toLowerCase();
    if (questionLower.includes("wake up")) {
      naturalAnswer = "I generally get out of bed around 6 AM to start my day early.";
    } else if (questionLower.includes("drink tea")) {
      naturalAnswer = "I usually start my day with a warm cup of tea every morning.";
    } else if (questionLower.includes("go to office")) {
      naturalAnswer = "I usually commute to work by bus.";
    } else if (questionLower.includes("start her study")) {
      naturalAnswer = "She hits the books around 9 in the morning.";
    } else if (questionLower.includes("have dinner")) {
      naturalAnswer = "I usually sit down for dinner around 8 PM.";
    } else if (questionLower.includes("watch tv")) {
      naturalAnswer = "Yeah, I usually tune into the news channel in the evening.";
    } else if (questionLower.includes("sleep late") || questionLower.includes("early on sunday")) {
      naturalAnswer = "Not really, I love sleeping in on Sunday mornings.";
    } else {
      naturalAnswer = "Honestly, " + expectedAnswer.charAt(0).toLowerCase() + expectedAnswer.slice(1);
    }

    if (score < 85) {
      try {
        await mistakeService.saveMistake({
          sourceType: sectionData?.practiceSourceType || "DAILY_LESSON",
          sourceId: sectionData?.sourceId || "day_" + dayNumber,
          sourceTitle: sectionData?.heading || "Questions & Answers",
          wrongSentence: input,
          correctSentence: correctedAnswer,
          simpleRule: rule ? `${rule}. Hint: ${hinglishExplanation}` : `Grammar error. Hint: ${hinglishExplanation}`,
          mistakeType: "grammar"
        });
        setQaMistakesCount(prev => prev + 1);
        setQaChecklist(prev => ({ ...prev, saveItem: true }));
        await historyService.addEntry({
          type: "MISTAKE_SAVED",
          title: "Logged Q&A Mistake",
          description: `Mistake auto-saved to study list: "${input.slice(0, 30)}..."`,
          dayNumber: dayNumber ? Number(dayNumber) : null,
        });
      } catch (err) {
        console.error("Error saving QA mistake:", err);
      }
    }

    setQaFeedback({
      score,
      correctedAnswer,
      naturalAnswer,
      hinglishExplanation,
      mistakeType
    });
    setQaChecklist(prev => ({ ...prev, checkAnswer: true }));
    setIsQAChecking(false);

    await historyService.addEntry({
      type: "ANSWER_CHECKED",
      title: "Checked Q&A Answer",
      description: `Checked answer for "${questionText.slice(0, 30)}..." with score ${Math.round(score / 10)}/10.`,
      dayNumber: dayNumber ? Number(dayNumber) : null,
    });
  };

  const handleSaveQANote = async (questionText: string, expectedAnswer: string) => {
    if (!userQAAnswer.trim()) return;
    try {
      await aiNotebookService.createNote({
        title: `Q&A Note: ${questionText.slice(0, 30)}${questionText.length > 30 ? "..." : ""}`,
        sourceType: sectionData?.sourceType || "Daily Lesson",
        originalContent: `Question: ${questionText}\nMy Answer: ${userQAAnswer}\nFeedback Corrected: ${qaFeedback?.correctedAnswer || "N/A"}\nModel Answer: ${expectedAnswer}`,
        tags: ["qa-notes", sectionData?.moduleKey || "daily-lesson", `section-${sectionId}`].filter(Boolean)
      });
      setQaNotesCount(prev => prev + 1);
      setQaChecklist(prev => ({ ...prev, saveItem: true }));
      await historyService.addEntry({
        type: "SECTION_NOTE_SAVED",
        title: "Saved Q&A Study Note",
        description: `Saved note for: "${questionText.slice(0, 30)}..."`,
        dayNumber: dayNumber ? Number(dayNumber) : null,
      });
      alert("Successfully saved note to AI Notebook!");
    } catch (e) {
      console.error(e);
      alert("Failed to save note.");
    }
  };

  const handleGenerateExtraQuestions = () => {
    const list = [
      { q: "What do you eat for breakfast?", a: "I usually eat cereal and fruits for breakfast.", category: "Morning Routine" },
      { q: "What time do you sleep at night?", a: "I go to bed around 10 PM.", category: "Evening Routine" },
      { q: "Do you go for a walk in the morning?", a: "Yes, I go for a short walk every morning.", category: "Morning Routine" },
      { q: "How do you spend your Sunday afternoon?", a: "I spend Sunday afternoon relaxing or watching a movie.", category: "Weekend" }
    ];
    setExtraQuestions(list);
    alert("Generated 4 extra practice questions based on today's topics!");
  };

  const getSampleAnswers = (questionText: string, expectedAnswer: string) => {
    const q = questionText.toLowerCase();
    if (q.includes("wake up")) {
      return {
        simple: "I wake up at 6 AM.",
        better: "I usually wake up around 6:00 in the morning.",
        natural: "I generally get out of bed around 6 AM to start my day early."
      };
    }
    if (q.includes("drink tea")) {
      return {
        simple: "I drink tea every morning.",
        better: "I prefer drinking hot tea in the morning.",
        natural: "I usually start my day with a warm cup of tea."
      };
    }
    if (q.includes("go to office")) {
      return {
        simple: "I go to office by bus.",
        better: "I travel to my office by taking the public bus.",
        natural: "I usually commute to work by bus."
      };
    }
    if (q.includes("start her study")) {
      return {
        simple: "She starts her study at 9 AM.",
        better: "She begins studying at 9:00 AM every day.",
        natural: "She usually hits the books around 9 in the morning."
      };
    }
    if (q.includes("have dinner")) {
      return {
        simple: "I have dinner at 8 PM.",
        better: "I eat my dinner around 8:00 in the evening.",
        natural: "I usually sit down for dinner around 8 PM."
      };
    }
    if (q.includes("watch tv")) {
      return {
        simple: "Yes, I watch news in the evening.",
        better: "Yes, I watch the evening news on television.",
        natural: "Yeah, I usually tune into the news channel in the evening."
      };
    }
    if (q.includes("sleep late") || q.includes("early on sunday")) {
      return {
        simple: "No, I sleep late on Sunday.",
        better: "No, I prefer to sleep in on Sundays.",
        natural: "Not really, I love sleeping in on Sunday mornings."
      };
    }
    return {
      simple: expectedAnswer,
      better: "Actually, " + expectedAnswer.charAt(0).toLowerCase() + expectedAnswer.slice(1),
      natural: "To be honest, " + expectedAnswer.charAt(0).toLowerCase() + expectedAnswer.slice(1)
    };
  };

  // Load Section Progress
  useEffect(() => {
    const sData = sectionData;
    if (!sData) return;
    const sId = sData.sourceId;
    const pType = sData.practiceSourceType;
    const heading = sData.heading;
    const parentTitle = sData.parentTitle;

    async function loadProgress() {
      try {
        const curProgress = await sectionProgressService.getProgress(sId, pType);

        // If not viewed yet, update viewed status
        if (!curProgress.viewed) {
          curProgress.viewed = true;
          await sectionProgressService.updateProgress(sId, pType, { viewed: true });

          await historyService.addEntry({
            type: "SECTION_VIEWED",
            title: `Studied Section ${heading}`,
            description: `Opened dedicated detail page for section "${heading}" in ${parentTitle}.`,
            sourceType: pType,
            sourceId: sId,
            dayNumber: dayNumber ? Number(dayNumber) : null,
          });
        }
        setProgress(curProgress);

        if (heading.toLowerCase().includes("homework")) {
          const hProg = await homeworkService.getProgress(sId);
          const updated = await homeworkService.updateProgress(sId, { ...hProg, task_read: true });
          setHwProgress(updated);
          setHomeworkInput(updated.homeworkAnswerText || "");
          setActiveTab("write");
        }

        if (heading.toLowerCase().includes("self check") || heading.toLowerCase().includes("self-check")) {
          const scProg = await selfCheckService.getProgress(sId);
          const updated = await selfCheckService.updateProgress(sId, { ...scProg, checklist_read: true });
          setScProgress(updated);
          setCheckedItems(updated.checked_items || {});
          setActiveTab("tips");
        }

        if (heading.toLowerCase().includes("preview")) {
          const prevProg = await previewService.getProgress(sId);
          const updated = await previewService.updateProgress(sId, { ...prevProg, preview_read: true });
          setPrevProgress(updated);
          setActiveTab("tips");
        }
      } catch (e) {
        console.error("Error loading progress:", e);
      }
    }
    loadProgress();
  }, [sectionData, dayNumber]);

  const updateProgressField = async (fields: Partial<SectionProgress>) => {
    if (!sectionData) return;
    try {
      const updated = await sectionProgressService.updateProgress(sectionData.sourceId, sectionData.practiceSourceType, fields);
      setProgress(updated);
    } catch (e) {
      console.error("Error updating progress:", e);
    }
  };

  const checkAndTriggerHWCompletion = async (currentProg: HomeworkProgress) => {
    if (!sectionData) return;
    if (currentProg.task_read && currentProg.homework_written && currentProg.homework_checked && currentProg.homework_saved) {
      if (!currentProg.section_completed) {
        const updated = await homeworkService.updateProgress(sectionData.sourceId, { section_completed: true });
        setHwProgress(updated);
        await sectionProgressService.updateProgress(sectionData.sourceId, sectionData.practiceSourceType, { completed: true, completedAt: new Date().toISOString() });
        await historyService.addEntry({
          type: "SECTION_COMPLETED",
          title: `Completed Section ${sectionData.heading}`,
          description: `Finished ${sectionData.heading} in ${sectionData.parentTitle}`,
          sourceType: sectionData.practiceSourceType,
          sourceId: sectionData.sourceId,
          dayNumber: dayNumber ? Number(dayNumber) : null,
        });
        setProgress(prev => prev ? { ...prev, completed: true, completedAt: new Date().toISOString() } : prev);
      }
    }
  };

  const checkAndTriggerSCCompletion = async (currentProg: SelfCheckProgress) => {
    if (!sectionData) return;
    const itemsCount = sectionData.body.split("\n").map(l => l.trim().replace(/^[•\-\*]\s*/, "")).filter(Boolean).length;
    const checkedCount = Object.values(currentProg.checked_items).filter(v => v).length;
    
    if (currentProg.checklist_read && currentProg.self_check_checked && checkedCount === itemsCount && itemsCount > 0) {
      if (!currentProg.section_completed) {
        const updated = await selfCheckService.updateProgress(sectionData.sourceId, { section_completed: true });
        setScProgress(updated);
        await sectionProgressService.updateProgress(sectionData.sourceId, sectionData.practiceSourceType, { completed: true, completedAt: new Date().toISOString() });
        await historyService.addEntry({
          type: "SECTION_COMPLETED",
          title: `Completed Section ${sectionData.heading}`,
          description: `Finished ${sectionData.heading} in ${sectionData.parentTitle}`,
          sourceType: sectionData.practiceSourceType,
          sourceId: sectionData.sourceId,
          dayNumber: dayNumber ? Number(dayNumber) : null,
        });
        setProgress(prev => prev ? { ...prev, completed: true, completedAt: new Date().toISOString() } : prev);
      }
    }
  };

  const checkAndTriggerPreviewCompletion = async (currentProg: PreviewProgress) => {
    if (!sectionData) return;
    if (currentProg.preview_read && currentProg.preview_listened && currentProg.preview_prepared) {
      if (!currentProg.section_completed) {
        const updated = await previewService.updateProgress(sectionData.sourceId, { section_completed: true });
        setPrevProgress(updated);
        await sectionProgressService.updateProgress(sectionData.sourceId, sectionData.practiceSourceType, { completed: true, completedAt: new Date().toISOString() });
        await historyService.addEntry({
          type: "SECTION_COMPLETED",
          title: `Completed Section ${sectionData.heading}`,
          description: `Finished ${sectionData.heading} in ${sectionData.parentTitle}`,
          sourceType: sectionData.practiceSourceType,
          sourceId: sectionData.sourceId,
          dayNumber: dayNumber ? Number(dayNumber) : null,
        });
        setProgress(prev => prev ? { ...prev, completed: true, completedAt: new Date().toISOString() } : prev);
      }
    }
  };

  const handleMarkComplete = async () => {
    if (!sectionData) return;

    const isVocabulary = sectionData.heading.toLowerCase().includes("vocab");
    const isGrammar = sectionData.heading.toLowerCase().includes("grammar");
    const nextCompleted = progress ? !progress.completed : true;

    if (isVocabulary && nextCompleted) {
      const vocabCompleted = vocabChecklist.readAll && vocabChecklist.listenAll && vocabChecklist.make2Sentences && vocabChecklist.completeQuiz;
      if (!vocabCompleted) {
        const confirmed = window.confirm("You have not completed all items in your checklist (Read all words, Listen pronunciation, Make 2 sentences, Complete quick quiz). Mark as complete anyway?");
        if (!confirmed) return;
      }
    }

    if (isGrammar && nextCompleted) {
      const grammarCompleted = grammarChecklist.readRule && grammarChecklist.understandExamples && grammarChecklist.make2Sentences && grammarChecklist.practicePronounce && grammarChecklist.completeQuiz;
      if (!grammarCompleted) {
        const confirmed = window.confirm("You have not completed all items in your checklist (Read grammar rule, Understand examples, Make 2 sentences, Practice pronunciation, Complete quick quiz). Mark as complete anyway?");
        if (!confirmed) return;
      }
    }

    const isExamplesMakeSentences = sectionData && (sectionData.heading.toLowerCase().includes("example") || sectionData.heading.toLowerCase().includes("make sentence"));
    if (isExamplesMakeSentences && nextCompleted) {
      const examplesCompleted = examplesChecklist.readExamples &&
        examplesChecklist.listenExamples &&
        examplesChecklist.understandPattern &&
        examplesChecklist.make3Sentences &&
        examplesChecklist.checkOneSentence;
      if (!examplesCompleted) {
        const confirmed = window.confirm("You have not completed all items in your checklist (Read examples, Listen examples, Understand pattern, Make 3 sentences, Check one sentence). Mark as complete anyway?");
        if (!confirmed) return;
      }
    }

    const isQA = sectionData && (sectionData.heading.toLowerCase().includes("question") || sectionData.heading.toLowerCase().includes("q&a") || sectionData.heading.toLowerCase().includes("answers"));
    if (isQA && nextCompleted) {
      const qaCompleted = qaChecklist.readAll && qaChecklist.listenAnswers && qaChecklist.checkAnswer && qaChecklist.saveItem;
      if (!qaCompleted) {
        const confirmed = window.confirm("You have not completed all items in your Q&A checklist (Read/Review all Q&As, Listen to Q&As or Sample Answers, Practice & Check Answer, Save Notes or mistakes). Mark as complete anyway?");
        if (!confirmed) return;
      }
    }

    const isSpeaking = sectionData && (sectionData.heading.toLowerCase().includes("speaking drill") || sectionData.heading.toLowerCase().includes("speaking"));
    if (isSpeaking && nextCompleted) {
      const speakingCompleted = speakingChecklist.listen && speakingChecklist.speak && speakingChecklist.check && speakingChecklist.saveNote;
      if (!speakingCompleted) {
        const confirmed = window.confirm("You have not completed all items in your Speaking checklist (Listen target line, Speak/record attempt, Compare transcript, Save notes). Mark as complete anyway?");
        if (!confirmed) return;
      }
    }

    await updateProgressField({ completed: nextCompleted, completedAt: nextCompleted ? new Date().toISOString() : undefined });

    if (nextCompleted) {
      await historyService.addEntry({
        type: "SECTION_COMPLETED",
        title: `Completed Section: ${sectionData.heading}`,
        description: `Successfully completed all tasks and marked section "${sectionData.heading}" as complete.`,
        sourceType: sectionData.practiceSourceType,
        sourceId: sectionData.sourceId,
        dayNumber: dayNumber ? Number(dayNumber) : null,
      });
    }
  };

  // Load section content based on routing type
  useEffect(() => {
    async function loadSection() {
      try {
        setLoading(true);
        if (!sectionId) return;

        let foundSection: { heading: string; body: string } | undefined;
        let parentTitle = "";
        let parentUrl = "";
        let moduleKey = "";
        let sourceType: NotebookSourceType = "Daily Lesson";
        let practiceSourceType: PracticeSourceType = "DAILY_LESSON";
        let sourceId = "";

        if (dayNumber) {
          const dayNum = Number(dayNumber);
          const lessons = await dailyLessonService.getByDay(dayNum);
          const lesson = lessons[0];
          if (lesson) {
            const sections = lessonService.splitIntoSections(lesson.rawContent, dayNum);
            foundSection = sections.find(
              (s) => s.heading.toLowerCase().replace(/[^a-z0-9]/g, "-") === sectionId
            );
            parentTitle = `Day ${dayNum}: ${lesson.title}`;
            parentUrl = `/daily-lessons/day/${dayNum}`;
            moduleKey = "english-course";
            sourceType = "Daily Lesson";
            practiceSourceType = "DAILY_LESSON";
            sourceId = `${dayNum}_${sectionId}`;
          }
        } else if (id) {
          const lesson = await lessonService.getLesson(id);
          if (lesson) {
            const sections = lessonService.splitIntoSections(lesson.rawContent, lesson.dayNumber);
            foundSection = sections.find(
              (s) => s.heading.toLowerCase().replace(/[^a-z0-9]/g, "-") === sectionId
            );
            parentTitle = lesson.title;
            parentUrl = `/lesson/${id}`;
            moduleKey = "english-course";
            sourceType = "Daily Lesson";
            practiceSourceType = "DAILY_LESSON";
            sourceId = `${id}_${sectionId}`;
          }
        } else if (type) {
          const content = await prepositionService.getPreposition(type);
          if (content) {
            const prepSections = [
              {
                heading: "Grammar Rules",
                body: `Rule:\n${content.rule}\n\nWhen to Use:\n${content.whenToUse.map((r) => `• ${r}`).join("\n")}\n\nWhen Not to Use:\n${content.whenNotToUse.map((r) => `• ${r}`).join("\n")}`,
              },
              {
                heading: "Example Sentences",
                body: `Examples:\n${content.examples.map((ex, i) => `${i + 1}. ${ex.sentence}`).join("\n")}`,
              },
              {
                heading: "Common Mistakes",
                body: `Mistakes:\n${content.commonMistakes
                  .map((m) => `Wrong: ${m.wrong}\nCorrect: ${m.correct}\nRule: ${m.rule}`)
                  .join("\n\n")}`,
              },
              {
                heading: "Practice Quiz",
                body: `Quiz Questions:\n${content.quiz
                  .map((q, i) => `${i + 1}. Question: ${q.prompt}\n   Options: ${q.options.join(", ")}`)
                  .join("\n\n")}`,
              },
            ];
            foundSection = prepSections.find(
              (s) => s.heading.toLowerCase().replace(/[^a-z0-9]/g, "-") === sectionId
            );
            parentTitle = `Preposition ${content.name}`;
            parentUrl = `/prepositions/${type}`;
            moduleKey = "prepositions";
            sourceType = "Preposition";
            practiceSourceType = "PREPOSITION";
            sourceId = `${type}_${sectionId}`;
          }
        }

        if (foundSection) {
          setSectionData({
            heading: foundSection.heading,
            body: foundSection.body,
            parentTitle,
            parentUrl,
            moduleKey,
            sourceType,
            practiceSourceType,
            sourceId,
          });

          // Log section view history
          await historyService.addEntry({
            type: "LESSON_SECTION_VIEWED",
            title: `Studied Section ${foundSection.heading}`,
            description: `Opened dedicated detail page for section "${foundSection.heading}" in ${parentTitle}.`,
            sourceType: practiceSourceType,
            sourceId: sourceId,
            dayNumber: dayNumber ? Number(dayNumber) : null,
          });
        } else {
          setSectionData(null);
        }
      } catch (err) {
        console.error("Error loading section detail:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSection();
  }, [dayNumber, id, type, sectionId]);

  // Load Notebook note for this section
  useEffect(() => {
    const currentSectionData = sectionData;
    if (!currentSectionData) return;
    async function loadNotebookNote(data: SectionData) {
      try {
        const allNotes = await aiNotebookService.listNotes();
        const found = allNotes.find((n) => {
          const hasSourceType = n.sourceType === data.sourceType;
          const hasModuleKey = n.tags?.includes(data.moduleKey);
          const hasSectionId = n.tags?.includes(`section-${sectionId}`);
          const hasDay = dayNumber ? n.tags?.includes(`day-${dayNumber}`) : true;
          const hasPrepType = type ? n.tags?.includes(`preposition-${type}`) : true;
          return hasSourceType && hasModuleKey && hasSectionId && hasDay && hasPrepType;
        });

        if (found) {
          setLinkedNote(found);
          setNoteText(found.originalContent);
        } else {
          setLinkedNote(null);
          setNoteText(`Study notes for "${data.heading}" section:\n\n- `);
        }
      } catch (err) {
        console.error("Error fetching notebook item:", err);
      }
    }
    loadNotebookNote(currentSectionData);
  }, [sectionData, sectionId, dayNumber, type]);

  // Fetch Section Recommendations / Tips
  useEffect(() => {
    if (sectionData) {
      setTips(
        lessonSectionPracticeService.getSectionRecommendations(
          sectionData.heading,
          sectionData.body
        )
      );
    }
  }, [sectionData]);

  // Log recommendation view once when Tab changes to Tips
  useEffect(() => {
    if (activeTab === "tips" && sectionData) {
      void historyService.addEntry({
        type: "SECTION_AI_RECOMMENDATION_VIEWED",
        title: `Viewed recommendations for ${sectionData.heading}`,
        description: `Checked Mock AI study recommendations for "${sectionData.heading}".`,
        sourceType: sectionData.practiceSourceType,
        sourceId: sectionData.sourceId,
      });
    }
  }, [activeTab, sectionData]);

  // Load mistakes for Mistakes Tab
  useEffect(() => {
    if (activeTab === "mistakes" && sectionData) {
      loadSectionMistakes();
    }
  }, [activeTab, sectionData]);

  async function loadSectionMistakes() {
    if (!sectionData) return;
    setLoadingMistakes(true);
    try {
      const list = await mistakeService.getMistakesBySource(
        sectionData.practiceSourceType,
        sectionData.sourceId
      );
      setMistakes(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMistakes(false);
    }
  }

  // Speak section text (TTS)
  const handleSpeak = () => {
    if (!sectionData) return;
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${sectionData.heading}. ${sectionData.body}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "en-US";
    utterance.rate = 0.85;

    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Copy text to clipboard
  const handleCopy = () => {
    if (!sectionData) return;
    navigator.clipboard.writeText(sectionData.body);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Coach tips saving states
  const [coachTipSaved, setCoachTipSaved] = useState(false);
  const [savingCoachTip, setSavingCoachTip] = useState(false);

  const handleSaveCoachTipToNotebook = async (tipText: string) => {
    if (!sectionData) return;
    setSavingCoachTip(true);
    try {
      await new Promise((r) => setTimeout(r, 450));
      const title = dayNumber
        ? `Day ${dayNumber} — Coach Tips: ${sectionData.heading}`
        : `${sectionData.parentTitle} — Coach Tips: ${sectionData.heading}`;

      const tags = [
        "coach-tips",
        sectionData.moduleKey,
        dayNumber ? `day-${dayNumber}` : "",
        type ? `preposition-${type}` : "",
        `section-${sectionId}`,
      ].filter(Boolean);

      await aiNotebookService.createNote({
        title,
        sourceType: sectionData.sourceType,
        originalContent: tipText,
        tags,
      });

      setCoachTipSaved(true);
      setTimeout(() => setCoachTipSaved(false), 3000);

      await historyService.addEntry({
        type: "AI_COACH_TIP_SAVED",
        title: `Saved AI Coach Tip`,
        description: `Saved AI Coach study suggestions for section "${sectionData.heading}" to the AI Notebook.`,
        sourceType: sectionData.practiceSourceType,
        sourceId: sectionData.sourceId,
        dayNumber: dayNumber ? Number(dayNumber) : null,
      });

      if (progress && !progress.savedToNotebook) {
        await updateProgressField({ savedToNotebook: true });
        await historyService.addEntry({
          type: "SECTION_NOTE_SAVED",
          title: `Saved Section Note: ${sectionData.heading}`,
          description: `Saved vocabulary or draft notes for section "${sectionData.heading}" to the AI Notebook.`,
          sourceType: sectionData.practiceSourceType,
          sourceId: sectionData.sourceId,
          dayNumber: dayNumber ? Number(dayNumber) : null,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingCoachTip(false);
    }
  };

  // Save AI Tips to Notebook
  const handleSaveTipsToNotebook = async () => {
    if (!sectionData || tips.length === 0) return;
    setSavingTips(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      const content = `Mock AI Tips for section "${sectionData.heading}":\n\n` + tips.map((t) => `- ${t}`).join("\n");

      await aiNotebookService.createNote({
        title: `${sectionData.heading} Tips — AI Recommendations`,
        sourceType: sectionData.sourceType,
        originalContent: content,
        tags: ["study-tips", sectionData.moduleKey, `section-${sectionId}`].filter(Boolean),
      });

      setTipsSaved(true);
      setTimeout(() => setTipsSaved(false), 3000);

      await historyService.addEntry({
        type: "SECTION_SAVED_TO_NOTEBOOK",
        title: `Saved ${sectionData.heading} Tips`,
        description: `Saved Mock AI study tips to the AI Notebook.`,
        sourceType: sectionData.practiceSourceType,
        sourceId: sectionData.sourceId,
      });

      if (progress && !progress.savedToNotebook) {
        await updateProgressField({ savedToNotebook: true });
        await historyService.addEntry({
          type: "SECTION_NOTE_SAVED",
          title: `Saved Section Note: ${sectionData.heading}`,
          description: `Saved vocabulary or draft notes for section "${sectionData.heading}" to the AI Notebook.`,
          sourceType: sectionData.practiceSourceType,
          sourceId: sectionData.sourceId,
          dayNumber: dayNumber ? Number(dayNumber) : null,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingTips(false);
    }
  };

  // Check Writing
  const handleCheckWriting = async () => {
    if (!writeInput.trim() || !sectionData) return;
    setCheckingWrite(true);
    setWriteResult(null);

    await new Promise((r) => setTimeout(r, 600));

    const result = await lessonSectionPracticeService.checkWriting(
      writeInput,
      sectionData.practiceSourceType,
      sectionData.sourceId,
      `${sectionData.parentTitle} - ${sectionData.heading}`
    );

    setWriteResult(result);
    setCheckingWrite(false);

    // Log check history
    void historyService.addEntry({
      type: "SECTION_WRITING_CHECKED",
      title: `Checked writing in ${sectionData.heading}`,
      description: `Writing score: ${result.score}%. Corrected sentence: "${result.betterSentence}"`,
      sourceType: sectionData.practiceSourceType,
      sourceId: sectionData.sourceId,
    });

    if (result.status === "needs-improvement") {
      void historyService.addEntry({
        type: "SECTION_MISTAKE_FOUND",
        title: `Mistake detected in ${sectionData.heading}`,
        description: `Detected wrong input: "${writeInput}"`,
        sourceType: sectionData.practiceSourceType,
        sourceId: sectionData.sourceId,
      });
    }

    if (progress) {
      const updates: Partial<SectionProgress> = { writingChecked: true };
      if (result.status === "needs-improvement") {
        updates.mistakeFound = true;
      }
      await updateProgressField(updates);
    }
  };

  // Save grammar correction directly to notebook
  const handleSaveCorrectionToNotebook = async () => {
    if (!writeResult || !sectionData) return;
    setSavingCorrection(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      await aiNotebookService.createNote({
        title: `Correction: ${sectionData.heading}`,
        sourceType: sectionData.sourceType,
        originalContent: `Grammar practice for "${sectionData.heading}":\n\nInput: "${writeInput}"\nCorrection: "${writeResult.betterSentence}"\nRule: ${writeResult.simpleRule}`,
        tags: ["grammar-correction", sectionData.moduleKey, `section-${sectionId}`],
      });
      setCorrectionSaved(true);
      setTimeout(() => setCorrectionSaved(false), 3000);

      if (progress && !progress.savedToNotebook) {
        await updateProgressField({ savedToNotebook: true });
        await historyService.addEntry({
          type: "SECTION_NOTE_SAVED",
          title: `Saved Section Note: ${sectionData.heading}`,
          description: `Saved vocabulary or draft notes for section "${sectionData.heading}" to the AI Notebook.`,
          sourceType: sectionData.practiceSourceType,
          sourceId: sectionData.sourceId,
          dayNumber: dayNumber ? Number(dayNumber) : null,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingCorrection(false);
    }
  };

  // Check Speaking
  const handleCheckSpeaking = async () => {
    if (!speakInput.trim() || !sectionData) return;
    setCheckingSpeak(true);
    setSpeakResult(null);

    await new Promise((r) => setTimeout(r, 600));

    const result = lessonSectionPracticeService.checkSpeaking(speakInput, sectionData.body);
    setSpeakResult(result);
    setCheckingSpeak(false);

    void historyService.addEntry({
      type: "SECTION_SPEAKING_CHECKED",
      title: `Checked speaking in ${sectionData.heading}`,
      description: `Spoken sentence matching accuracy: ${result.accuracy}%`,
      sourceType: sectionData.practiceSourceType,
      sourceId: sectionData.sourceId,
    });

    if (progress && !progress.speakingChecked) {
      await updateProgressField({ speakingChecked: true });
    }
  };

  // Listen Practice Line
  const handleListenPracticeLine = async (line: string) => {
    if (!sectionData) return;
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Speech is not supported in this browser.");
      return;
    }

    if (isSpeakingLine) {
      window.speechSynthesis.cancel();
      setIsSpeakingLine(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(line);
    utterance.lang = "en-US";
    utterance.rate = 0.85;

    utterance.onend = () => {
      setIsSpeakingLine(false);
    };
    utterance.onerror = () => {
      setIsSpeakingLine(false);
    };

    window.speechSynthesis.cancel();
    setIsSpeakingLine(true);
    window.speechSynthesis.speak(utterance);

    // Track checklist and progress
    setSpeakingChecklist(prev => ({ ...prev, listen: true }));
    if (progress && !progress.listened) {
      await updateProgressField({ listened: true });
      await historyService.addEntry({
        type: "SECTION_LISTENED",
        title: `Listened Section: ${sectionData.heading}`,
        description: `Listened to audio practice for section "${sectionData.heading}".`,
        sourceType: sectionData.practiceSourceType,
        sourceId: sectionData.sourceId,
        dayNumber: dayNumber ? Number(dayNumber) : null,
      });
    }
  };

  // Helper to generate extra speaking lines from pattern
  const generateExtraSpeakingLines = (body: string, heading: string): string[] => {
    const h = heading.toLowerCase();
    const cleanBody = body.replace(/&ldquo;|&rdquo;|"/g, "").trim().toLowerCase();
    
    if (h.includes("preposition") || cleanBody.includes("in ") || cleanBody.includes("on ") || cleanBody.includes("at ")) {
      return [
        "The cat is sleeping on the comfortable sofa.",
        "We will meet at the library at five o'clock.",
        "She put the fresh flowers in the beautiful vase.",
        "There is a key on the kitchen counter.",
      ];
    }
    
    if (h.includes("vocab") || h.includes("word")) {
      return [
        "I want to improve my English speaking skills daily.",
        "Learning new vocabulary helps us express ideas better.",
        "Consistency is the key to mastering any language.",
        "Could you please repeat that word one more time?",
      ];
    }
    
    return [
      "I am practicing speaking English every single day.",
      "Correct pronunciation makes communication much easier.",
      "Please listen to the audio guide and try to repeat.",
      "This is an extra sentence to practice my accent and flow.",
    ];
  };

  // Speech recognition initialization for Speaking Drill
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";
        
        rec.onstart = () => {
          setIsRecording(true);
        };
        
        rec.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          setSpeakInput(resultText);
          setIsRecording(false);
          setSpeakingChecklist(prev => ({ ...prev, speak: true }));
        };
        
        rec.onerror = (err: any) => {
          console.error("Speech recognition error", err);
          setIsRecording(false);
        };
        
        rec.onend = () => {
          setIsRecording(false);
        };
        
        setRecognition(rec);
      }
    }
  }, []);

  // Extra speaking lines setup
  useEffect(() => {
    if (sectionData) {
      const h = sectionData.heading.toLowerCase();
      if (h.includes("speaking drill") || h.includes("speaking")) {
        setExtraSpeakingLines(generateExtraSpeakingLines(sectionData.body, sectionData.heading));
      }
    }
  }, [sectionData]);

  const handleToggleRecording = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please type your transcript manually.");
      return;
    }
    if (isRecording) {
      recognition.stop();
    } else {
      setSpeakInput("");
      setSpeakCoachFeedback(null);
      setShowTranscriptBox(true);
      try {
        recognition.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCompareSpeaking = async (targetLine: string) => {
    if (!speakInput.trim() || !sectionData) return;
    setCheckingSpeak(true);
    setSpeakCoachFeedback(null);
    await new Promise((r) => setTimeout(r, 600));

    const feedback = speakingAiService.getMockSpeakingFeedback(speakInput, targetLine);
    setSpeakCoachFeedback(feedback);
    setCheckingSpeak(false);

    // Track checklist item
    setSpeakingChecklist(prev => ({ ...prev, check: true }));

    // Log history
    void historyService.addEntry({
      type: "SECTION_SPEAKING_CHECKED",
      title: `Checked speaking in ${sectionData.heading}`,
      description: `Spoken sentence matching score: ${feedback.score}/10`,
      sourceType: sectionData.practiceSourceType,
      sourceId: sectionData.sourceId,
    });

    // Update progress
    if (progress && !progress.speakingChecked) {
      await updateProgressField({ speakingChecked: true });
    }
  };

  const handleSaveSpeakingAttempt = async () => {
    if (!speakCoachFeedback || !sectionData) return;
    setSavingSpeakingNote(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      const noteTitle = `Speaking Practice: ${sectionData.heading}`;
      const content = `Speaking attempt for "${sectionData.heading}":\n\nTarget: "${speakCoachFeedback.betterSpokenSentence}"\nSpoken: "${speakCoachFeedback.transcript}"\nScore: ${speakCoachFeedback.score}/10\nFeedback: ${speakCoachFeedback.hinglishExplanation}`;
      
      await aiNotebookService.createNote({
        title: noteTitle,
        sourceType: sectionData.sourceType,
        originalContent: content,
        tags: ["speaking-practice", sectionData.moduleKey, `section-${sectionId}`],
      });
      setSpeakingNoteSaved(true);
      setTimeout(() => setSpeakingNoteSaved(false), 3000);

      // Track checklist
      setSpeakingChecklist(prev => ({ ...prev, saveNote: true }));
      setSpeakingNotesCount(prev => prev + 1);

      // Update progress
      if (progress && !progress.savedToNotebook) {
        await updateProgressField({ savedToNotebook: true });
        await historyService.addEntry({
          type: "SECTION_NOTE_SAVED",
          title: `Saved Speaking Note: ${sectionData.heading}`,
          description: `Saved speaking attempt note for "${sectionData.heading}" to Notebook.`,
          sourceType: sectionData.practiceSourceType,
          sourceId: sectionData.sourceId,
          dayNumber: dayNumber ? Number(dayNumber) : null,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSpeakingNote(false);
    }
  };

  const handleSaveSpeakingMistake = async () => {
    if (!speakCoachFeedback || !sectionData) return;
    try {
      await mistakeService.saveMistake({
        sourceType: sectionData.practiceSourceType,
        sourceId: sectionData.sourceId,
        sourceTitle: sectionData.parentTitle,
        wrongSentence: speakCoachFeedback.transcript,
        correctSentence: speakCoachFeedback.betterSpokenSentence,
        simpleRule: `Speaking practice error (${speakCoachFeedback.mistakeType}): ${speakCoachFeedback.hinglishExplanation}`,
        mistakeType: "sentence",
      });

      // Track checklist
      setSpeakingChecklist(prev => ({ ...prev, saveMistake: true }));
      setSpeakingMistakesCount(prev => prev + 1);

      // Update progress
      if (progress && !progress.mistakeFound) {
        await updateProgressField({ mistakeFound: true });
        await historyService.addEntry({
          type: "SECTION_MISTAKE_FOUND",
          title: `Mistake detected in ${sectionData.heading}`,
          description: `Logged speaking attempt mistake: "${speakCoachFeedback.transcript}" -> "${speakCoachFeedback.betterSpokenSentence}"`,
          sourceType: sectionData.practiceSourceType,
          sourceId: sectionData.sourceId,
        });
      }
      alert("Mistake saved successfully!");
    } catch (e) {
      console.error(e);
    }
  };

  // Mini Conversation handlers
  const handleCheckConversation = async () => {
    if (!convReply.trim() || !sectionData) return;
    setCheckingConv(true);
    setConvFeedback(null);
    setConvMistakeSaved(false);
    await new Promise((r) => setTimeout(r, 800));

    const isGood = convReply.trim().split(" ").length >= 3;
    const status = isGood ? "Good" : "Needs Practice";
    
    let betterReply = "Sure, I wake up early too.";
    let mistake = "None";
    let hinglishExplanation = "Aapka reply bilkul sahi hai! Natural sound karne ke liye aap is tarah bhi bol sakte hain.";
    
    if (!isGood) {
      betterReply = "I usually wake up at 7 AM. How about you?";
      mistake = "Reply is too short / incomplete sentence structure";
      hinglishExplanation = "Aapka reply chota hai. English me complete sentences bolne ki practice karein, jaise 'I wake up at...'";
    } else {
      const replyLower = convReply.toLowerCase();
      if (replyLower.includes("wake") || replyLower.includes("up") || replyLower.includes("am") || replyLower.includes("pm") || replyLower.includes("time")) {
        betterReply = `I wake up at ${convReply.replace(/i\s+wake\s+up\s+at/i, "").trim() || "7 AM"}. What about you?`;
        hinglishExplanation = "Aapka reply topic se match karta hai aur sahi hai!";
      } else if (replyLower.includes("tea") || replyLower.includes("like") || replyLower.includes("milk")) {
        betterReply = "Yes, I like tea a lot, but I prefer coffee in the morning.";
        hinglishExplanation = "Bahut badhiya! Tea/coffee wale conversation ke liye yeh reply perfectly correct aur natural hai.";
      } else if (replyLower.includes("name") || replyLower.includes("rahul") || replyLower.includes("meet")) {
        betterReply = "Hi, my name is Amit. Nice to meet you too!";
        hinglishExplanation = "Greeting and introduction ke liye aapka reply bilkul appropriate hai.";
      }
    }

    setConvFeedback({
      status,
      userReply: convReply,
      betterReply,
      mistake,
      hinglishExplanation,
    });
    setCheckingConv(false);

    void historyService.addEntry({
      type: "SECTION_WRITING_CHECKED",
      title: `Checked conversation reply in ${sectionData.heading}`,
      description: `Status: ${status}`,
      sourceType: sectionData.practiceSourceType,
      sourceId: sectionData.sourceId,
    });

    if (progress && !progress.writingChecked) {
      await updateProgressField({ writingChecked: true });
    }
  };

  const handleToggleRecordingConv = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please type your reply.");
      return;
    }
    if (isRecordingConv) {
      recognition.stop();
    } else {
      setConvReply("");
      setConvFeedback(null);
      
      const oldOnStart = recognition.onstart;
      const oldOnResult = recognition.onresult;
      const oldOnEnd = recognition.onend;
      const oldOnError = recognition.onerror;

      recognition.onstart = () => {
        setIsRecordingConv(true);
      };

      recognition.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setConvReply(resultText);
        setIsRecordingConv(false);
      };

      recognition.onerror = (err: any) => {
        console.error(err);
        setIsRecordingConv(false);
      };

      recognition.onend = () => {
        setIsRecordingConv(false);
        recognition.onstart = oldOnStart;
        recognition.onresult = oldOnResult;
        recognition.onend = oldOnEnd;
        recognition.onerror = oldOnError;
      };

      try {
        recognition.start();
      } catch (err) {
        console.error(err);
        setIsRecordingConv(false);
      }
    }
  };

  const handleSaveConvMistake = async () => {
    if (!convFeedback || !sectionData) return;
    try {
      await mistakeService.saveMistake({
        sourceType: sectionData.practiceSourceType,
        sourceId: sectionData.sourceId,
        sourceTitle: sectionData.parentTitle,
        wrongSentence: convFeedback.userReply,
        correctSentence: convFeedback.betterReply,
        simpleRule: `Conversation error: ${convFeedback.mistake} - ${convFeedback.hinglishExplanation}`,
        mistakeType: "sentence",
      });
      setConvMistakeSaved(true);

      if (progress && !progress.mistakeFound) {
        await updateProgressField({ mistakeFound: true });
        await historyService.addEntry({
          type: "SECTION_MISTAKE_FOUND",
          title: `Mistake detected in ${sectionData.heading}`,
          description: `Logged conversation reply mistake: "${convFeedback.userReply}"`,
          sourceType: sectionData.practiceSourceType,
          sourceId: sectionData.sourceId,
        });
      }
      alert("Mistake saved successfully!");
    } catch (e) {
      console.error(e);
    }
  };

  // Save Writing practice to Notebook
  const handleSaveWritingToNotebook = async () => {
    if (!writeInput.trim() || !sectionData) return;
    setSavingWritingNote(true);
    try {
      await new Promise((r) => setTimeout(r, 450));
      const title = dayNumber
        ? `Day ${dayNumber} — Writing Draft: ${sectionData.heading}`
        : `${sectionData.parentTitle} — Writing Draft: ${sectionData.heading}`;

      const tags = [
        "writing-practice",
        sectionData.moduleKey,
        dayNumber ? `day-${dayNumber}` : "",
        type ? `preposition-${type}` : "",
        `section-${sectionId}`,
      ].filter(Boolean);

      await aiNotebookService.createNote({
        title,
        sourceType: sectionData.sourceType,
        originalContent: `Writing Attempt:\n\n"${writeInput}"\n\nReference text:\n"${sectionData.body}"`,
        writingDraft: writeInput,
        tags,
      });

      setWritingNoteSaved(true);
      setTimeout(() => setWritingNoteSaved(false), 3000);

      await historyService.addEntry({
        type: "SECTION_SAVED_TO_NOTEBOOK",
        title: `Saved Writing Attempt`,
        description: `Saved writing draft for section "${sectionData.heading}" to the AI Notebook.`,
        sourceType: sectionData.practiceSourceType,
        sourceId: sectionData.sourceId,
        dayNumber: dayNumber ? Number(dayNumber) : null,
      });

      if (progress && !progress.savedToNotebook) {
        await updateProgressField({ savedToNotebook: true });
        await historyService.addEntry({
          type: "SECTION_NOTE_SAVED",
          title: `Saved Section Note: ${sectionData.heading}`,
          description: `Saved vocabulary or draft notes for section "${sectionData.heading}" to the AI Notebook.`,
          sourceType: sectionData.practiceSourceType,
          sourceId: sectionData.sourceId,
          dayNumber: dayNumber ? Number(dayNumber) : null,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingWritingNote(false);
    }
  };

  // Save Speaking practice to Notebook
  const handleSaveSpeakingToNotebook = async () => {
    if (!speakInput.trim() || !sectionData) return;
    setSavingSpeakingNote(true);
    try {
      await new Promise((r) => setTimeout(r, 450));
      const title = dayNumber
        ? `Day ${dayNumber} — Speaking Attempt: ${sectionData.heading}`
        : `${sectionData.parentTitle} — Speaking Attempt: ${sectionData.heading}`;

      const tags = [
        "speaking-practice",
        sectionData.moduleKey,
        dayNumber ? `day-${dayNumber}` : "",
        type ? `preposition-${type}` : "",
        `section-${sectionId}`,
      ].filter(Boolean);

      await aiNotebookService.createNote({
        title,
        sourceType: sectionData.sourceType,
        originalContent: `Speaking Attempt (Typed Fallback):\n\n"${speakInput}"\n\nReference text:\n"${sectionData.body}"`,
        speakingTranscript: speakInput,
        tags,
      });

      setSpeakingNoteSaved(true);
      setTimeout(() => setSpeakingNoteSaved(false), 3000);

      await historyService.addEntry({
        type: "SECTION_SAVED_TO_NOTEBOOK",
        title: `Saved Speaking Attempt`,
        description: `Saved speaking transcript for section "${sectionData.heading}" to the AI Notebook.`,
        sourceType: sectionData.practiceSourceType,
        sourceId: sectionData.sourceId,
        dayNumber: dayNumber ? Number(dayNumber) : null,
      });

      if (progress && !progress.savedToNotebook) {
        await updateProgressField({ savedToNotebook: true });
        await historyService.addEntry({
          type: "SECTION_NOTE_SAVED",
          title: `Saved Section Note: ${sectionData.heading}`,
          description: `Saved vocabulary or draft notes for section "${sectionData.heading}" to the AI Notebook.`,
          sourceType: sectionData.practiceSourceType,
          sourceId: sectionData.sourceId,
          dayNumber: dayNumber ? Number(dayNumber) : null,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSpeakingNote(false);
    }
  };

  // Save Notebook Note
  const handleSaveNote = async () => {
    if (!noteText.trim() || !sectionData) return;
    setSavingNote(true);
    setNoteSaved(false);

    try {
      await new Promise((r) => setTimeout(r, 550));

      if (linkedNote) {
        const updated = await aiNotebookService.updateNote(linkedNote.id, {
          originalContent: noteText.trim(),
        });
        setLinkedNote(updated);
      } else {
        const title = dayNumber
          ? `Day ${dayNumber} Lesson — ${sectionData.heading}`
          : `Preposition ${sectionData.parentTitle.replace("Preposition ", "")} — ${sectionData.heading}`;

        const tags = [
          "section-note",
          sectionData.moduleKey,
          dayNumber ? `day-${dayNumber}` : "",
          type ? `preposition-${type}` : "",
          `section-${sectionId}`,
        ].filter(Boolean);

        const created = await aiNotebookService.createNote({
          title,
          sourceType: sectionData.sourceType,
          originalContent: noteText.trim(),
          tags,
        });
        setLinkedNote(created);
      }

      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 3000);

      await historyService.addEntry({
        type: "SECTION_NOTEBOOK_SAVED",
        title: `Saved ${sectionData.heading} Note`,
        description: `Saved notes for section "${sectionData.heading}" to the AI Notebook.`,
        sourceType: sectionData.practiceSourceType,
        sourceId: sectionData.sourceId,
      });

      if (progress && !progress.savedToNotebook) {
        await updateProgressField({ savedToNotebook: true });
        await historyService.addEntry({
          type: "SECTION_NOTE_SAVED",
          title: `Saved Section Note: ${sectionData.heading}`,
          description: `Saved vocabulary or draft notes for section "${sectionData.heading}" to the AI Notebook.`,
          sourceType: sectionData.practiceSourceType,
          sourceId: sectionData.sourceId,
          dayNumber: dayNumber ? Number(dayNumber) : null,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNote(false);
    }
  };

  // Save entire section body to Notebook
  const handleSaveSectionToNotebook = async () => {
    if (!sectionData) return;
    setSavingNote(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      const title = dayNumber
        ? `Day ${dayNumber} — ${sectionData.heading} Full Section`
        : `${sectionData.parentTitle} — ${sectionData.heading} Full Section`;

      await aiNotebookService.createNote({
        title,
        sourceType: sectionData.sourceType,
        originalContent: `Reference Section Content:\n\n${sectionData.body}`,
        tags: ["reference-content", sectionData.moduleKey, `section-${sectionId}`],
      });

      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 3000);

      if (progress && !progress.savedToNotebook) {
        await updateProgressField({ savedToNotebook: true });
        await historyService.addEntry({
          type: "SECTION_NOTE_SAVED",
          title: `Saved Section Note: ${sectionData.heading}`,
          description: `Saved vocabulary or draft notes for section "${sectionData.heading}" to the AI Notebook.`,
          sourceType: sectionData.practiceSourceType,
          sourceId: sectionData.sourceId,
          dayNumber: dayNumber ? Number(dayNumber) : null,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNote(false);
    }
  };

  // Mark mistake as practiced
  const handleMarkMistakePracticed = async (mistakeId: string) => {
    try {
      await mistakeService.markMistakePracticed(mistakeId);
      await loadSectionMistakes();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="animate-spin text-indigo-600 h-8 w-8" />
        <p className="text-sm text-slate-500 font-medium animate-pulse">Loading study section...</p>
      </div>
    );
  }

  if (!sectionData) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 space-y-4">
          <AlertCircle className="text-red-500 mx-auto h-12 w-12" />
          <h2 className="text-lg font-bold text-red-800">Section Not Found</h2>
          <p className="text-sm text-red-600 leading-relaxed">
            The study section you are trying to view does not exist or has not been loaded correctly.
          </p>
          <Button onClick={() => navigate("/english-course", { replace: true })} className="mx-auto">
            <ArrowLeft size={16} /> Back to Lesson
          </Button>
        </div>
      </div>
    );
  }

  // Pick category colors
  const getSectionBadgeTone = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("vocab")) return "sky" as const;
    if (t.includes("grammar") || t.includes("rule") || t.includes("prep")) return "rose" as const;
    if (t.includes("speaking") || t.includes("drill") || t.includes("pronun")) return "emerald" as const;
    if (t.includes("question") || t.includes("q&a")) return "amber" as const;
    if (t.includes("mistake")) return "rose" as const;
    return "indigo" as const;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 py-6">
      {/* Header card with back button */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white border border-slate-100 p-4 rounded-2xl shadow-sm/30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(sectionData.parentUrl)}
            aria-label="Back to parent page"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider block">
              {sectionData.sourceType} Section Detail
            </span>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-tight">
              {sectionData.parentTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone={getSectionBadgeTone(sectionData.heading)}>
            {sectionData.heading}
          </Badge>
          <span className="text-xs text-slate-400 font-semibold px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg">
            Source: {sectionData.sourceType}
          </span>
          <button
            onClick={onToggleBookmark}
            className={`p-1.5 border rounded-lg transition-colors flex items-center justify-center ${isBookmarked
              ? "bg-amber-50 border-amber-200 text-amber-600"
              : "bg-white border-slate-200 text-slate-400 hover:text-slate-700"
              }`}
            title={isBookmarked ? "Bookmarked!" : "Bookmark Section"}
          >
            <Bookmark size={14} className={isBookmarked ? "fill-current" : ""} />
          </button>
        </div>
      </div>

      {/* Grid Container */}
      {(() => {
        const isTimeTable = sectionData && (sectionData.heading.toLowerCase().includes("time table") || sectionData.heading.toLowerCase().includes("schedule"));
        const isVocabulary = sectionData && sectionData.heading.toLowerCase().includes("vocab");
        const isExamplesMakeSentences = sectionData && (sectionData.heading.toLowerCase().includes("example") || sectionData.heading.toLowerCase().includes("make sentence"));

        if (isExamplesMakeSentences) {
          const handleStartNextSection = async () => {
            let nextSlug = "";
            try {
              let rawContent = "";
              let dayNum: number | null = null;
              if (dayNumber) {
                dayNum = Number(dayNumber);
                const lessons = await dailyLessonService.getByDay(dayNum);
                if (lessons && lessons[0]) rawContent = lessons[0].rawContent;
              } else if (id) {
                const lesson = await lessonService.getLesson(id);
                if (lesson) {
                  rawContent = lesson.rawContent;
                  dayNum = lesson.dayNumber;
                }
              }
              if (rawContent) {
                const sections = lessonService.splitIntoSections(rawContent, dayNum);
                const currentIdx = sections.findIndex(s => s.heading.toLowerCase().replace(/[^a-z0-9]/g, "-") === sectionId);
                if (currentIdx !== -1 && currentIdx + 1 < sections.length) {
                  nextSlug = sections[currentIdx + 1].heading.toLowerCase().replace(/[^a-z0-9]/g, "-");
                }
              }
            } catch (e) {
              console.error(e);
            }

            if (nextSlug) {
              if (dayNumber) {
                navigate(`/daily-lessons/day/${dayNumber}/section/${nextSlug}`);
              } else if (id) {
                navigate(`/lesson/${id}/section/${nextSlug}`);
              }
            } else {
              if (dayNumber) {
                navigate(`/daily-lessons/day/${dayNumber}`);
              } else if (id) {
                navigate(`/lesson/${id}`);
              }
            }
          };

          return (
            <ExamplesMakeSentencesSection
              sectionData={sectionData}
              parentTitle={sectionData.parentTitle}
              checklist={examplesChecklist}
              setChecklist={setExamplesChecklist}
              weakPatterns={weakSentencePatterns}
              setWeakPatterns={setWeakSentencePatterns}
              handleMarkComplete={handleMarkComplete}
              handleStartNextSection={handleStartNextSection}
              progress={progress}
              handleListenPracticeLine={handleListenPracticeLine}
              isBookmarked={isBookmarked}
              onToggleBookmark={onToggleBookmark}
            />
          );
        }

        if (isVocabulary) {
          const handleStartGrammar = () => {
            if (dayNumber) {
              navigate(`/daily-lessons/day/${dayNumber}/section/grammar`);
            } else if (id) {
              navigate(`/lesson/${id}/section/grammar`);
            }
          };

          return (
            <div className="max-w-3xl mx-auto w-full space-y-6">
              {/* Card for reading words */}
              <Card className="border border-slate-200 shadow-sm p-6 space-y-6 bg-white rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white px-3 py-1 rounded-bl-xl text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 shadow-sm">
                  <Sparkles size={11} /> Vocabulary
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Read Words</h2>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">Read, listen, and practice today's words to build vocabulary.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleListenAll}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 bg-white border-slate-200"
                    >
                      <Volume2 size={14} /> Listen All
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Word</th>
                        <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Meaning</th>
                        <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Example</th>
                        <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {parsedWords.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20 transition-colors">
                          <td className="p-3 font-bold text-indigo-600">
                            <div className="flex flex-col gap-1">
                              <span>{item.word}</span>
                              {knownWords[item.word] && (
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1 w-max">
                                  ✓ Known
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-slate-700 font-medium">{item.meaning}</td>
                          <td className="p-3 text-slate-500 italic">{item.example}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  handleListenPracticeLine(`${item.word}. ${item.meaning}. ${item.example}`);
                                  setVocabChecklist((prev: { readAll: boolean; listenAll: boolean; make2Sentences: boolean; completeQuiz: boolean }) => ({ ...prev, listenAll: true }));
                                }}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Listen pronunciation"
                              >
                                <Volume2 size={15} />
                              </button>
                              <button
                                onClick={() => {
                                  setKnownWords({
                                    ...knownWords,
                                    [item.word]: !knownWords[item.word]
                                  });
                                }}
                                className={`p-1 rounded border transition-colors ${knownWords[item.word]
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                    : "bg-white border-slate-200 text-slate-400 hover:text-slate-700"
                                  }`}
                                title={knownWords[item.word] ? "Mark as Need Practice" : "Mark as Known"}
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Practice Card */}
              <Card className="border border-slate-200 shadow-sm p-6 space-y-6 bg-white rounded-2xl">
                <h3 className="text-base font-bold text-slate-800 border-b border-slate-150 pb-3 flex items-center gap-2">
                  <span className="p-1 rounded bg-indigo-50 text-indigo-600">🎯</span>
                  Practice Today's Vocabulary
                </h3>

                {/* Internal switch for Make Sentences, Quick Quiz, Practice Pronunciation */}
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-150 gap-1">
                  <button
                    onClick={() => {
                      setSentenceState({ ...sentenceState, targetWord: sentenceState.targetWord || parsedWords[0]?.word || "" });
                      setQuizState(null);
                      setPronounceState({ ...pronounceState, targetWord: "" });
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${sentenceState.targetWord && !pronounceState.targetWord
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-800"
                      }`}
                  >
                    Make Sentences
                  </button>
                  <button
                    onClick={() => {
                      setSentenceState({ ...sentenceState, targetWord: "" });
                      setPronounceState({ ...pronounceState, targetWord: "" });
                      if (!quizState) {
                        handleGenerateQuiz();
                      }
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${quizState
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-800"
                      }`}
                  >
                    Quick Quiz
                  </button>
                  <button
                    onClick={() => {
                      setSentenceState({ ...sentenceState, targetWord: "" });
                      setQuizState(null);
                      setPronounceState({ ...pronounceState, targetWord: pronounceState.targetWord || parsedWords[0]?.word || "" });
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${pronounceState.targetWord
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-800"
                      }`}
                  >
                    Practice Pronunciation
                  </button>
                </div>

                {/* Quiz Sub-Section */}
                {quizState && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide block">Question</span>
                      <p className="text-sm font-semibold text-slate-800">{quizState.question}</p>

                      <div className="space-y-2 pt-1">
                        {quizState.choices.map((choice, i) => (
                          <label
                            key={i}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${quizState.selectedAnswer === choice
                                ? "bg-indigo-50/50 border-indigo-200 text-indigo-900"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50/50"
                              }`}
                          >
                            <input
                              type="radio"
                              name="quiz-choice"
                              value={choice}
                              checked={quizState.selectedAnswer === choice}
                              disabled={quizState.checked}
                              onChange={(e) => setQuizState({ ...quizState, selectedAnswer: e.target.value })}
                              className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded-full"
                            />
                            <span className="text-sm font-medium">{choice}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {quizState.checked && (
                      <div className={`p-4 rounded-xl border flex flex-col gap-2 ${quizState.isCorrect
                          ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                          : "bg-rose-50 border-rose-100 text-rose-800"
                        }`}>
                        <div className="flex items-center gap-2 font-bold text-sm">
                          {quizState.isCorrect ? "✓ Correct!" : "✗ Incorrect"}
                        </div>
                        <p className="text-xs leading-relaxed font-semibold">{quizState.feedback}</p>

                        {!quizState.isCorrect && !quizState.mistakeSaved && (
                          <Button
                            onClick={handleSaveQuizMistake}
                            variant="outline"
                            size="sm"
                            className="self-start mt-1 bg-white border-rose-200 text-rose-700 hover:bg-rose-50"
                          >
                            Save Word to Mistakes
                          </Button>
                        )}
                        {!quizState.isCorrect && quizState.mistakeSaved && (
                          <span className="text-xs font-bold text-rose-600 self-start mt-1">
                            ✓ Saved to Mistakes Log
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {!quizState.checked ? (
                        <Button
                          onClick={handleCheckQuizAnswer}
                          disabled={!quizState.selectedAnswer}
                          className="flex-1"
                        >
                          Submit Answer
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleGenerateQuiz()}
                          variant="outline"
                          className="flex-1 bg-white"
                        >
                          Next Question
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Make Sentences Sub-Section */}
                {sentenceState.targetWord && !pronounceState.targetWord && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Select Word</label>
                      <select
                        value={sentenceState.targetWord}
                        onChange={(e) => setSentenceState({ ...sentenceState, targetWord: e.target.value, checked: false, feedback: null })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold bg-white"
                      >
                        {parsedWords.map((item, idx) => (
                          <option key={idx} value={item.word}>{item.word}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Write your sentence</label>
                      <textarea
                        value={sentenceState.sentenceText}
                        onChange={(e) => setSentenceState({ ...sentenceState, sentenceText: e.target.value, checked: false, feedback: null })}
                        placeholder={`Write a sentence using the word "${sentenceState.targetWord}"...`}
                        rows={3}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium bg-white"
                      />
                    </div>

                    {sentenceState.checked && (
                      <div className={`p-4 rounded-xl border ${sentenceState.isCorrect
                          ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                          : "bg-amber-50 border-amber-100 text-amber-800"
                        }`}>
                        <div className="flex items-center gap-2 font-bold text-sm mb-1">
                          {sentenceState.isCorrect ? "✓ Checked Successfully!" : "⚠ Review Tip"}
                        </div>
                        <p className="text-xs leading-relaxed font-semibold">{sentenceState.feedback}</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <span className="text-xs font-bold text-slate-500">
                        Goal: Make 2 sentences ({sentenceState.successCount}/2 completed)
                      </span>
                      <Button
                        onClick={handleCheckSentence}
                        disabled={!sentenceState.sentenceText.trim()}
                        className="w-full sm:w-auto"
                      >
                        Check Sentence
                      </Button>
                    </div>
                  </div>
                )}

                {/* Pronunciation Sub-Section */}
                {pronounceState.targetWord && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Select Word</label>
                      <select
                        value={pronounceState.targetWord}
                        onChange={(e) => setPronounceState({ ...pronounceState, targetWord: e.target.value, feedback: null })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold bg-white"
                      >
                        {parsedWords.map((item, idx) => (
                          <option key={idx} value={item.word}>{item.word}</option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 flex flex-col items-center justify-center text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Target Word</p>
                      <p className="text-2xl font-black text-indigo-600">{pronounceState.targetWord}</p>

                      {pronounceState.feedback && (
                        <p className="text-sm font-semibold text-slate-700 bg-white border border-slate-100 p-2.5 rounded-lg max-w-md mt-2">
                          {pronounceState.feedback}
                        </p>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleListenPracticeLine(pronounceState.targetWord)}
                          variant="outline"
                          size="sm"
                          className="bg-white border-slate-200"
                        >
                          <Volume2 size={13} /> Listen Target
                        </Button>
                        <Button
                          onClick={handleStartSpeakVocab}
                          disabled={pronounceState.isListening}
                          size="sm"
                          className="flex items-center gap-1 bg-indigo-600 text-white"
                        >
                          <Mic size={13} /> {pronounceState.isListening ? "Listening..." : "Practice Pronunciation"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Vocabulary Coach Card */}
              <Card className="border border-slate-200 shadow-sm p-6 space-y-4 bg-white rounded-2xl">
                <h3 className="text-base font-bold text-slate-800 border-b border-slate-150 pb-3 flex items-center gap-2">
                  <span className="p-1 rounded bg-indigo-50 text-indigo-600">💬</span>
                  Vocabulary Coach
                </h3>

                {/* Chat Log */}
                <div className="max-h-60 overflow-y-auto space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  {vocabCoachChat.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${msg.sender === "user"
                          ? "bg-indigo-600 text-white self-end ml-auto"
                          : "bg-white border border-slate-200/80 text-slate-800 self-start mr-auto shadow-sm"
                        }`}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wider mb-1 opacity-70">
                        {msg.sender === "user" ? "You" : "Coach"}
                      </span>
                      <p className="whitespace-pre-line font-medium">{msg.text}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={vocabCoachInput}
                      onChange={(e) => setVocabCoachInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAskCoach()}
                      placeholder="Ask about today's words..."
                      className="flex-1 px-4 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium bg-white"
                    />
                    <Button onClick={() => handleAskCoach()} disabled={!vocabCoachInput.trim()}>
                      Ask Coach
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-xs text-slate-400 font-bold self-center mr-1">Quick Actions:</span>
                    <button
                      onClick={() => handleAskCoach(undefined, sentenceState.targetWord || parsedWords[0]?.word)}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Explain Word
                    </button>
                    <button
                      onClick={() => handleAskCoach(`Give examples for "${sentenceState.targetWord || parsedWords[0]?.word}"`)}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Give Examples
                    </button>
                    <button
                      onClick={() => handleAskCoach(`Check my sentence: "${sentenceState.sentenceText || 'Please type a sentence first.'}"`)}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Check My Sentence
                    </button>
                    <button
                      onClick={() => handleAskCoach(`Ask Quiz for "${sentenceState.targetWord || parsedWords[0]?.word}"`)}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Ask Quiz
                    </button>
                  </div>
                </div>
              </Card>

              {/* Weak Words Card */}
              {weakWords.length > 0 && (
                <Card className="border border-rose-200 shadow-sm p-5 bg-rose-50/20 rounded-2xl space-y-3">
                  <h3 className="text-sm font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertCircle className="text-rose-600 h-5 w-5" />
                    🎯 Weak Words (Need Focus)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">These words were incorrect in your quiz. Click a word to ask the coach for assistance, or clear once confident.</p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {weakWords.map((word, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-white border border-rose-100 rounded-xl shadow-sm text-xs font-bold text-rose-800 hover:border-rose-350 transition-colors"
                      >
                        <span className="cursor-pointer" onClick={() => handleAskCoach(undefined, word)}>
                          {word}
                        </span>
                        <button
                          onClick={() => setWeakWords(weakWords.filter(w => w !== word))}
                          className="p-0.5 rounded-full hover:bg-rose-50 text-rose-450 hover:text-rose-600 font-bold"
                          title="Remove Word"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Checklist Card */}
              <Card className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Vocabulary Checklist</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={vocabChecklist.readAll}
                      onChange={(e) => setVocabChecklist({ ...vocabChecklist, readAll: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                    />
                    <span className={`text-sm ${vocabChecklist.readAll ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold"}`}>
                      Read all words
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={vocabChecklist.listenAll}
                      onChange={(e) => setVocabChecklist({ ...vocabChecklist, listenAll: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                    />
                    <span className={`text-sm ${vocabChecklist.listenAll ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold"}`}>
                      Listen pronunciation
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={vocabChecklist.make2Sentences}
                      onChange={(e) => setVocabChecklist({ ...vocabChecklist, make2Sentences: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                    />
                    <span className={`text-sm ${vocabChecklist.make2Sentences ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold"}`}>
                      Make 2 sentences ({sentenceState.successCount >= 2 ? "2" : sentenceState.successCount}/2)
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={vocabChecklist.completeQuiz}
                      onChange={(e) => setVocabChecklist({ ...vocabChecklist, completeQuiz: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                    />
                    <span className={`text-sm ${vocabChecklist.completeQuiz ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold"}`}>
                      Complete quick quiz
                    </span>
                  </label>
                </div>
              </Card>

              {/* Complete Section Button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                <Button
                  onClick={handleMarkComplete}
                  className="flex-1 flex items-center justify-center gap-2"
                  variant={progress?.completed ? "secondary" : "primary"}
                >
                  {progress?.completed ? (
                    <>
                      <CheckCircle className="text-emerald-500 h-5 w-5" />
                      Section Completed ✓
                    </>
                  ) : (
                    "Mark Section Complete"
                  )}
                </Button>
                {progress?.completed && (
                  <Button
                    onClick={handleStartGrammar}
                    className="flex-1 flex items-center justify-center gap-1.5"
                    variant="outline"
                  >
                    Start Grammar <ArrowRight size={15} />
                  </Button>
                )}
              </div>
            </div>
          );
        }

        const isGrammar = sectionData && sectionData.heading.toLowerCase().includes("grammar");
        if (isGrammar) {
          const handleStartSpeakingDrill = async () => {
            let nextSlug = "speaking-drill";
            try {
              let rawContent = "";
              let dayNum: number | null = null;
              if (dayNumber) {
                dayNum = Number(dayNumber);
                const lessons = await dailyLessonService.getByDay(dayNum);
                if (lessons && lessons[0]) rawContent = lessons[0].rawContent;
              } else if (id) {
                const lesson = await lessonService.getLesson(id);
                if (lesson) {
                  rawContent = lesson.rawContent;
                  dayNum = lesson.dayNumber;
                }
              }
              if (rawContent) {
                const sections = lessonService.splitIntoSections(rawContent, dayNum);
                const grammarIdx = sections.findIndex(s => s.heading.toLowerCase().includes("grammar"));
                if (grammarIdx !== -1 && grammarIdx + 1 < sections.length) {
                  nextSlug = sections[grammarIdx + 1].heading.toLowerCase().replace(/[^a-z0-9]/g, "-");
                }
              }
            } catch (e) {
              console.error(e);
            }

            if (dayNumber) {
              navigate(`/daily-lessons/day/${dayNumber}/section/${nextSlug}`);
            } else if (id) {
              navigate(`/lesson/${id}/section/${nextSlug}`);
            }
          };

          const ruleLines = sectionData.body.split("\n")
            .map(l => l.trim())
            .filter(l => l && !l.toLowerCase().includes("example") && !l.includes("1.") && !l.includes("2.") && !l.includes("3."));

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">

                {/* Grammar Explanation Card */}
                <Card className="border border-slate-200 shadow-sm p-6 space-y-4 bg-white rounded-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">📖</span>
                      Grammar Rule & Explanation
                    </h2>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={grammarChecklist.readRule}
                        onChange={(e) => setGrammarChecklist({ ...grammarChecklist, readRule: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-500">Mark Read</span>
                    </label>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {sectionData.body.split("Examples")[0] || sectionData.body}
                    </p>
                  </div>

                  {ruleLines.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Rule Breakdown</span>
                      <div className="grid grid-cols-1 gap-2">
                        {ruleLines.map((line, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 p-3 bg-indigo-50/20 border border-indigo-100/30 rounded-xl">
                            <span className="text-indigo-500 mt-0.5">•</span>
                            <p className="text-xs font-bold text-slate-600 leading-relaxed">{line.replace(/^[-*•]\s*/, "")}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Examples Card */}
                <Card className="border border-slate-200 shadow-sm p-6 space-y-4 bg-white rounded-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
                    <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">💡</span>
                      Grammar Examples
                    </h2>
                    <div className="flex gap-2">
                      <Button onClick={handleListenAllGrammar} size="sm" variant="outline" className="flex items-center gap-1">
                        <Volume2 size={13} /> Listen All
                      </Button>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={grammarChecklist.understandExamples}
                          onChange={(e) => setGrammarChecklist({ ...grammarChecklist, understandExamples: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-500">Understood</span>
                      </label>
                    </div>
                  </div>

                  {grammarExamples.length > 0 ? (
                    <div className="space-y-2">
                      {grammarExamples.map((ex, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:bg-slate-100/30">
                          <p className="text-sm font-bold text-slate-700">
                            <span className="text-indigo-500 mr-1.5 font-extrabold">{idx + 1}.</span>
                            {ex}
                          </p>
                          <button
                            onClick={() => handleListenPracticeLine(ex)}
                            className="p-1.5 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 shadow-sm transition-colors"
                          >
                            <Volume2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No grammar examples found for today's lesson.</p>
                  )}
                </Card>

                {/* Practice Card */}
                <Card className="border border-slate-200 shadow-sm p-6 space-y-6 bg-white rounded-2xl">
                  <h3 className="text-base font-bold text-slate-800 border-b border-slate-150 pb-3 flex items-center gap-2">
                    <span className="p-1 rounded bg-indigo-50 text-indigo-600">🎯</span>
                    Practice Exercises
                  </h3>

                  <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-150 gap-1">
                    <button
                      onClick={() => setGrammarPracticeTab("identify")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${grammarPracticeTab === "identify"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-600 hover:text-slate-800"
                        }`}
                    >
                      Identify Parts
                    </button>
                    <button
                      onClick={() => setGrammarPracticeTab("make")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${grammarPracticeTab === "make"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-600 hover:text-slate-800"
                        }`}
                    >
                      Make Sentence
                    </button>
                    <button
                      onClick={() => setGrammarPracticeTab("fix")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${grammarPracticeTab === "fix"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-600 hover:text-slate-800"
                        }`}
                    >
                      Fix Sentence
                    </button>
                    <button
                      onClick={() => setGrammarPracticeTab("quiz")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${grammarPracticeTab === "quiz"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-600 hover:text-slate-800"
                        }`}
                    >
                      Quick Quiz
                    </button>
                  </div>

                  {/* Tab Contents */}
                  {grammarPracticeTab === "identify" && grammarIdentify && (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                        <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Exercise: Identify Parts of Speech</span>
                        <p className="text-sm font-bold text-slate-800">
                          Identify the part of speech for the word <strong className="text-indigo-600">"{grammarIdentify.targetWord}"</strong> in:
                        </p>
                        <p className="text-base font-bold text-slate-900 mt-2 italic">
                          "{grammarIdentify.sentence}"
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {grammarIdentify.choices.map((choice, i) => (
                          <button
                            key={i}
                            disabled={grammarIdentify.checked}
                            onClick={() => setGrammarIdentify({ ...grammarIdentify, selectedAnswer: choice })}
                            className={`py-2 text-xs font-bold rounded-xl border transition-all ${grammarIdentify.selectedAnswer === choice
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                          >
                            {choice}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          disabled={!grammarIdentify.selectedAnswer || grammarIdentify.checked}
                          onClick={handleCheckGrammarIdentify}
                          className="flex-1"
                        >
                          Check Answer
                        </Button>
                        <Button onClick={handleGenerateGrammarIdentify} variant="outline">
                          Next Question
                        </Button>
                      </div>

                      {grammarIdentify.feedback && (
                        <div className={`p-3.5 rounded-xl border text-xs font-bold ${grammarIdentify.isCorrect
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-rose-50 border-rose-200 text-rose-700"
                          }`}>
                          {grammarIdentify.feedback}
                        </div>
                      )}
                    </div>
                  )}

                  {grammarPracticeTab === "make" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                        <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Exercise: Make a Sentence</span>
                        <p className="text-xs text-slate-500 font-bold">
                          Write a sentence using the grammar rule. Target: make 2 correct sentences. Success count: {grammarSentence.successCount}/2.
                        </p>
                      </div>

                      <textarea
                        value={grammarSentence.inputText}
                        onChange={(e) => setGrammarSentence({ ...grammarSentence, inputText: e.target.value, checked: false, feedback: null })}
                        placeholder="Write your sentence here..."
                        className="w-full h-24 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold bg-white"
                      />

                      <Button onClick={handleCheckGrammarSentence} className="w-full">
                        Check Sentence
                      </Button>

                      {grammarSentence.feedback && (
                        <div className={`p-3.5 rounded-xl border text-xs font-bold ${grammarSentence.isCorrect
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-rose-50 border-rose-200 text-rose-700"
                          }`}>
                          {grammarSentence.feedback}
                        </div>
                      )}
                    </div>
                  )}

                  {grammarPracticeTab === "fix" && grammarFix && (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                        <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Exercise: Fix the Sentence</span>
                        <p className="text-xs text-slate-500 font-bold mb-2">Find the mistake and rewrite the correct sentence:</p>
                        <p className="text-sm font-bold text-rose-600 line-through">
                          "{grammarFix.wrongSentence}"
                        </p>
                      </div>

                      <input
                        type="text"
                        value={grammarFix.inputText}
                        onChange={(e) => setGrammarFix({ ...grammarFix, inputText: e.target.value, checked: false, feedback: null })}
                        placeholder="Type corrected sentence..."
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold bg-white"
                      />

                      <div className="flex gap-2">
                        <Button disabled={!grammarFix.inputText.trim() || grammarFix.checked} onClick={handleCheckGrammarFix} className="flex-1">
                          Verify Correction
                        </Button>
                        <Button onClick={handleGenerateGrammarFix} variant="outline">
                          Next Sentence
                        </Button>
                      </div>

                      {grammarFix.feedback && (
                        <div className={`p-3.5 rounded-xl border text-xs font-bold ${grammarFix.isCorrect
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-rose-50 border-rose-200 text-rose-700"
                          }`}>
                          {grammarFix.feedback}
                        </div>
                      )}
                    </div>
                  )}

                  {grammarPracticeTab === "quiz" && grammarQuiz && (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                        <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Exercise: Grammar Quiz</span>
                        <p className="text-sm font-bold text-slate-800">{grammarQuiz.question}</p>
                      </div>

                      <div className="space-y-2">
                        {grammarQuiz.choices.map((choice, i) => (
                          <button
                            key={i}
                            disabled={grammarQuiz.checked}
                            onClick={() => setGrammarQuiz({ ...grammarQuiz, selectedAnswer: choice, feedback: null })}
                            className={`w-full text-left p-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-between ${grammarQuiz.selectedAnswer === choice
                                ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                          >
                            <span>{choice}</span>
                            {grammarQuiz.checked && choice === grammarQuiz.correctAnswer && (
                              <span className="text-emerald-600 font-extrabold text-[10px]">CORRECT ✓</span>
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          disabled={!grammarQuiz.selectedAnswer || grammarQuiz.checked}
                          onClick={handleCheckGrammarQuiz}
                          className="flex-1"
                        >
                          Submit Answer
                        </Button>
                        <Button onClick={handleGenerateGrammarQuiz} variant="outline">
                          Next Question
                        </Button>
                      </div>

                      {grammarQuiz.feedback && (
                        <div className={`p-3.5 rounded-xl border text-xs font-bold ${grammarQuiz.isCorrect
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-rose-50 border-rose-200 text-rose-700"
                          }`}>
                          <div className="flex flex-col gap-2">
                            <span>{grammarQuiz.feedback}</span>
                            {!grammarQuiz.isCorrect && !grammarQuiz.mistakeSaved && (
                              <Button onClick={handleSaveGrammarQuizMistake} size="sm" variant="outline" className="self-start text-[10px]">
                                Save Mistake to Log
                              </Button>
                            )}
                            {grammarQuiz.mistakeSaved && (
                              <span className="text-[10px] text-rose-500 font-extrabold">Saved to Mistakes Log!</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* Pronunciation Practice Card */}
                <Card className="border border-slate-200 shadow-sm p-6 space-y-4 bg-white rounded-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
                    <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">🎙️</span>
                      Pronunciation Drill
                    </h2>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={grammarChecklist.practicePronounce}
                        onChange={(e) => setGrammarChecklist({ ...grammarChecklist, practicePronounce: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-500">Pronounced</span>
                    </label>
                  </div>

                  {grammarExamples.length > 0 ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-400 font-bold block mb-1.5">Select a sentence to repeat:</label>
                        <select
                          value={grammarPronounce.targetSentence}
                          onChange={(e) => setGrammarPronounce({ targetSentence: e.target.value, feedback: null, isListening: false })}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700"
                        >
                          {grammarExamples.map((ex, idx) => (
                            <option key={idx} value={ex}>
                              {idx + 1}. {ex}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="p-4 bg-indigo-50/20 border border-indigo-100/20 rounded-xl text-center">
                        <p className="text-sm font-bold text-slate-700">"{grammarPronounce.targetSentence}"</p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleListenPracticeLine(grammarPronounce.targetSentence)}
                          variant="outline"
                          size="sm"
                          className="flex-1 flex items-center justify-center gap-1"
                        >
                          <Volume2 size={14} /> Listen Sentence
                        </Button>
                        <Button
                          onClick={() => handleStartSpeakGrammar(grammarPronounce.targetSentence)}
                          size="sm"
                          className={`flex-1 flex items-center justify-center gap-1 ${grammarPronounce.isListening ? "bg-rose-500 hover:bg-rose-600 animate-pulse text-white" : ""
                            }`}
                        >
                          <Mic size={14} /> {grammarPronounce.isListening ? "Listening..." : "Repeat After Me"}
                        </Button>
                      </div>

                      {grammarPronounce.feedback && (
                        <div className={`p-4 rounded-2xl border space-y-3 ${grammarPronounce.status === "Good" || (grammarPronounce.feedback && grammarPronounce.feedback.toLowerCase().includes("good"))
                            ? "bg-emerald-50/50 border-emerald-100 text-emerald-900"
                            : "bg-rose-50/50 border-rose-100 text-rose-900"
                          }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Practice Result</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${grammarPronounce.status === "Good" || (grammarPronounce.feedback && grammarPronounce.feedback.toLowerCase().includes("good"))
                                ? "bg-emerald-100/80 border-emerald-200 text-emerald-800"
                                : "bg-rose-100/80 border-rose-200 text-rose-800"
                              }`}>
                              {grammarPronounce.status || (grammarPronounce.feedback && grammarPronounce.feedback.toLowerCase().includes("good") ? "Good" : "Needs Practice")}
                            </span>
                          </div>

                          <div className="text-xs space-y-1">
                            {grammarPronounce.transcript && (
                              <p className="font-semibold text-slate-600">
                                <span className="text-slate-400 font-bold">You spoke:</span> "{grammarPronounce.transcript}"
                              </p>
                            )}
                            <p className="font-semibold text-[11px] leading-relaxed">
                              {grammarPronounce.feedback}
                            </p>
                          </div>

                          {grammarPronounce.weakWords && grammarPronounce.weakWords.length > 0 && (
                            <div className="pt-2 border-t border-rose-100/60 space-y-1.5">
                              <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider">Weak Pronunciation Words:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {grammarPronounce.weakWords.map((w, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-rose-100/60 text-rose-800 text-[10px] font-bold rounded">
                                    {w}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No sentences loaded to practice.</p>
                  )}
                </Card>
              </div>

              {/* Right Column (1/3 width) */}
              <div className="space-y-6">

                {/* Grammar Coach Card */}
                <Card className="border border-slate-200 shadow-sm p-6 space-y-4 bg-white rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-indigo-500 text-white px-3 py-1 rounded-bl-xl text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 shadow-sm">
                    <Sparkles size={11} /> AI Tutor
                  </div>

                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <span>🤖</span> Grammar Coach
                  </h3>

                  {/* Chat interface */}
                  <div className="h-64 border border-slate-100 rounded-xl p-3 overflow-y-auto space-y-2 bg-slate-50/50">
                    {grammarCoachChat.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`p-2.5 rounded-xl text-xs font-semibold leading-relaxed max-w-[90%] shadow-sm ${msg.sender === "user"
                            ? "bg-indigo-600 text-white rounded-tr-none"
                            : "bg-white border border-slate-100 text-slate-700 rounded-tl-none whitespace-pre-line"
                          }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coach actions grid */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleAskGrammarCoach("", "explain_rule")}
                      className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100/50 transition-colors"
                    >
                      Explain Rule
                    </button>
                    <button
                      onClick={() => handleAskGrammarCoach("", "give_examples")}
                      className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100/50 transition-colors"
                    >
                      Give Examples
                    </button>
                    <button
                      onClick={() => handleAskGrammarCoach("", "identify_parts")}
                      className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100/50 transition-colors"
                    >
                      Identify Parts
                    </button>
                    <button
                      onClick={() => handleAskGrammarCoach("", "fix_sentence")}
                      className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100/50 transition-colors"
                    >
                      Fix Sentence
                    </button>
                    <button
                      onClick={() => handleAskGrammarCoach("", "generate_quiz")}
                      className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100/50 transition-colors"
                    >
                      Ask Quiz
                    </button>
                    <button
                      onClick={() => handleAskGrammarCoach("", "pronunciation_help")}
                      className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100/50 transition-colors"
                    >
                      Pronunciation Help
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={grammarCoachInput}
                      onChange={(e) => setGrammarCoachInput(e.target.value)}
                      placeholder="Ask about this grammar rule..."
                      onKeyDown={(e) => e.key === "Enter" && handleAskGrammarCoach()}
                      className="flex-1 p-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                    />
                    <Button onClick={() => handleAskGrammarCoach()} size="sm">
                      Ask
                    </Button>
                  </div>
                </Card>

                {/* Unified Focus Area (Weak Points Tracker) Card */}
                {(grammarWeakPoints.length > 0 || weakGrammarPoints.length > 0) && (
                  <Card className="border border-rose-200 shadow-sm p-4 space-y-4 bg-rose-50/30 rounded-2xl">
                    <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                      <h4 className="text-xs font-black uppercase text-rose-600 tracking-wider flex items-center gap-1.5">
                        <span>🎯</span> Focus Area
                      </h4>
                      <span className="text-[10px] font-bold text-rose-400 bg-white border border-rose-100 rounded px-1.5 py-0.5">
                        Focus Area
                      </span>
                    </div>

                    {weakGrammarPoints.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Grammar Topics to Review:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {weakGrammarPoints.map((topic, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleAskGrammarCoach(`Explain grammar concept: "${topic}"`)}
                              className="px-2 py-1 bg-white border border-rose-100 hover:bg-rose-50 hover:border-rose-200 text-rose-700 text-[10px] font-bold rounded-full transition-all shadow-sm/10 flex items-center gap-1.5"
                              title="Click to ask Grammar Coach for help"
                            >
                              <span>📝</span> {topic}
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setWeakGrammarPoints(prev => prev.filter(t => t !== topic));
                                }}
                                className="text-rose-400 hover:text-rose-700 font-extrabold w-3 h-3 flex items-center justify-center rounded-full hover:bg-rose-100"
                              >
                                ×
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {grammarWeakPoints.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Pronunciation Focus Words:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {grammarWeakPoints.map((word, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleAskGrammarCoach(`Help me pronounce "${word}"`)}
                              className="px-2 py-1 bg-white border border-rose-100 hover:bg-rose-50 hover:border-rose-200 text-rose-700 text-[10px] font-bold rounded-full transition-all shadow-sm/10 flex items-center gap-1.5"
                              title="Click to ask Grammar Coach for help"
                            >
                              <span>🔊</span> {word}
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setGrammarWeakPoints(prev => prev.filter(w => w !== word));
                                }}
                                className="text-rose-400 hover:text-rose-700 font-extrabold w-3 h-3 flex items-center justify-center rounded-full hover:bg-rose-100"
                              >
                                ×
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Grammar Checklist Card */}
                <Card className="border border-slate-200 shadow-sm p-6 space-y-4 bg-white rounded-2xl">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Grammar Checklist</h3>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={grammarChecklist.readRule}
                        onChange={(e) => setGrammarChecklist({ ...grammarChecklist, readRule: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                      />
                      <span className={`text-xs ${grammarChecklist.readRule ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold"}`}>
                        Read grammar rule
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={grammarChecklist.understandExamples}
                        onChange={(e) => setGrammarChecklist({ ...grammarChecklist, understandExamples: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                      />
                      <span className={`text-xs ${grammarChecklist.understandExamples ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold"}`}>
                        Understand examples
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={grammarChecklist.make2Sentences}
                        onChange={(e) => setGrammarChecklist({ ...grammarChecklist, make2Sentences: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                      />
                      <span className={`text-xs ${grammarChecklist.make2Sentences ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold"}`}>
                        Make 2 sentences ({grammarSentence.successCount}/2)
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={grammarChecklist.practicePronounce}
                        onChange={(e) => setGrammarChecklist({ ...grammarChecklist, practicePronounce: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                      />
                      <span className={`text-xs ${grammarChecklist.practicePronounce ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold"}`}>
                        Practice pronunciation
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={grammarChecklist.completeQuiz}
                        onChange={(e) => setGrammarChecklist({ ...grammarChecklist, completeQuiz: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                      />
                      <span className={`text-xs ${grammarChecklist.completeQuiz ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold"}`}>
                        Complete quick quiz
                      </span>
                    </label>
                  </div>
                </Card>

                {/* Mark Section Complete & Next Navigation */}
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={handleMarkComplete}
                    className="w-full flex items-center justify-center gap-2"
                    variant={progress?.completed ? "secondary" : "primary"}
                  >
                    {progress?.completed ? (
                      <>
                        <CheckCircle className="text-emerald-500 h-5 w-5" />
                        Section Completed ✓
                      </>
                    ) : (
                      "Mark Section Complete"
                    )}
                  </Button>
                  {progress?.completed && (
                    <Button
                      onClick={handleStartSpeakingDrill}
                      className="w-full flex items-center justify-center gap-1.5"
                      variant="outline"
                    >
                      Start Speaking Drill <ArrowRight size={15} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        }

        if (isTimeTable) {
          const handleStartVocabulary = () => {
            if (dayNumber) {
              navigate(`/daily-lessons/day/${dayNumber}/section/vocabulary`);
            } else if (id) {
              navigate(`/lesson/${id}/section/vocabulary`);
            }
          };

          return (
            <div className="max-w-3xl mx-auto w-full">
              <Card className="border border-slate-200 shadow-sm p-6 space-y-6 bg-white rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white px-3 py-1 rounded-bl-xl text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 shadow-sm">
                  <Sparkles size={11} /> Study Plan
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Today's Time Table</h2>
                    <p className="text-sm font-semibold text-indigo-600 mt-1">
                      Total Time: {(isEditing ? tempActivities : activities).reduce((sum, a) => sum + a.duration, 0)} minutes
                    </p>
                  </div>
                  {!isEditing ? (
                    <Button onClick={() => {
                      setTempActivities(activities);
                      setIsEditing(true);
                    }} variant="outline" size="sm">
                      Customize Time
                    </Button>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleSaveTimeTable} size="sm">
                        Save Time Table
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" size="sm">
                        Cancel
                      </Button>
                      <Button onClick={handleResetDefault} variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50">
                        Reset Default
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {isEditing ? (
                    tempActivities.map((act, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:bg-slate-100/50">
                        <span className="text-sm font-semibold text-slate-700">{act.name}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={act.duration === 0 ? "" : act.duration}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              const updated = [...tempActivities];
                              if (isNaN(val)) {
                                updated[idx] = { ...act, duration: 0 };
                              } else {
                                updated[idx] = { ...act, duration: Math.max(0, Math.min(60, val)) };
                              }
                              setTempActivities(updated);
                            }}
                            onBlur={() => {
                              const updated = tempActivities.map(a => ({
                                ...a,
                                duration: a.duration < 1 ? 5 : a.duration
                              }));
                              setTempActivities(updated);
                            }}
                            className="w-20 text-center text-sm font-bold px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                          />
                          <span className="text-xs text-slate-400 font-semibold">min</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    activities.map((act, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100/30">
                        <span className="text-sm font-medium text-slate-700">{act.name}</span>
                        <span className="text-sm font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                          {act.duration} min
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4 space-y-1">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Study Tip</span>
                  <p className="text-sm text-amber-700 leading-relaxed font-medium">
                    Complete activities in order. Start with vocabulary, then grammar, then practice.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Checklist</span>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={checklist.read}
                        onChange={(e) => setChecklist({ ...checklist, read: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                      />
                      <span className={`text-sm ${checklist.read ? "line-through text-slate-400 font-medium" : "text-slate-700 font-semibold"}`}>
                        Read Time Table
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={checklist.understand}
                        onChange={(e) => setChecklist({ ...checklist, understand: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                      />
                      <span className={`text-sm ${checklist.understand ? "line-through text-slate-400 font-medium" : "text-slate-700 font-semibold"}`}>
                        Understand Study Plan
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                  <Button
                    onClick={handleMarkComplete}
                    className="flex-1 flex items-center justify-center gap-2"
                    variant={progress?.completed ? "secondary" : "primary"}
                  >
                    {progress?.completed ? (
                      <>
                        <CheckCircle className="text-emerald-500 h-5 w-5" />
                        Section Completed ✓
                      </>
                    ) : (
                      "Mark Section Complete"
                    )}
                  </Button>
                  {progress?.completed && (
                    <Button
                      onClick={handleStartVocabulary}
                      className="flex-1 flex items-center justify-center gap-1.5"
                      variant="outline"
                    >
                      Start Vocabulary <ArrowRight size={15} />
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          );
        }

        const isQASection = sectionData.heading.toLowerCase().includes("question") ||
                            sectionData.heading.toLowerCase().includes("q&a") ||
                            sectionData.heading.toLowerCase().includes("answers");
        const isSpeakingSection = sectionData.heading.toLowerCase().includes("speaking drill") ||
                                  sectionData.heading.toLowerCase().includes("speaking");
        const isConversationSection = sectionData.heading.toLowerCase().includes("conversation");
        const isHomeworkSection = sectionData.heading.toLowerCase().includes("homework");
        const isSelfCheckSection = sectionData.heading.toLowerCase().includes("self check") || sectionData.heading.toLowerCase().includes("self-check");
        const isPreviewSection = sectionData.heading.toLowerCase().includes("preview");
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
               {/* Large Content Banner */}
              <Card className="border border-slate-200/60 overflow-hidden relative shadow-sm">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white px-3 py-1 rounded-bl-xl text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 shadow-sm">
                  <Sparkles size={11} /> Study Reference
                </div>

                <div className="p-5 md:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                      <Bookmark size={16} className="text-indigo-600" />
                      {sectionData.heading}
                    </h2>
                  </div>

                  <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-4 md:p-5">
                    {renderSectionContent(sectionData.heading, sectionData.body)}
                  </div>

                  {!isSpeakingSection && !isConversationSection && (
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <button
                        onClick={handleSpeak}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all border ${isSpeaking
                          ? "bg-rose-50 text-rose-600 border-rose-100 animate-pulse"
                          : "bg-indigo-50 text-indigo-600 border-indigo-100/50 hover:bg-indigo-100"
                          }`}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX size={15} /> Stop Speaking
                          </>
                        ) : (
                          <>
                            <Volume2 size={15} /> Listen Section
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Difficult Sentence Saver */}
                  {!isQASection && !isSpeakingSection && !isConversationSection && !linkedNote && (
                    <div className="border-t border-slate-100 pt-4 mt-3 space-y-3">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Sparkles size={14} className="text-indigo-500 animate-pulse" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Save Difficult Sentence to notebook</h3>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sentence</label>
                          <input
                            type="text"
                            placeholder="Paste or type the difficult sentence here..."
                            value={diffSentence}
                            onChange={(e) => setDiffSentence(e.target.value)}
                            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Meaning / Translation</label>
                          <input
                            type="text"
                            placeholder="Add explanation or translation..."
                            value={diffMeaning}
                            onChange={(e) => setDiffMeaning(e.target.value)}
                            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white transition-colors"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={handleSaveSentence}
                          disabled={!diffSentence.trim() || sentenceSaved}
                          className={`text-[10px] font-extrabold px-3 py-2 rounded-xl transition-all shadow-sm ${sentenceSaved
                            ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                            : "bg-indigo-600 border border-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            }`}
                        >
                          {sentenceSaved ? "✓ Saved to Study List!" : "Save Sentence to Notebook"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Tabs for Practice Area */}
              <div className="space-y-4">
                <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
                  {(isHomeworkSection
                    ? [
                        { id: "write", label: "Homework", icon: <PenTool size={15} /> },
                        { id: "notebook", label: "Notebook Notes", icon: <BookOpen size={15} /> },
                        { id: "mistakes", label: "Mistakes", icon: <AlertTriangle size={15} /> },
                      ]
                    : isSelfCheckSection
                    ? [
                        { id: "tips", label: "Self Check", icon: <CheckCircle size={15} /> },
                        { id: "notebook", label: "Notebook Notes", icon: <BookOpen size={15} /> },
                        { id: "mistakes", label: "Mistakes", icon: <AlertTriangle size={15} /> },
                      ]
                    : isPreviewSection
                    ? [
                        { id: "tips", label: "Day 3 Preview", icon: <Sparkles size={15} /> },
                        { id: "notebook", label: "Notebook Notes", icon: <BookOpen size={15} /> },
                      ]
                    : isSpeakingSection
                    ? [
                        { id: "tips", label: "Speaking Practice Tips", icon: <Lightbulb size={15} /> },
                        { id: "speak", label: "Speak Mode", icon: <Mic size={15} /> },
                        { id: "notebook", label: "Notebook Notes", icon: <BookOpen size={15} /> },
                        { id: "mistakes", label: "Mistakes", icon: <AlertTriangle size={15} /> },
                      ]
                    : isConversationSection
                    ? [
                        { id: "tips", label: "AI Tips", icon: <Lightbulb size={15} /> },
                        { id: "notebook", label: "Notebook Notes", icon: <BookOpen size={15} /> },
                        { id: "mistakes", label: "Mistakes", icon: <AlertTriangle size={15} /> },
                      ]
                    : [
                        { id: "tips", label: isQASection ? "Q&A Tips" : "AI Tips", icon: <Lightbulb size={15} /> },
                        { id: "write", label: "Write Mode", icon: <PenTool size={15} /> },
                        { id: "speak", label: "Speak Mode", icon: <Mic size={15} /> },
                        { id: "notebook", label: "Notebook Notes", icon: <BookOpen size={15} /> },
                        { id: "mistakes", label: "Mistakes", icon: <AlertTriangle size={15} /> },
                      ]
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-xs md:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                        }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab panels */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm/30">

                  {/* AI Tips Tab */}
                  {activeTab === "tips" && (() => {
                    if (isSelfCheckSection) {
                      const items = sectionData.body.split("\n").map(l => l.trim().replace(/^[•\-\*]\s*/, "")).filter(Boolean);
                      return (
                        <div className="space-y-4">
                          <Card className="border border-indigo-200 shadow-sm p-4 bg-indigo-50/10 rounded-2xl">
                            <h3 className="text-sm font-black text-indigo-700 tracking-wide uppercase mb-1">Self Check Tasks</h3>
                            <p className="text-sm text-slate-700 font-semibold">Verify your learning by checking the items you can confidently do.</p>
                          </Card>
                          
                          <div className="space-y-2.5 mt-4">
                            {items.map((item, idx) => {
                              const isChecked = !!checkedItems[idx];
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleToggleSelfCheckItem(idx)}
                                  className={`w-full flex items-center gap-3 p-3 border rounded-xl text-left transition-all ${isChecked
                                      ? "bg-emerald-50/50 border-emerald-200/50 text-emerald-800 font-bold"
                                      : "bg-slate-50/30 border-slate-100 text-slate-700 hover:bg-slate-50 font-bold"
                                    }`}
                                >
                                  <span className={`h-5 w-5 rounded-md flex items-center justify-center border transition-all ${isChecked ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-white"
                                    }`}>
                                    {isChecked && <Check size={12} className="stroke-[3]" />}
                                  </span>
                                  <span className="text-sm">{item}</span>
                                </button>
                              );
                            })}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-4">
                            <Button onClick={handleCheckLearning}>
                              Check Learning
                            </Button>
                          </div>
                          
                          {scFeedback && (
                            <div className="mt-4 border border-slate-100 rounded-2xl p-4 bg-slate-50/40 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${scFeedback.match === "Good"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                  : "bg-amber-50 text-amber-600 border border-amber-100"
                                  }`}>
                                  {scFeedback.match === "Good" ? (
                                    <><CheckCircle size={13} /> All Checked</>
                                  ) : (
                                    <><AlertCircle size={13} /> Needs Practice</>
                                  )}
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                                Mock AI Feedback — based on your checklist only.
                              </p>
                              <p className="text-sm text-slate-700 font-medium">
                                {scFeedback.hinglishTip}
                              </p>
                              
                              <div className="flex gap-2 pt-1">
                                {scFeedback.match === "Needs Practice" && (
                                  <Button size="sm" variant="secondary" onClick={handleSaveSCMistake}>
                                    Save note to mistakes
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={handleSaveSCNote} disabled={noteSaved}>
                                  {noteSaved ? "Saved ✓" : "Save as Note"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (isPreviewSection) {
                      return (
                        <div className="space-y-4">
                          <Card className="border border-indigo-200 shadow-sm p-4 bg-indigo-50/10 rounded-2xl">
                            <h3 className="text-sm font-black text-indigo-700 tracking-wide uppercase mb-1">Tomorrow's Preview</h3>
                            <p className="text-sm text-slate-700 font-semibold">{sectionData.body}</p>
                          </Card>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-4">
                            <Button onClick={handleListenPreview} variant="outline" className="flex items-center gap-1.5">
                              <Volume2 size={16} /> Listen Preview
                            </Button>
                            <Button onClick={handlePrepareForDay3} className="flex items-center gap-1.5">
                              <Sparkles size={16} /> Prepare for Day 3
                            </Button>
                            {sectionData.parentUrl && (
                              <Button
                                onClick={() => navigate(sectionData.parentUrl.replace(/day-\d+/, "day-3"))}
                                variant="secondary"
                                className="flex items-center gap-1.5"
                                disabled={!sectionData.parentUrl}
                              >
                                {sectionData.parentUrl ? "Open Day 3" : "Coming Soon"}
                              </Button>
                            )}
                          </div>
                          
                          {isPreparingDay3 && (
                            <div className="mt-4 border border-slate-100 rounded-2xl p-4 bg-slate-50/40 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                  <Sparkles size={13} /> Preparation Guide
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                                Mock AI Preparation — based on Day 3 preview only.
                              </p>
                              
                              <ul className="grid gap-2 pt-1">
                                <li className="flex items-start gap-2 text-sm text-slate-700 bg-white border border-slate-100 p-2.5 rounded-lg">
                                  <span className="text-indigo-500 font-bold">1.</span> Practice saying your name.
                                </li>
                                <li className="flex items-start gap-2 text-sm text-slate-700 bg-white border border-slate-100 p-2.5 rounded-lg">
                                  <span className="text-indigo-500 font-bold">2.</span> Practice where you are from.
                                </li>
                                <li className="flex items-start gap-2 text-sm text-slate-700 bg-white border border-slate-100 p-2.5 rounded-lg">
                                  <span className="text-indigo-500 font-bold">3.</span> Practice one simple self-introduction sentence.
                                </li>
                              </ul>
                              
                              <div className="pt-2">
                                <Button size="sm" variant="outline" onClick={handleSavePreviewNote} disabled={noteSaved}>
                                  {noteSaved ? "Saved ✓" : "Save as Note"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    const speakingTips = [
                      "Listen to the target sentence pronunciation multiple times before attempting to speak.",
                      "Break the sentence into small chunks and focus on smooth linking between words.",
                      "Speak slowly and clearly. Speed is less important than pronunciation clarity.",
                      "Record your speaking and compare your transcript with the target sentence.",
                      "Practice consistently every day to build speech muscle memory."
                    ];
                    const conversationTips = [
                      "Read the question carefully.",
                      "Reply in your own words.",
                      "Check with AI.",
                      "Try again with the better reply."
                    ];
                    const tipsToShow = isConversationSection ? conversationTips : (isSpeakingSection ? speakingTips : tips);
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-slate-800">
                              {isConversationSection ? "Conversation Practice Tips" : isSpeakingSection ? "Speaking Practice Tips" : isQASection ? "Q&A Practice Tips" : "Mock AI Recommendations"}
                            </h3>
                            <p className="text-xs text-slate-400">
                              {isConversationSection ? "Simple beginner-friendly tips for conversation practice" : isSpeakingSection ? "4-5 simple speaking tips for rhythm, stress, and clear communication" : isQASection ? "Simple beginner-friendly tips for Q&A practice" : "Frontend Preview / Rule-based practice guidance"}
                            </p>
                          </div>

                          {!isQASection && !isSpeakingSection && !isConversationSection && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleSaveTipsToNotebook}
                              disabled={savingTips || tipsSaved}
                            >
                              {tipsSaved ? "Saved to Notebook ✓" : "Save AI Tips to Notebook"}
                            </Button>
                          )}
                        </div>

                        <ul className="grid gap-3 pt-2">
                          {tipsToShow.map((tip, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3 text-sm text-slate-600 bg-slate-50/50 border border-slate-100 p-3.5 rounded-xl leading-relaxed"
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600">
                                {idx + 1}
                              </span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}

                  {/* Write Mode / Homework Tab */}
                  {activeTab === "write" && (() => {
                    if (isHomeworkSection) {
                      return (
                        <div className="space-y-4">
                          <Card className="border border-indigo-200 shadow-sm p-4 bg-indigo-50/10 rounded-2xl">
                            <h3 className="text-sm font-black text-indigo-700 tracking-wide uppercase mb-1">Homework Task</h3>
                            <p className="text-sm text-slate-700 font-semibold">{sectionData.body || "Write 5 simple sentences about your family using the Subject + Verb + Object rule."}</p>
                          </Card>

                          <textarea
                            rows={8}
                            className="w-full text-sm p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans leading-relaxed text-slate-700 resize-y placeholder-slate-400 min-h-[240px]"
                            placeholder="Type your homework answer here..."
                            value={homeworkInput}
                            onChange={(e) => setHomeworkInput(e.target.value)}
                          />

                          <div className="flex flex-wrap items-center gap-2">
                            <Button onClick={handleCheckHomework} disabled={!homeworkInput.trim()}>
                              Check Homework
                            </Button>

                            <Button variant="outline" onClick={handleSaveHomework} disabled={!homeworkInput.trim()}>
                              {hwProgress?.homework_saved ? "Homework Saved ✓" : "Save Homework"}
                            </Button>
                          </div>

                          {hwFeedback && (
                            <div className="mt-4 border border-slate-100 rounded-2xl p-4 bg-slate-50/40 space-y-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mock AI Feedback — based on homework checklist only.</span>

                              <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-700"><span className="font-bold text-slate-900">Your answer:</span> {homeworkInput}</p>
                                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                  <span className={`px-2 py-1 rounded-lg border ${hwFeedback.match === 'Good' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                    Match: {hwFeedback.match}
                                  </span>
                                  <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                                    Issue: {hwFeedback.issueType}
                                  </span>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-slate-200 mt-2 shadow-sm text-xs md:text-sm text-indigo-700 font-medium">
                                  💡 {hwFeedback.hinglishTip}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                <Button size="sm" variant="outline" onClick={() => setHwFeedback(null)}>
                                  Edit Again
                                </Button>
                                {hwFeedback.match === "Needs Practice" && (
                                  <Button size="sm" variant="outline" onClick={handleSaveHWMistake}>
                                    {hwProgress?.mistake_saved ? "Mistake Saved ✓" : "Save Mistake"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">Write Mode Practice</h3>
                          <p className="text-xs text-slate-400">Write a sentence based on this section to verify grammar, casing, and punctuation.</p>
                        </div>

                        <textarea
                          rows={8}
                          className="w-full text-sm p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans leading-relaxed text-slate-700 resize-y placeholder-slate-400 min-h-[240px]"
                          placeholder="Write your sentence, answer, or short paragraph here..."
                          value={writeInput}
                          onChange={(e) => setWriteInput(e.target.value)}
                        />

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            onClick={handleCheckWriting}
                            disabled={checkingWrite || !writeInput.trim()}
                          >
                            {checkingWrite ? (
                              <>
                                <RefreshCw size={15} className="animate-spin mr-1" /> Analyzing...
                              </>
                            ) : (
                              "Check Writing with Mock AI"
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            onClick={handleSaveWritingToNotebook}
                            disabled={savingWritingNote || !writeInput.trim()}
                          >
                            {writingNoteSaved ? "Saved Draft ✓" : "Save Writing to Notebook"}
                          </Button>

                          <button
                            onClick={() => {
                              setWriteInput("");
                              setWriteResult(null);
                            }}
                            className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-3 py-2 rounded-xl transition-colors"
                          >
                            Clear
                          </button>
                        </div>

                        {/* Feedback box */}
                        {writeResult && (
                          <div className="mt-4 border border-slate-100 rounded-2xl p-4 bg-slate-50/40 space-y-3">
                            <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${writeResult.status === "correct"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-amber-50 text-amber-600 border border-amber-100"
                              }`}>
                              {writeResult.status === "correct" ? (
                                <>
                                  <CheckCircle size={13} /> Correct Sentence
                                </>
                              ) : (
                                <>
                                  <AlertCircle size={13} /> Suggestions Detected
                                </>
                              )}
                            </span>

                            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 bg-white border border-slate-100 px-3 py-1 rounded-xl shadow-sm/10">
                              <Trophy size={14} className="text-amber-500" />
                              Score: {writeResult.score}/100
                            </div>
                          </div>

                          <div className="bg-white rounded-xl border border-slate-200/50 p-4 space-y-3 text-sm">
                            <div>
                              <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider block">Your Input</span>
                              <p className="text-slate-700 font-medium mt-0.5">{writeInput}</p>
                            </div>

                            {writeResult.status === "needs-improvement" && (
                              <>
                                <div className="border-t border-slate-100 pt-3">
                                  <span className="font-semibold text-emerald-600 text-xs uppercase tracking-wider block">Suggested Correction</span>
                                  <p className="font-bold text-emerald-700 mt-0.5">{writeResult.betterSentence}</p>
                                </div>
                                <div className="bg-indigo-50/30 border-l-3 border-indigo-500 p-3 rounded-r-xl text-slate-700 font-medium text-xs leading-relaxed">
                                  💡 Rule: {writeResult.simpleRule}
                                </div>
                              </>
                            )}

                            {writeResult.grammarHint && (
                              <div className="border-t border-slate-100 pt-3">
                                <span className="font-semibold text-indigo-500 text-xs uppercase tracking-wider block">Grammar Explanation</span>
                                <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                                  {writeResult.grammarHint}
                                </p>
                              </div>
                            )}

                            {(writeResult.capitalizationHint || writeResult.punctuationHint) && (
                              <div className="border-t border-slate-100 pt-3 space-y-1">
                                <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider block">Formatting Hints</span>
                                {writeResult.capitalizationHint && (
                                  <p className="text-xs text-amber-600 flex items-center gap-1 font-medium">
                                    ⚠️ {writeResult.capitalizationHint}
                                  </p>
                                )}
                                {writeResult.punctuationHint && (
                                  <p className="text-xs text-amber-600 flex items-center gap-1 font-medium">
                                    ⚠️ {writeResult.punctuationHint}
                                  </p>
                                )}
                              </div>
                            )}

                            {writeResult.wordsToImprove && writeResult.wordsToImprove.length > 0 && (
                              <div className="border-t border-slate-100 pt-3">
                                <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider block">Words/Parts to Improve</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {writeResult.wordsToImprove.map((word) => (
                                    <span
                                      key={word}
                                      className="bg-amber-50 text-amber-700 border border-amber-100 text-xs px-2 py-0.5 rounded-lg font-medium"
                                    >
                                      {word}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {writeResult.status === "needs-improvement" && (
                            <div className="pt-1">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={handleSaveCorrectionToNotebook}
                                disabled={savingCorrection || correctionSaved}
                              >
                                {correctionSaved ? "Saved to Notebook ✓" : "Save correction to AI Notebook"}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                  {/* Speak Mode Tab */}
                  {activeTab === "speak" && (() => {
                    const sentences = sectionData.body.split(/[.!?\n]/).map(s => s.trim()).filter(Boolean);
                    const practiceLine = sentences[0] || sectionData.body;
                    const targetLine = practiceTargetOverride || practiceLine;

                    if (isSpeakingSection) {
                      return (
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-bold text-slate-800 font-sans">Speaking Practice Coach</h3>
                            <p className="text-xs text-slate-400">
                              Practice speaking the target sentence and get mock feedback.
                            </p>
                          </div>

                          {/* Target Sentence Card */}
                          <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 space-y-3">
                            <div>
                              <span className="font-semibold text-indigo-600 text-[10px] uppercase tracking-wider block">Target Sentence</span>
                              <p className="text-slate-800 text-sm font-semibold italic mt-0.5">&ldquo;{targetLine}&rdquo;</p>
                              {practiceTargetOverride && (
                                <button
                                  onClick={() => {
                                    setPracticeTargetOverride(null);
                                    setSpeakInput("");
                                    setSpeakCoachFeedback(null);
                                  }}
                                  className="text-[10px] text-indigo-600 font-bold hover:underline mt-1 block"
                                >
                                  Reset to Main Sentence
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleListenPracticeLine(targetLine)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm/10 ${isSpeakingLine
                                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                                  : "bg-indigo-600 text-white hover:bg-indigo-700"
                                  }`}
                              >
                                {isSpeakingLine ? (
                                  <>
                                    <VolumeX size={14} /> Stop listening
                                  </>
                                ) : (
                                  <>
                                    <Volume2 size={14} /> Listen Target
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Recording/Typing action or fallback */}
                          {!showTranscriptBox ? (

                            <div className="flex flex-col sm:flex-row items-center gap-3 p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                              {recognition ? (
                                <button
                                  onClick={() => {
                                    handleToggleRecording();
                                    setShowTranscriptBox(true);
                                  }}
                                  className="flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm w-full sm:w-auto"
                                >
                                  <Mic size={15} />
                                  Speak / Record Answer
                                </button>
                              ) : (
                                <div className="text-xs text-slate-500 font-medium">
                                  Speech recognition is not supported in this browser.
                                </div>
                              )}
                              
                              <button
                                onClick={() => {
                                  setShowTranscriptBox(true);
                                  setSpeakingChecklist(prev => ({ ...prev, speak: true }));
                                }}
                                className="text-xs font-bold text-indigo-600 hover:underline px-3 py-2"
                              >
                                {recognition ? "Or type transcript manually" : "Type transcript manually (Fallback)"}
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* Transcript Input Area */}
                              <div className="space-y-2">
                                <span className="font-bold text-xs text-slate-500 uppercase tracking-wider block">Your Spoken Transcript</span>
                                
                                <div className="flex flex-col gap-2">
                                  {recognition && (
                                    <div className="flex items-center gap-2 mb-1">
                                      <button
                                        onClick={handleToggleRecording}
                                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${isRecording
                                          ? "bg-rose-500 text-white border-rose-500 animate-pulse"
                                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                        }`}
                                      >
                                        <Mic size={14} />
                                        {isRecording ? "Listening... Click to Stop" : "Speak / Record Answer"}
                                      </button>
                                      {isRecording && (
                                        <span className="text-xs text-rose-500 font-semibold animate-pulse">Recording active... Speak now</span>
                                      )}
                                    </div>
                                  )}
                                  
                                  <textarea
                                    rows={4}
                                    className="w-full text-sm p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans leading-relaxed text-slate-700 resize-y placeholder-slate-400 min-h-[120px]"
                                    placeholder="Type or paste what you spoke here, or use the Speak button above..."
                                    value={speakInput}
                                    onChange={(e) => {
                                      setSpeakInput(e.target.value);
                                      setSpeakingChecklist(prev => ({ ...prev, speak: true }));
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Compare Actions */}
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  onClick={() => handleCompareSpeaking(targetLine)}
                                  disabled={checkingSpeak || !speakInput.trim()}
                                >
                                  {checkingSpeak ? (
                                    <>
                                      <RefreshCw size={15} className="animate-spin mr-1" /> Comparing...
                                    </>
                                  ) : (
                                    "Check / Compare"
                                  )}
                                </Button>

                                <button
                                  onClick={() => {
                                    setSpeakInput("");
                                    setSpeakCoachFeedback(null);
                                    setShowTranscriptBox(false);
                                  }}
                                  className="text-xs font-semibold text-slate-400 hover:text-slate-650 px-3 py-2 rounded-xl transition-colors"
                                >
                                  Clear / Reset
                                </button>
                              </div>
                            </>
                          )}

                          {/* Mock AI Feedback Box */}
                          {speakCoachFeedback && (
                            <div className="mt-4 border border-slate-100 rounded-2xl p-4 bg-slate-50/40 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  Mock AI Feedback — based on transcript comparison only
                                </span>
                                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 bg-white border border-slate-100 px-3 py-1 rounded-xl shadow-sm/10 w-fit">
                                  <Trophy size={14} className="text-amber-500" />
                                  Score: {speakCoachFeedback.score}/10
                                </div>
                              </div>

                              <div className="bg-white rounded-xl border border-slate-200/50 p-4 space-y-3.5 text-xs md:text-sm">
                                <div>
                                  <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider block">Your Spoken Transcript</span>
                                  <p className="text-slate-700 font-medium mt-0.5 italic">&ldquo;{speakCoachFeedback.transcript}&rdquo;</p>
                                </div>

                                <div className="border-t border-slate-100 pt-3">
                                  <span className="font-bold text-[10px] uppercase text-emerald-600 tracking-wider block font-semibold">Corrected Transcript / Better Spoken Sentence</span>
                                  <p className="text-emerald-700 font-semibold mt-0.5">&ldquo;{speakCoachFeedback.correctedTranscript}&rdquo;</p>
                                </div>

                                {speakCoachFeedback.missingWrongWords.length > 0 ? (
                                  <div className="border-t border-slate-100 pt-3">
                                    <span className="font-bold text-[10px] uppercase text-rose-500 tracking-wider block font-semibold">Missing / Wrong Words</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {speakCoachFeedback.missingWrongWords.map(w => (
                                        <span key={w} className="bg-rose-50 text-rose-600 text-xs px-2 py-0.5 rounded-lg border border-rose-100/50 font-medium">
                                          {w}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="border-t border-slate-100 pt-3">
                                    <span className="font-bold text-[10px] uppercase text-emerald-600 tracking-wider block font-semibold">Missing / Wrong Words</span>
                                    <p className="text-xs text-emerald-600 font-semibold mt-1">Perfect matching! No missing words.</p>
                                  </div>
                                )}

                                <div className="border-t border-slate-100 pt-3">
                                  <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider block font-semibold">Mistake Type</span>
                                  <p className="text-slate-700 font-medium mt-0.5">{speakCoachFeedback.mistakeType}</p>
                                </div>

                                <div className="border-t border-slate-100 pt-3 bg-indigo-50/20 p-3 rounded-xl border border-indigo-50/50">
                                  <span className="font-bold text-[10px] uppercase text-indigo-600 tracking-wider block">Hinglish Explanation</span>
                                  <p className="text-xs text-slate-700 mt-1 font-semibold leading-relaxed">
                                    {speakCoachFeedback.hinglishExplanation}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleSaveSpeakingAttempt}
                                  disabled={savingSpeakingNote}
                                >
                                  {speakingNoteSaved ? "Note Saved ✓" : "Save Note"}
                                </Button>
                                {speakCoachFeedback.score < 10 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleSaveSpeakingMistake}
                                  >
                                    Save Mistake
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleListenPracticeLine(speakCoachFeedback.betterSpokenSentence)}
                                >
                                  Listen Better Answer
                                </Button>
                                <button
                                  onClick={() => {
                                    setSpeakInput("");
                                    setSpeakCoachFeedback(null);
                                    setShowTranscriptBox(false);
                                  }}
                                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors ml-auto"
                                >
                                  Try Again
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Extra Practice Collapsible Block */}
                          <div className="border border-slate-200/85 rounded-xl overflow-hidden mt-4">
                            <button
                              onClick={() => setShowExtraSpeakingCollapsible(!showExtraSpeakingCollapsible)}
                              className="w-full flex items-center justify-between p-3.5 bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider focus:outline-none"
                            >
                              <span>📖 Extra Speaking Practice</span>
                              <span>{showExtraSpeakingCollapsible ? "▼" : "▶"}</span>
                            </button>
                            {showExtraSpeakingCollapsible && (
                              <div className="p-4 bg-white space-y-3 border-t border-slate-100">
                                <p className="text-xs text-slate-500 font-medium">
                                  Practice speaking these alternative lines derived from the current lesson pattern:
                                </p>
                                <div className="space-y-3">
                                  {extraSpeakingLines.map((line, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                      <span className="text-xs font-semibold text-slate-700 leading-relaxed italic">
                                        &ldquo;{line}&rdquo;
                                      </span>
                                      <div className="flex gap-1.5 shrink-0">
                                        <button
                                          onClick={() => handleListenPracticeLine(line)}
                                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-150 transition-colors"
                                          title="Listen"
                                        >
                                          <Volume2 size={13} />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setPracticeTargetOverride(line);
                                            setSpeakInput("");
                                            setSpeakCoachFeedback(null);
                                          }}
                                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-[10px] font-bold"
                                        >
                                          Practice This
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">Speak Mode Practice</h3>
                          <p className="text-xs text-slate-400 font-medium text-slate-500">
                            Use browser Speech Synthesis for listening. Standard recording is disabled.
                          </p>
                        </div>

                        {/* Section Content Helper */}
                        <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 space-y-3">
                          <div>
                            <span className="font-semibold text-indigo-600 text-[10px] uppercase tracking-wider block">Practice Target Line</span>
                            <p className="text-slate-800 text-sm font-semibold italic mt-0.5">&ldquo;{practiceLine}&rdquo;</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleListenPracticeLine(practiceLine)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm/10 ${isSpeakingLine
                                ? "bg-rose-50 text-rose-600 border border-rose-200"
                                : "bg-indigo-600 text-white hover:bg-indigo-700"
                                }`}
                            >
                              {isSpeakingLine ? (
                                <>
                                  <VolumeX size={14} /> Stop listening
                                </>
                              ) : (
                                <>
                                  <Volume2 size={14} /> Listen Practice Line
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(practiceLine);
                                alert("Practice line copied!");
                              }}
                              className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs px-3 py-1.5 rounded-lg font-semibold"
                            >
                              <Copy size={13} /> Copy Practice Line
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="font-bold text-xs text-slate-500 uppercase tracking-wider block mb-1">Type or paste what you spoke</span>
                          <textarea
                            rows={6}
                            className="w-full text-sm p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans leading-relaxed text-slate-700 resize-y placeholder-slate-400 min-h-[190px]"
                            placeholder="Read the practice line aloud, then type or paste what you spoke here..."
                            value={speakInput}
                            onChange={(e) => setSpeakInput(e.target.value)}
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            onClick={handleCheckSpeaking}
                            disabled={checkingSpeak || !speakInput.trim()}
                          >
                            {checkingSpeak ? (
                              <>
                                <RefreshCw size={15} className="animate-spin mr-1" /> Analyzing...
                              </>
                            ) : (
                              "Check Speaking"
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            onClick={handleSaveSpeakingToNotebook}
                            disabled={savingSpeakingNote || !speakInput.trim()}
                          >
                            {speakingNoteSaved ? "Saved Attempt ✓" : "Save Speaking Attempt to Notebook"}
                          </Button>

                          <button
                            onClick={() => {
                              setSpeakInput("");
                              setSpeakResult(null);
                            }}
                            className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-3 py-2 rounded-xl transition-colors"
                          >
                            Clear
                          </button>
                        </div>

                        {/* Speak results */}
                        {speakResult && (
                          <div className="mt-4 border border-slate-100 rounded-2xl p-4 bg-slate-50/40 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pronunciation Accuracy</span>
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-32 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-550 ${speakResult.accuracy >= 80
                                      ? "bg-emerald-500"
                                      : speakResult.accuracy >= 50
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                                      }`}
                                    style={{ width: `${speakResult.accuracy}%` }}
                                  />
                                </div>
                                <span className="text-sm font-bold text-slate-800">{speakResult.accuracy}% Match</span>
                              </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200/50 p-4 space-y-3 text-xs md:text-sm">
                              {speakResult.speakingTip && (
                                <div>
                                  <span className="font-bold text-[10px] uppercase text-indigo-500 tracking-wider block">Speaking Guide Tip</span>
                                  <p className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100/50 px-3 py-2 rounded-xl mt-1 leading-relaxed">
                                    {speakResult.speakingTip}
                                  </p>
                                </div>
                              )}

                              {speakResult.missingWords.length > 0 && (
                                <div>
                                  <span className="font-bold text-[10px] uppercase text-rose-500 tracking-wider block">Missing/Unspoken Words</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {speakResult.missingWords.map(w => (
                                      <span key={w} className="bg-rose-50 text-rose-600 text-xs px-2 py-0.5 rounded-lg border border-rose-100/50 font-medium">
                                        {w}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {speakResult.extraWords.length > 0 && (
                                <div>
                                  <span className="font-bold text-[10px] uppercase text-amber-500 tracking-wider block">Extra/Unrecognized Words</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {speakResult.extraWords.map(w => (
                                      <span key={w} className="bg-amber-50 text-amber-600 text-xs px-2 py-0.5 rounded-lg border border-amber-100/50 font-medium">
                                        {w}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {speakResult.wordsToRepeat.length > 0 && (
                                <div>
                                  <span className="font-bold text-[10px] uppercase text-indigo-500 tracking-wider block">Words to Practice Repeat</span>
                                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                    Try repeating these words separately: <span className="font-bold text-indigo-700">{speakResult.wordsToRepeat.join(", ")}</span>
                                  </p>
                                </div>
                              )}

                              <div className="border-t border-slate-100 pt-3">
                                <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider block">Practice Target Line</span>
                                <p className="text-slate-700 italic mt-1 font-medium">&ldquo;{speakResult.recommendedPracticeLine}&rdquo;</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Notebook Tab */}
                  {activeTab === "notebook" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">Section Notebook Notes</h3>
                          <p className="text-xs text-slate-400">Write custom notes and save them directly linked to this section.</p>
                        </div>
                        {linkedNote && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                            Linked to AI Notebook
                          </span>
                        )}
                      </div>

                      {/* Read-only reference section content */}
                      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 max-h-36 overflow-y-auto text-xs text-slate-600 leading-relaxed">
                        <span className="font-bold text-[10px] uppercase text-slate-400 block mb-1">Section Reference Content</span>
                        <pre className="font-sans whitespace-pre-wrap">{sectionData.body}</pre>
                      </div>

                      <div>
                        <span className="font-bold text-xs text-slate-500 uppercase tracking-wider block mb-1">My Notes</span>
                        <textarea
                          rows={10}
                          className="w-full text-sm p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans leading-relaxed text-slate-700 resize-y placeholder-slate-400 bg-slate-50/10 min-h-[250px]"
                          placeholder="Write vocabulary lists, example sentences, or grammar rules here..."
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button onClick={handleSaveNote} disabled={savingNote || !noteText.trim()}>
                          {savingNote ? (
                            "Saving Note..."
                          ) : noteSaved ? (
                            "Saved successfully! ✓"
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <Save size={15} /> {linkedNote ? "Update Notes" : isSpeakingSection ? "Save Notes to Notebook" : "Save Notes to AI Notebook"}
                            </span>
                          )}
                        </Button>

                        {!isQASection && !isSpeakingSection && !isConversationSection && (
                          <Button
                            variant="outline"
                            onClick={handleSaveSectionToNotebook}
                            disabled={savingNote}
                          >
                            Save Section Text to AI Notebook
                          </Button>
                        )}
                      </div>

                      {noteSaved && (
                        <p className="text-xs text-emerald-600 font-medium animate-fade-in">
                          ✓ Notes successfully synchronized and stored in your AI Notebook.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Mistakes Tab */}
                  {activeTab === "mistakes" && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Section Mistakes</h3>
                        <p className="text-xs text-slate-400">History of mistakes flagged for correction in this section.</p>
                      </div>

                      {loadingMistakes ? (
                        <p className="text-xs text-slate-400 py-6 animate-pulse">Loading mistakes...</p>
                      ) : mistakes.length === 0 ? (
                        <div className="border border-slate-100 rounded-xl p-8 text-center bg-slate-50/30">
                          <CheckCircle className="text-emerald-500 h-10 w-10 mx-auto opacity-70" />
                          <p className="text-sm text-slate-500 font-medium mt-2">No mistakes found for this section yet.</p>
                          <p className="text-xs text-slate-400 mt-1">Excellent job! Complete practice sessions in Write Mode to track weak points.</p>
                        </div>
                      ) : (
                        <div className="grid gap-3 pt-1">
                          {mistakes.map((m) => (
                            <div key={m.id} className="border border-slate-200/70 rounded-xl p-4 bg-slate-50/50 space-y-2 text-xs md:text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase text-rose-500">Grammar Mistake</span>
                                <span className="text-[10px] text-slate-400 font-medium">Practiced {m.practicedCount}×</span>
                              </div>

                              <div className="space-y-1 font-medium text-slate-700">
                                <p className="text-rose-600 line-through">Wrong: &ldquo;{m.wrongSentence}&rdquo;</p>
                                <p className="text-emerald-600">Correct: &ldquo;{m.correctSentence}&rdquo;</p>
                              </div>

                              <p className="text-xs text-slate-500 border-l-2 border-indigo-500 pl-2 py-0.5">
                                Rule: {m.simpleRule}
                              </p>

                              <div className="pt-2">
                                <Button size="sm" variant="outline" onClick={() => handleMarkMistakePracticed(m.id)}>
                                  Mark as Practiced
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Right Column (1/3 width) */}
            <div className="space-y-6">
              {isHomeworkSection && hwProgress ? (
                <>
                  {/* (1) Homework Practice Coach Panel */}
                  <Card className="border border-indigo-100 shadow-sm p-4 bg-indigo-50/15 rounded-2xl space-y-2 font-sans">
                    <div className="flex items-center gap-1.5 border-b border-indigo-100 pb-2">
                      <span className="text-sm">🗣️</span>
                      <h4 className="text-xs font-black uppercase text-indigo-750 tracking-wider">Homework Practice Coach</h4>
                    </div>
                    <p className="text-xs text-slate-655 leading-relaxed font-semibold">
                      This is a frontend mock coach. It checks your homework with a simple checklist and helps you improve.
                    </p>
                  </Card>

                  {/* (2) Focus Area Card */}
                  <Card className="border border-indigo-200 shadow-sm p-4 space-y-3 bg-indigo-50/10 rounded-2xl">
                    <div className="flex items-center justify-between border-b border-indigo-150 pb-2">
                      <h4 className="text-xs font-black uppercase text-indigo-650 tracking-wider flex items-center gap-1.5 font-sans">
                        <span>🎯</span> Focus Area
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-white border border-indigo-100/50 p-2.5 rounded-xl">
                        <span className="text-xs font-semibold text-slate-600">Homework Checked Today</span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
                          {hwProgress.homework_checked ? "1" : "0"} done
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-white border border-indigo-100/50 p-2.5 rounded-xl">
                        <span className="text-xs font-semibold text-slate-600">Notes Saved Today</span>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                          {hwProgress.note_saved ? "1" : "0"} notes
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* (3) Today Practice Checklist Card */}
                  <Card className="border border-slate-200 shadow-sm p-5 space-y-4 bg-white rounded-2xl">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider font-sans">Today Practice Checklist</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input type="checkbox" checked={hwProgress.task_read} readOnly className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer" />
                        <span className={`text-xs md:text-sm font-semibold ${hwProgress.task_read ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold"}`}>Read task</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input type="checkbox" checked={hwProgress.homework_written} readOnly className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer" />
                        <span className={`text-xs md:text-sm font-semibold ${hwProgress.homework_written ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold"}`}>Write answer</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input type="checkbox" checked={hwProgress.homework_checked} readOnly className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer" />
                        <span className={`text-xs md:text-sm font-semibold ${hwProgress.homework_checked ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold"}`}>Check homework</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input type="checkbox" checked={hwProgress.homework_saved} readOnly className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer" />
                        <span className={`text-xs md:text-sm font-semibold ${hwProgress.homework_saved ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold"}`}>Save homework</span>
                      </label>
                    </div>
                    {hwProgress.section_completed && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-xl text-center">
                        🎉 Section Completed!
                      </div>
                    )}
                  </Card>
                </>
              ) : isConversationSection ? (
                <>
                  {progress && (
                    <SectionProgressCard
                      progress={progress}
                      onMarkComplete={handleMarkComplete}
                    />
                  )}

                  <Card className="border border-indigo-100 shadow-sm p-4 bg-indigo-50/15 rounded-2xl space-y-2 font-sans">
                    <div className="flex items-center gap-1.5 border-b border-indigo-100/50 pb-2">
                      <span className="text-sm">💬</span>
                      <h4 className="text-xs font-black uppercase text-indigo-700 tracking-wider">Conversation AI Coach</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                      AI helps you learn faster by checking your reply, giving a better natural reply, and explaining mistakes in Hinglish.
                    </p>
                  </Card>
                </>
              ) : isSpeakingSection ? (
                <>
                  {/* (1) Speaking AI Coach Panel */}
                  <MockAICoachPanel
                    sectionHeading={sectionData.heading}
                    onTabChange={(tab) => setActiveTab(tab)}
                    onSaveTipToNotebook={handleSaveCoachTipToNotebook}
                    savingTip={savingCoachTip}
                    tipSaved={coachTipSaved}
                  />

                  {/* (2) Focus Area Card */}
                  <Card className="border border-indigo-200 shadow-sm p-4 space-y-4 bg-indigo-50/10 rounded-2xl">
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                      <h4 className="text-xs font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1.5 font-sans">
                        <span>🎯</span> Focus Area
                      </h4>
                      <span className="text-[10px] font-bold text-indigo-400 bg-white border border-indigo-100 rounded px-1.5 py-0.5">
                        Speaking Stats
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-white border border-indigo-100/50 p-2.5 rounded-xl shadow-sm/5">
                        <span className="text-xs font-bold text-slate-600">Mistakes Logged Today</span>
                        <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-lg">
                          {speakingMistakesCount} mistakes
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-white border border-indigo-100/50 p-2.5 rounded-xl shadow-sm/5">
                        <span className="text-xs font-bold text-slate-600">Notes Saved Today</span>
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">
                          {speakingNotesCount} notes
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed text-center font-medium">
                      Mistakes are logged when you manually save them from Speaking Feedback.
                    </p>
                  </Card>

                  {/* (3) Today Practice Checklist Card */}
                  <Card className="border border-slate-200 shadow-sm p-5 space-y-4 bg-white rounded-2xl">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider font-sans">Today Practice Checklist</h3>
                    
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={speakingChecklist.listen}
                          onChange={(e) => setSpeakingChecklist({ ...speakingChecklist, listen: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                        />
                        <span className={`text-xs md:text-sm font-semibold ${speakingChecklist.listen ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold"}`}>
                          Listen Target Line
                        </span>
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={speakingChecklist.speak}
                          onChange={(e) => setSpeakingChecklist({ ...speakingChecklist, speak: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                        />
                        <span className={`text-xs md:text-sm font-semibold ${speakingChecklist.speak ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold"}`}>
                          Speak / Record Attempt
                        </span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={speakingChecklist.check}
                          onChange={(e) => setSpeakingChecklist({ ...speakingChecklist, check: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                        />
                        <span className={`text-xs md:text-sm font-semibold ${speakingChecklist.check ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold"}`}>
                          Compare transcript & score
                        </span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={speakingChecklist.saveNote}
                          onChange={(e) => setSpeakingChecklist({ ...speakingChecklist, saveNote: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                        />
                        <span className={`text-xs md:text-sm font-semibold ${speakingChecklist.saveNote ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold"}`}>
                          Save attempt notes
                        </span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={speakingChecklist.saveMistake}
                          onChange={(e) => setSpeakingChecklist({ ...speakingChecklist, saveMistake: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                        />
                        <span className={`text-xs md:text-sm font-semibold ${speakingChecklist.saveMistake ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold"}`}>
                          Save mistake (optional)
                        </span>
                      </label>
                    </div>
                  </Card>
                </>
              ) : isQASection ? (
                <>
                  {/* Q&A AI Tutor Card */}
                  <MockAICoachPanel
                    sectionHeading={sectionData.heading}
                    onTabChange={(tab) => setActiveTab(tab)}
                    onSaveTipToNotebook={handleSaveCoachTipToNotebook}
                    savingTip={savingCoachTip}
                    tipSaved={coachTipSaved}
                    isQASection={true}
                  />

                  {/* Focus Area Card */}
                  <Card className="border border-rose-200 shadow-sm p-4 space-y-4 bg-rose-50/20 rounded-2xl">
                    <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                      <h4 className="text-xs font-black uppercase text-rose-600 tracking-wider flex items-center gap-1.5">
                        <span>🎯</span> Focus Area
                      </h4>
                      <span className="text-[10px] font-bold text-rose-400 bg-white border border-rose-100 rounded px-1.5 py-0.5">
                        Daily Tracking
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-white border border-rose-100/50 p-2.5 rounded-xl shadow-sm/5">
                        <span className="text-xs font-bold text-slate-650">Mistakes Logged Today</span>
                        <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-lg">
                          {qaMistakesCount} mistakes
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-white border border-rose-100/50 p-2.5 rounded-xl shadow-sm/5">
                        <span className="text-xs font-bold text-slate-655">Notes Saved Today</span>
                        <span className="text-xs font-black text-indigo-650 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">
                          {qaNotesCount} notes
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed text-center font-medium">
                      Mistakes are logged automatically when check scores are below 85.
                    </p>
                  </Card>

                  {/* Today Practice Checklist Card */}
                  <Card className="border border-slate-200 shadow-sm p-5 space-y-4 bg-white rounded-2xl">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider">Today Practice Checklist</h3>
                    
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={qaChecklist.readAll}
                          onChange={(e) => setQaChecklist({ ...qaChecklist, readAll: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                        />
                        <span className={`text-xs md:text-sm font-semibold ${qaChecklist.readAll ? "line-through text-slate-400 font-medium" : "text-slate-750 font-bold"}`}>
                          Read / Review all Q&As
                        </span>
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={qaChecklist.listenAnswers}
                          onChange={(e) => setQaChecklist({ ...qaChecklist, listenAnswers: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                        />
                        <span className={`text-xs md:text-sm font-semibold ${qaChecklist.listenAnswers ? "line-through text-slate-400 font-medium" : "text-slate-750 font-bold"}`}>
                          Listen to Q&As or Sample Answers
                        </span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={qaChecklist.checkAnswer}
                          onChange={(e) => setQaChecklist({ ...qaChecklist, checkAnswer: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                        />
                        <span className={`text-xs md:text-sm font-semibold ${qaChecklist.checkAnswer ? "line-through text-slate-400 font-medium" : "text-slate-750 font-bold"}`}>
                          Practice & Check Answer
                        </span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={qaChecklist.saveItem}
                          onChange={(e) => setQaChecklist({ ...qaChecklist, saveItem: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                        />
                        <span className={`text-xs md:text-sm font-semibold ${qaChecklist.saveItem ? "line-through text-slate-400 font-medium" : "text-slate-750 font-bold"}`}>
                          Save Notes or mistakes
                        </span>
                      </label>
                    </div>
                  </Card>
                </>
              ) : isSelfCheckSection ? (
                <>
                  <Card className="border border-indigo-100 shadow-sm p-4 bg-indigo-50/15 rounded-2xl space-y-2 font-sans">
                    <div className="flex items-center gap-1.5 border-b border-indigo-100/50 pb-2">
                      <span className="text-sm">👨‍🏫</span>
                      <h4 className="text-xs font-black uppercase text-indigo-700 tracking-wider">Self Check Coach</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                      This is a frontend mock coach. It checks your checklist status and tells what to revise next.
                    </p>
                  </Card>
                  
                  <Card className="border border-indigo-200 shadow-sm p-4 space-y-4 bg-indigo-50/10 rounded-2xl">
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                      <h4 className="text-xs font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1.5 font-sans">
                        <span>🎯</span> Focus Area
                      </h4>
                    </div>
                    <p className="text-[13px] text-slate-700 font-bold leading-relaxed">
                      Review all checklist items, identify your weaknesses, and save them for future revision.
                    </p>
                  </Card>

                  <Card className="border border-indigo-200 shadow-sm p-4 space-y-3 bg-indigo-50/10 rounded-2xl">
                    <h4 className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5 border-b border-indigo-100/60 pb-2 mb-1">
                      <CheckCircle size={14} className="text-indigo-500" /> Today Practice Checklist
                    </h4>
                    
                    <div className="flex items-center gap-3 p-1">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={scProgress?.checklist_read || false}
                          readOnly
                          className="peer w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-default"
                        />
                      </div>
                      <span className={`text-xs md:text-sm font-semibold ${scProgress?.checklist_read ? "line-through text-slate-400 font-medium" : "text-slate-750 font-bold"}`}>
                        Read Checklist Tasks
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-1">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={scProgress?.self_check_checked || false}
                          readOnly
                          className="peer w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-default"
                        />
                      </div>
                      <span className={`text-xs md:text-sm font-semibold ${scProgress?.self_check_checked ? "line-through text-slate-400 font-medium" : "text-slate-750 font-bold"}`}>
                        Check Learning
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-1">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={(scProgress?.note_saved || scProgress?.mistake_saved) || false}
                          readOnly
                          className="peer w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-default"
                        />
                      </div>
                      <span className={`text-xs md:text-sm font-semibold ${(scProgress?.note_saved || scProgress?.mistake_saved) ? "line-through text-slate-400 font-medium" : "text-slate-750 font-bold"}`}>
                        Save Note / Practice Again
                      </span>
                    </div>
                  </Card>
                </>
              ) : isPreviewSection ? (
                <>
                  <Card className="border border-indigo-100 shadow-sm p-4 bg-indigo-50/15 rounded-2xl space-y-2 font-sans">
                    <div className="flex items-center gap-1.5 border-b border-indigo-100/50 pb-2">
                      <span className="text-sm">👨‍🏫</span>
                      <h4 className="text-xs font-black uppercase text-indigo-700 tracking-wider">Day 3 Preview Coach</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                      This is a frontend mock coach. It helps you prepare for tomorrow's lesson using simple preview tips.
                    </p>
                  </Card>
                  
                  <Card className="border border-indigo-200 shadow-sm p-4 space-y-4 bg-indigo-50/10 rounded-2xl">
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                      <h4 className="text-xs font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1.5 font-sans">
                        <span>🎯</span> Focus Area
                      </h4>
                    </div>
                    <p className="text-[13px] text-slate-700 font-bold leading-relaxed">
                      Preview Read Today, Notes Saved Today.
                    </p>
                  </Card>

                  <Card className="border border-indigo-200 shadow-sm p-4 space-y-3 bg-indigo-50/10 rounded-2xl">
                    <h4 className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5 border-b border-indigo-100/60 pb-2 mb-1">
                      <CheckCircle size={14} className="text-indigo-500" /> Today Preview Checklist
                    </h4>
                    
                    <div className="flex items-center gap-3 p-1">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={prevProgress?.preview_read || false}
                          readOnly
                          className="peer w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-default"
                        />
                      </div>
                      <span className={`text-xs md:text-sm font-semibold ${prevProgress?.preview_read ? "line-through text-slate-400 font-medium" : "text-slate-750 font-bold"}`}>
                        Read preview
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-1">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={prevProgress?.preview_listened || false}
                          readOnly
                          className="peer w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-default"
                        />
                      </div>
                      <span className={`text-xs md:text-sm font-semibold ${prevProgress?.preview_listened ? "line-through text-slate-400 font-medium" : "text-slate-750 font-bold"}`}>
                        Listen preview
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-1">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={prevProgress?.preview_prepared || false}
                          readOnly
                          className="peer w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-default"
                        />
                      </div>
                      <span className={`text-xs md:text-sm font-semibold ${prevProgress?.preview_prepared ? "line-through text-slate-400 font-medium" : "text-slate-750 font-bold"}`}>
                        Prepare for Day 3
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-1">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={prevProgress?.note_saved || false}
                          readOnly
                          className="peer w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-default"
                        />
                      </div>
                      <span className={`text-xs md:text-sm font-semibold ${prevProgress?.note_saved ? "line-through text-slate-400 font-medium" : "text-slate-750 font-bold"}`}>
                        Save note optional
                      </span>
                    </div>
                  </Card>
                </>
              ) : (
                <>
                  {progress && (
                    <SectionProgressCard
                      progress={progress}
                      onMarkComplete={handleMarkComplete}
                    />
                  )}

                  <MockAICoachPanel
                    sectionHeading={sectionData.heading}
                    onTabChange={(tab) => setActiveTab(tab)}
                    onSaveTipToNotebook={handleSaveCoachTipToNotebook}
                    savingTip={savingCoachTip}
                    tipSaved={coachTipSaved}
                  />
                </>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
