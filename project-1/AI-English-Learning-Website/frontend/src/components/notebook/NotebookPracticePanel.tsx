import React, { useState, useEffect } from "react";
import { NotebookItem, NotebookVocabulary, NotebookQuestion, NotebookMistake } from "../../types/aiNotebook.types";
import Card from "../common/Card";
import Button from "../common/Button";
import Badge from "../common/Badge";
import aiNotebookService from "../../services/aiNotebookService";
import {
  Sparkles,
  Book,
  Mic,
  Volume2,
  Edit2,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  RefreshCw,
} from "lucide-react";

interface NotebookPracticePanelProps {
  note: NotebookItem | null;
  onUpdateNote: (updated: NotebookItem) => void;
}

type TabType =
  | "vocab"
  | "speaking"
  | "listening"
  | "writing"
  | "reading"
  | "questions"
  | "checker"
  | "mistakes";

export default function NotebookPracticePanel({ note, onUpdateNote }: NotebookPracticePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("vocab");

  // --- 1. Vocabulary AI States ---
  const [vocabList, setVocabList] = useState<NotebookVocabulary[]>([]);
  
  // --- 2. Speaking AI States ---
  const [speakingPrompt, setSpeakingPrompt] = useState("");
  const [speakingInput, setSpeakingInput] = useState("");
  const [speakingResult, setSpeakingResult] = useState<{
    score: number;
    missing: string[];
    extra: string[];
    repeated: string[];
    submitted: boolean;
  } | null>(null);

  // --- 3. Listening AI States ---
  const [listeningText, setListeningText] = useState("");
  const [listeningInput, setListeningInput] = useState("");
  const [listeningResult, setListeningResult] = useState<{
    score: number;
    missed: string[];
    submitted: boolean;
  } | null>(null);

  // --- 4. Writing AI States ---
  const [writingInput, setWritingInput] = useState("");
  const [writingResult, setWritingResult] = useState<{
    score: number;
    betterSentence: string;
    hints: string[];
    submitted: boolean;
  } | null>(null);

  // --- 5. Reading AI States ---
  const [readingInput, setReadingInput] = useState("");
  const [readingResult, setReadingResult] = useState<{
    score: number;
    missed: string[];
    practiceWords: string[];
    submitted: boolean;
  } | null>(null);

  // --- 6. Question AI States ---
  const [questions, setQuestions] = useState<NotebookQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionsResult, setQuestionsResult] = useState<Record<string, { isCorrect: boolean; feedback: string }> | null>(null);

  // --- 7. Answer Checker States ---
  const [checkerUserAnswer, setCheckerUserAnswer] = useState("");
  const [checkerExpectedAnswer, setCheckerExpectedAnswer] = useState("");
  const [checkerResult, setCheckerResult] = useState<{
    status: "Correct" | "Needs Improvement";
    score: number;
    suggestedAnswer: string;
    rule: string;
    submitted: boolean;
  } | null>(null);

  // --- 8. Mistake Review States ---
  const [mistakeFilter, setMistakeFilter] = useState<string>("all");

  // Sync state on note change
  useEffect(() => {
    if (note) {
      // 1. Vocab
      if (note.savedVocabulary && note.savedVocabulary.length > 0) {
        setVocabList(note.savedVocabulary);
      } else {
        // extract mock vocab words from content
        const words = extractMockVocab(note.originalContent);
        setVocabList(words);
      }

      // 2. Speaking prompt (use first sentence)
      const sentences = note.originalContent.split(/[.!?]/).filter((s) => s.trim().length > 0);
      setSpeakingPrompt(sentences[0]?.trim() || note.originalContent);
      setSpeakingInput("");
      setSpeakingResult(null);

      // 3. Listening text
      setListeningText(sentences[sentences.length - 1]?.trim() || note.originalContent);
      setListeningInput("");
      setListeningResult(null);

      // 4. Writing
      setWritingInput("");
      setWritingResult(null);

      // 5. Reading
      setReadingInput("");
      setReadingResult(null);

      // 6. Questions
      setQuestions(note.generatedQuestions || []);
      setAnswers(note.userAnswers || {});
      setQuestionsResult(note.correctedAnswers || null);

      // 7. Checker
      setCheckerUserAnswer("");
      setCheckerExpectedAnswer("");
      setCheckerResult(null);
    }
  }, [note]);

  if (!note) return null;

  // Simple rule-based mock vocab extractor
  const extractMockVocab = (text: string): NotebookVocabulary[] => {
    const clean = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const words = Array.from(new Set(clean.split(/\s+/))).filter((w) => w.length > 4).slice(0, 5);
    const mockVocab: Record<string, { meaning: string; example: string }> = {
      perfect: { meaning: "having all required elements, qualities, or characteristics", example: "It is a perfect day." },
      arrived: { meaning: "reached a destination at the end of a journey", example: "He arrived at noon." },
      already: { meaning: "before or by now or the time in question", example: "The train had already gone." },
      surfaces: { meaning: "the outside parts or uppermost layers of something", example: "Clean the kitchen surfaces." },
      schedule: { meaning: "a plan for carrying out a process or procedure", example: "Stick to the weekly schedule." },
      collaborate: { meaning: "work jointly on an activity or project", example: "We will collaborate on details." },
      persevered: { meaning: "continued in a course of action even in the face of difficulty", example: "She persevered to win." },
      summit: { meaning: "the highest point of a hill or mountain", example: "They climbed to the summit." },
      climber: { meaning: "a person who climbs rocks or mountains", example: "The climber checked the ropes." },
    };

    return words.map((w) => {
      const defined = mockVocab[w];
      return {
        word: w,
        meaning: defined?.meaning || "contextual meaning inside note content",
        example: defined?.example || `Used in: "${text.slice(0, 30)}..."`,
        status: "need-practice",
      };
    });
  };

  const handleUpdateVocabStatus = async (word: string, status: "known" | "need-practice") => {
    const updated = vocabList.map((v) => (v.word === word ? { ...v, status } : v));
    setVocabList(updated);
    const nextNote = await aiNotebookService.updateNote(note.id, { savedVocabulary: updated });
    onUpdateNote(nextNote);
    await aiNotebookService.logPracticeHistory(
      "NOTEBOOK_VOCABULARY_PRACTICED",
      note.id,
      "Practiced Vocabulary",
      `Marked word "${word}" as ${status.toUpperCase()} in "${note.title}".`
    );
  };

  // --- Compare text accuracy helper ---
  const compareText = (original: string, user: string) => {
    const prep = (t: string) =>
      t
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 0);
    const origWords = prep(original);
    const userWords = prep(user);

    const missing = origWords.filter((w) => !userWords.includes(w));
    const extra = userWords.filter((w) => !origWords.includes(w));

    let matches = 0;
    origWords.forEach((w) => {
      if (userWords.includes(w)) matches++;
    });

    const score = origWords.length > 0 ? Math.round((matches / origWords.length) * 100) : 0;
    return { score, missing, extra };
  };

  // --- 2. Speaking Practice Submit ---
  const handleSubmitSpeaking = async () => {
    if (!speakingInput.trim()) return;
    const { score, missing, extra } = compareText(speakingPrompt, speakingInput);
    const repeated = extra.filter((w) => speakingPrompt.toLowerCase().includes(w));

    setSpeakingResult({ score, missing, extra, repeated, submitted: true });

    // Save mistake if score < 90
    if (score < 90) {
      const newMistake: NotebookMistake = {
        id: "mst_" + Date.now(),
        type: "speaking",
        original: speakingInput,
        corrected: speakingPrompt,
        rule: `Keep speaking output identical to target prompt. Missed: ${missing.slice(0, 3).join(", ") || "None"}`,
        sourceTitle: note.title,
        date: new Date().toISOString(),
      };
      const mistakes = [...(note.mistakes || []), newMistake];
      const nextNote = await aiNotebookService.updateNote(note.id, { mistakes });
      onUpdateNote(nextNote);
      await aiNotebookService.logPracticeHistory(
        "NOTEBOOK_MISTAKE_SAVED",
        note.id,
        "Saved Speaking Mistake",
        `Saved correction for pronunciation draft in "${note.title}".`
      );
    }

    await aiNotebookService.logPracticeHistory(
      "NOTEBOOK_SPEAKING_PRACTICED",
      note.id,
      "Speaking Drill Attempted",
      `Completed pronunciation check with score of ${score}% in "${note.title}".`
    );
  };

  // --- 3. Listening Text-to-Speech & Submit ---
  const handleListenSpeech = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(listeningText);
      utterance.rate = 0.85; // slightly slower for learners
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech synthesis not supported on this browser.");
    }
  };

  const handleSubmitListening = async () => {
    if (!listeningInput.trim()) return;
    const { score, missing } = compareText(listeningText, listeningInput);

    setListeningResult({ score, missed: missing, submitted: true });

    await aiNotebookService.logPracticeHistory(
      "NOTEBOOK_LISTENING_PRACTICED",
      note.id,
      "Listening Drill Attempted",
      `Answered listening transcription drill with score of ${score}% in "${note.title}".`
    );
  };

  // --- 4. Writing Check Submit ---
  const handleSubmitWriting = async () => {
    if (!writingInput.trim()) return;

    // Simulate mock feedback check
    const isGood = writingInput.length > 20;
    const score = isGood ? 95 : 70;
    const betterSentence = writingInput.replace(/i am/i, "I am").replace(/good/i, "exceptional");
    const hints = [];
    if (!/^[A-Z]/.test(writingInput)) hints.push("Start sentence with a capital letter.");
    if (!/[.!?]$/.test(writingInput)) hints.push("End sentence with proper punctuation (period/mark).");
    if (writingInput.length < 15) hints.push("Try to write a longer, descriptive sentence.");

    setWritingResult({ score, betterSentence, hints, submitted: true });

    if (score < 80) {
      const newMistake: NotebookMistake = {
        id: "mst_" + Date.now(),
        type: "writing",
        original: writingInput,
        corrected: betterSentence,
        rule: hints[0] || "Improve capitalization and sentence depth.",
        sourceTitle: note.title,
        date: new Date().toISOString(),
      };
      const mistakes = [...(note.mistakes || []), newMistake];
      const nextNote = await aiNotebookService.updateNote(note.id, { mistakes });
      onUpdateNote(nextNote);
    }

    await aiNotebookService.logPracticeHistory(
      "NOTEBOOK_WRITING_CHECKED",
      note.id,
      "Writing Draft Checked",
      `Checked writing draft in "${note.title}". Score: ${score}%.`
    );
  };

  // --- 5. Reading Submit ---
  const handleSubmitReading = async () => {
    if (!readingInput.trim()) return;
    const { score, missing } = compareText(note.originalContent, readingInput);

    setReadingResult({
      score,
      missed: missing,
      practiceWords: missing.slice(0, 3),
      submitted: true,
    });

    await aiNotebookService.logPracticeHistory(
      "NOTEBOOK_READING_CHECKED",
      note.id,
      "Reading Comprehension",
      `Scored ${score}% reading transcript match in "${note.title}".`
    );
  };

  // --- 6. Question Generation & Checker ---
  const handleGenerateQuestions = async () => {
    if (note.originalContent.length < 15) {
      alert("Note content too short. Add more sentences to generate mock questions.");
      return;
    }

    const generated: NotebookQuestion[] = [
      {
        id: "mq1",
        type: "fill_blank",
        questionText: `Complete the sentence from notes: "${note.originalContent.slice(0, 15)}..."`,
      },
      {
        id: "mq2",
        type: "true_false",
        questionText: "Is this note topic related to English rules?",
        choices: ["True", "False"],
      },
      {
        id: "mq3",
        type: "make_sentence",
        questionText: "Write a new sentence using one word from this note.",
      },
    ];

    setQuestions(generated);
    setAnswers({});
    setQuestionsResult(null);

    const nextNote = await aiNotebookService.updateNote(note.id, { generatedQuestions: generated });
    onUpdateNote(nextNote);

    await aiNotebookService.logPracticeHistory(
      "NOTEBOOK_QUESTIONS_GENERATED",
      note.id,
      "Generated Questions",
      `Generated 3 mock AI study questions in "${note.title}".`
    );
  };

  const handleSubmitQuestions = async () => {
    const results: Record<string, { isCorrect: boolean; feedback: string }> = {};
    questions.forEach((q) => {
      const userAns = answers[q.id]?.trim() || "";
      if (q.type === "true_false") {
        const correct = userAns.toLowerCase() === "true";
        results[q.id] = {
          isCorrect: correct,
          feedback: correct ? "Correct! This is English study material." : "Incorrect choice.",
        };
      } else if (q.type === "fill_blank") {
        const correct = userAns.length > 3;
        results[q.id] = {
          isCorrect: correct,
          feedback: correct ? "Matches sentence keywords." : "Incorrect keywords.",
        };
      } else {
        const correct = userAns.split(/\s+/).length >= 3;
        results[q.id] = {
          isCorrect: correct,
          feedback: correct ? "Good sentence depth." : "Sentence too short.",
        };
      }
    });

    setQuestionsResult(results);

    const nextNote = await aiNotebookService.updateNote(note.id, {
      userAnswers: answers,
      correctedAnswers: results,
    });
    onUpdateNote(nextNote);

    // Save wrong answers as mistakes
    const wrongKeys = Object.entries(results).filter(([_, v]) => !v.isCorrect);
    if (wrongKeys.length > 0) {
      const newMistakes: NotebookMistake[] = wrongKeys.map(([k, v]) => ({
        id: "mst_q_" + k + "_" + Date.now(),
        type: "questions",
        original: answers[k] || "No answer",
        corrected: "See note content details.",
        rule: v.feedback,
        sourceTitle: note.title,
        date: new Date().toISOString(),
      }));

      const mistakes = [...(note.mistakes || []), ...newMistakes];
      await aiNotebookService.updateNote(note.id, { mistakes });
    }

    await aiNotebookService.logPracticeHistory(
      "NOTEBOOK_ANSWERS_CHECKED",
      note.id,
      "Checked Quiz Answers",
      `Finished answering note-based mock questions in "${note.title}".`
    );
  };

  // --- 7. Answer Checker Submit ---
  const handleSubmitChecker = async () => {
    if (!checkerUserAnswer.trim()) return;

    const isMatch = checkerExpectedAnswer
      ? checkerUserAnswer.toLowerCase().trim() === checkerExpectedAnswer.toLowerCase().trim()
      : checkerUserAnswer.length > 10;

    const resultStatus = isMatch ? "Correct" : "Needs Improvement";
    const score = isMatch ? 100 : 65;

    setCheckerResult({
      status: resultStatus,
      score,
      suggestedAnswer: checkerExpectedAnswer || "Always maintain clear grammar rules.",
      rule: "Keep subject-verb agreement correct and punctuate.",
      submitted: true,
    });

    await aiNotebookService.logPracticeHistory(
      "NOTEBOOK_ANSWERS_CHECKED",
      note.id,
      "Checked Custom Answer",
      `Checked free-text answer against template rules in "${note.title}".`
    );
  };

  // --- 8. Mistake practice repeat ---
  const handleRepeatMistake = async (id: string) => {
    const nextMistakes = (note.mistakes || []).filter((m) => m.id !== id);
    const nextNote = await aiNotebookService.updateNote(note.id, { mistakes: nextMistakes });
    onUpdateNote(nextNote);
    alert("Mistake successfully reviewed and cleared!");
  };

  const filteredMistakes = (note.mistakes || []).filter((m) =>
    mistakeFilter === "all" ? true : m.type === mistakeFilter
  );

  return (
    <Card className="border border-slate-100 bg-white shadow-sm flex flex-col h-full min-h-[450px]">
      {/* Practice Header with Tab selections */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl flex items-center justify-between gap-3">
        <h3 className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles size={14} className="text-indigo-600 animate-pulse" /> Mock AI Practice Hub
        </h3>
        <span className="text-[9px] font-extrabold text-slate-400 uppercase bg-white border border-slate-200 px-2 py-0.5 rounded">
          Active Preview
        </span>
      </div>

      {/* Tabs Selector Menu Grid */}
      <div className="grid grid-cols-4 gap-1 p-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold">
        {[
          { id: "vocab", label: "Vocab" },
          { id: "speaking", label: "Speaking" },
          { id: "listening", label: "Listening" },
          { id: "writing", label: "Writing" },
          { id: "reading", label: "Reading" },
          { id: "questions", label: "Questions" },
          { id: "checker", label: "Checker" },
          { id: "mistakes", label: "Mistakes" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as TabType)}
            className={`py-1.5 rounded-lg text-center transition-all ${
              activeTab === t.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-white hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Practice Workspace area */}
      <div className="p-5 flex-1 overflow-y-auto max-h-[500px]">
        {/* --- 1. Vocabulary AI --- */}
        {activeTab === "vocab" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800">Vocabulary Extractor</h4>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                Extracted vocabulary from note content. Study meanings and toggle practice statuses.
              </p>
            </div>

            {vocabList.length === 0 ? (
              <div className="py-10 text-center text-xs font-semibold text-slate-400">
                No vocabulary keywords found in this note.
              </div>
            ) : (
              <div className="space-y-2.5">
                {vocabList.map((item) => (
                  <div
                    key={item.word}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-indigo-700">{item.word}</span>
                        {item.status === "known" ? (
                          <Badge tone="emerald" className="text-[8px] font-bold px-1 py-0">Known</Badge>
                        ) : (
                          <Badge tone="amber" className="text-[8px] font-bold px-1 py-0">Need Practice</Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-600 font-semibold leading-normal">
                        <b>Meaning:</b> {item.meaning}
                      </p>
                      <p className="text-[9px] text-slate-400 italic">
                        <b>Ex:</b> {item.example}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {item.status === "need-practice" ? (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateVocabStatus(item.word, "known")}
                          className="text-[9px] font-bold h-7 inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle2 size={10} /> Got It
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateVocabStatus(item.word, "need-practice")}
                          className="text-[9px] font-bold h-7"
                        >
                          Need Practice
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- 2. Speaking AI --- */}
        {activeTab === "speaking" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800">Speaking & Pronunciation Check</h4>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                Read the prompt sentence aloud, then type or paste what you spoke to verify matching accuracy.
              </p>
            </div>

            <div className="p-3 bg-indigo-50/20 border border-indigo-100/30 rounded-xl">
              <span className="text-[8px] font-bold text-indigo-600 uppercase block tracking-wider">
                Pronunciation Prompt
              </span>
              <p className="text-xs font-bold text-slate-700 mt-1 leading-relaxed">
                "{speakingPrompt}"
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                Type what you spoke (Mic Fallback)
              </label>
              <textarea
                rows={3}
                className="input-base w-full text-xs font-semibold"
                value={speakingInput}
                onChange={(e) => setSpeakingInput(e.target.value)}
                placeholder="Type the sentence as you pronounced it..."
              />
            </div>

            <Button
              onClick={handleSubmitSpeaking}
              disabled={!speakingInput.trim()}
              className="w-full text-xs font-bold h-8.5 inline-flex items-center justify-center gap-1.5"
            >
              <Mic size={13} /> Check Pronunciation Match
            </Button>

            {speakingResult && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Pronunciation Accuracy</span>
                  <span className={`text-xs font-extrabold ${speakingResult.score >= 85 ? "text-emerald-600" : "text-rose-500"}`}>
                    {speakingResult.score}% Accuracy
                  </span>
                </div>

                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${speakingResult.score >= 85 ? "bg-emerald-500" : "bg-rose-500"}`}
                    style={{ width: `${speakingResult.score}%` }}
                  />
                </div>

                {speakingResult.missing.length > 0 && (
                  <div className="text-[10px] leading-normal text-slate-500">
                    <span className="font-bold text-rose-500 block">Missing Words:</span>
                    <span>{speakingResult.missing.join(", ")}</span>
                  </div>
                )}

                {speakingResult.score < 90 && (
                  <div className="p-2 bg-rose-50 border border-rose-100 rounded-xl text-[9px] text-rose-700 font-semibold">
                    ⚠️ Words saved to mistake review. Practice reading details of note to improve!
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- 3. Listening AI --- */}
        {activeTab === "listening" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800">Listening Transcription Drill</h4>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                Click Listen to hear the target sentence using browser synthesis, and transcribe what you hear.
              </p>
            </div>

            <div className="flex justify-center py-4 bg-slate-50 rounded-xl border border-slate-100">
              <Button
                variant="outline"
                onClick={handleListenSpeech}
                className="inline-flex items-center gap-1.5 text-xs font-bold h-9 bg-white"
              >
                <Volume2 size={15} className="text-indigo-600" /> Listen Prompt Speech
              </Button>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                Your Transcription
              </label>
              <textarea
                rows={3}
                className="input-base w-full text-xs font-semibold"
                value={listeningInput}
                onChange={(e) => setListeningInput(e.target.value)}
                placeholder="Type exactly what you heard..."
              />
            </div>

            <Button
              onClick={handleSubmitListening}
              disabled={!listeningInput.trim()}
              className="w-full text-xs font-bold h-8.5"
            >
              Check Answer Accuracy
            </Button>

            {listeningResult && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Match Score</span>
                  <span className={listeningResult.score >= 85 ? "text-emerald-600" : "text-rose-500"}>
                    {listeningResult.score}%
                  </span>
                </div>

                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${listeningResult.score >= 85 ? "bg-emerald-500" : "bg-rose-500"}`}
                    style={{ width: `${listeningResult.score}%` }}
                  />
                </div>

                {listeningResult.missed.length > 0 && (
                  <div className="text-[10px] leading-normal text-slate-500">
                    <span className="font-bold text-rose-500 block">Missed words:</span>
                    <span>{listeningResult.missed.join(", ")}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- 4. Writing AI --- */}
        {activeTab === "writing" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800">Writing Draft Checker</h4>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                Write a summary, response, or sentence related to this note. Checked feedback checks basic rules.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                Write your sentence
              </label>
              <textarea
                rows={4}
                className="input-base w-full text-xs font-semibold leading-relaxed"
                value={writingInput}
                onChange={(e) => setWritingInput(e.target.value)}
                placeholder="Write a sentence based on the content above..."
              />
            </div>

            <Button
              onClick={handleSubmitWriting}
              disabled={!writingInput.trim()}
              className="w-full text-xs font-bold h-8.5"
            >
              Analyze Writing Draft
            </Button>

            {writingResult && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Grammar Analysis Score</span>
                  <span className={writingResult.score >= 80 ? "text-emerald-600" : "text-amber-500"}>
                    {writingResult.score}/100
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Suggested Improvement</span>
                  <p className="text-xs font-bold text-indigo-600 mt-1 leading-relaxed">
                    "{writingResult.betterSentence}"
                  </p>
                </div>

                {writingResult.hints.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 block">Grammar Hints:</span>
                    <ul className="list-disc list-inside text-[10px] text-slate-400 font-semibold space-y-0.5">
                      {writingResult.hints.map((hint, idx) => (
                        <li key={idx}>{hint}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- 5. Reading AI --- */}
        {activeTab === "reading" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800">Reading Comprehension transcription</h4>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                Read the notebook content in detail, then hide it and type/paste the transcription to test memory.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                Type transcript from memory
              </label>
              <textarea
                rows={4}
                className="input-base w-full text-xs font-semibold leading-relaxed"
                value={readingInput}
                onChange={(e) => setReadingInput(e.target.value)}
                placeholder="Type what you remember from the note content..."
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmitReading}
                disabled={!readingInput.trim()}
                className="flex-1 text-xs font-bold h-8.5"
              >
                Verify Reading match
              </Button>
              {readingResult && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setReadingInput("");
                    setReadingResult(null);
                  }}
                  className="text-xs font-bold h-8.5"
                >
                  <RotateCcw size={13} />
                </Button>
              )}
            </div>

            {readingResult && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Memory Recall Match</span>
                  <span className={readingResult.score >= 80 ? "text-emerald-600" : "text-rose-500"}>
                    {readingResult.score}%
                  </span>
                </div>

                {readingResult.missed.length > 0 && (
                  <div className="text-[10px] text-slate-500 leading-normal">
                    <span className="font-bold text-rose-500 block">Forgotten words:</span>
                    <span>{readingResult.missed.join(", ")}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- 6. Question AI --- */}
        {activeTab === "questions" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800">Mock AI Question generator</h4>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                Generate dynamic questions directly based on the vocabulary and structures in this note.
              </p>
            </div>

            {questions.length === 0 ? (
              <div className="flex flex-col items-center py-6">
                <Button
                  onClick={handleGenerateQuestions}
                  className="text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <RefreshCw size={13} /> Generate Mock Questions
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/40 space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">
                      Question {idx + 1} ({q.type.replace("_", " ")})
                    </span>
                    <p className="text-xs font-bold text-slate-700">{q.questionText}</p>
                    
                    <input
                      type="text"
                      className="input-base w-full text-xs font-semibold"
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      placeholder="Type your answer here..."
                    />

                    {questionsResult && (
                      <div className={`text-[10px] font-semibold mt-1 flex items-start gap-1 ${
                        questionsResult[q.id]?.isCorrect ? "text-emerald-600" : "text-rose-500"
                      }`}>
                        {questionsResult[q.id]?.isCorrect ? (
                          <CheckCircle2 size={12} className="shrink-0" />
                        ) : (
                          <AlertCircle size={12} className="shrink-0" />
                        )}
                        <span>{questionsResult[q.id]?.feedback}</span>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSubmitQuestions}
                    disabled={Object.keys(answers).length === 0}
                    className="flex-1 text-xs font-bold h-8.5"
                  >
                    Check Quiz Answers
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGenerateQuestions}
                    className="text-xs font-bold h-8.5"
                    title="Regenerate questions"
                  >
                    <RefreshCw size={13} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- 7. Answer Checker --- */}
        {activeTab === "checker" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800">Grammar & Sentence checker</h4>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                Check any sentence's grammar, punctuation, and rules. Compare against templates optionally.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Your Answer
                </label>
                <input
                  type="text"
                  className="input-base w-full text-xs font-semibold"
                  value={checkerUserAnswer}
                  onChange={(e) => setCheckerUserAnswer(e.target.value)}
                  placeholder="e.g. He arrive late yesterday"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Expected Answer (Optional)
                </label>
                <input
                  type="text"
                  className="input-base w-full text-xs font-semibold"
                  value={checkerExpectedAnswer}
                  onChange={(e) => setCheckerExpectedAnswer(e.target.value)}
                  placeholder="e.g. He arrived late yesterday"
                />
              </div>

              <Button
                onClick={handleSubmitChecker}
                disabled={!checkerUserAnswer.trim()}
                className="w-full text-xs font-bold h-8.5"
              >
                Validate sentence rules
              </Button>
            </div>

            {checkerResult && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Verdict</span>
                  <span className={checkerResult.status === "Correct" ? "text-emerald-600" : "text-rose-500"}>
                    {checkerResult.status} ({checkerResult.score}/100)
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-100 text-xs leading-relaxed space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Grammar analysis</span>
                  <p className="text-slate-600 font-medium">{checkerResult.rule}</p>
                  <p className="text-indigo-600 font-bold">Suggested: "{checkerResult.suggestedAnswer}"</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- 8. Mistake Review --- */}
        {activeTab === "mistakes" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-800">Notebook Mistakes Review</h4>
                <Badge tone="rose" className="text-[9px] font-extrabold">{note.mistakes?.length || 0} Saved</Badge>
              </div>

              {/* Filter tabs */}
              <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg text-[9px] font-bold">
                {["all", "speaking", "writing", "questions"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setMistakeFilter(f)}
                    className={`px-2 py-0.5 rounded transition-all capitalize ${
                      mistakeFilter === f ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filteredMistakes.length === 0 ? (
              <div className="py-10 text-center text-xs font-semibold text-slate-400">
                No mistakes tracked for the selected filter. Good job! 🎉
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMistakes.map((mst) => (
                  <div key={mst.id} className="p-3 bg-rose-50/30 rounded-2xl border border-rose-100/50 space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-extrabold text-slate-400">
                      <span className="uppercase text-rose-500">Practice Type: {mst.type}</span>
                      <span>{new Date(mst.date).toLocaleDateString()}</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="text-rose-600 font-medium leading-relaxed">
                        ❌ <b>Wrong:</b> "{mst.original}"
                      </div>
                      <div className="text-emerald-700 font-bold leading-relaxed">
                        ✓ <b>Correct:</b> "{mst.corrected}"
                      </div>
                    </div>

                    {mst.rule && (
                      <div className="p-2 bg-white rounded-xl border border-rose-50 text-[10px] text-slate-500 font-semibold leading-normal">
                        💡 <b>Rule:</b> {mst.rule}
                      </div>
                    )}

                    <div className="pt-1 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRepeatMistake(mst.id)}
                        className="text-[9px] font-bold h-7 text-rose-600 hover:bg-rose-50 hover:border-rose-100 border-rose-100"
                      >
                        Practice Clear
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
