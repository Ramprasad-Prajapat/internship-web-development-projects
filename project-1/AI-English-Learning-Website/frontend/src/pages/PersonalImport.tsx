import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardPaste,
  Save,
  Trash2,
  Sparkles,
  Volume2,
  Mic,
  PenTool,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  BookOpen,
} from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import aiNotebookService from "../services/aiNotebookService";
import learnerInsightsService from "../services/learnerInsightsService";
import mistakeService from "../services/mistakeService";
import historyService from "../services/historyService";

export default function PersonalImport() {
  // Input Form States
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [note, setNote] = useState("");
  
  // Status feedback states
  const [savingNote, setSavingNote] = useState(false);
  const [savedNoteMsg, setSavedNoteMsg] = useState<string | null>(null);

  // Practice state
  const [hasGeneratedPractice, setHasGeneratedPractice] = useState(false);
  const [extractedSentences, setExtractedSentences] = useState<string[]>([]);
  const [vocabWords, setVocabWords] = useState<string[]>([]);
  
  // Practice targets
  const [activeSentence, setActiveSentence] = useState("");
  
  // Save status for practice panels
  const [vocabSaved, setVocabSaved] = useState(false);
  const [sentenceSavedMsg, setSentenceSavedMsg] = useState<string | null>(null);
  const [savedSentencesState, setSavedSentencesState] = useState<Record<string, boolean>>({});

  // Writing Practice States
  const [writingInput, setWritingInput] = useState("");
  const [writingResult, setWritingResult] = useState<{
    score: number;
    betterSentence: string;
    capitalizationHint: string | null;
    punctuationHint: string | null;
    rule: string;
  } | null>(null);
  const [writingSaved, setWritingSaved] = useState(false);

  // Speaking Practice States
  const [speakingInput, setSpeakingInput] = useState("");
  const [speakingResult, setSpeakingResult] = useState<{
    accuracy: number;
    missingWords: string[];
    extraWords: string[];
    wordsToRepeat: string[];
  } | null>(null);
  const [speakingSaved, setSpeakingSaved] = useState(false);

  // Split text into sentences and extract words
  const handleGeneratePractice = () => {
    if (!rawText.trim()) return;

    // Sentence extraction
    const splitSentences = rawText
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 8); // filter out tiny artifacts
    
    const pickedSentences = splitSentences.slice(0, 5);
    setExtractedSentences(pickedSentences);
    if (pickedSentences.length > 0) {
      setActiveSentence(pickedSentences[0]);
    }

    // Vocabulary extraction (> 4 chars, unique)
    const cleanedWords = rawText
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 4);
    
    const uniqueWords = Array.from(new Set(cleanedWords)).slice(0, 12);
    setVocabWords(uniqueWords);

    setHasGeneratedPractice(true);
    setWritingResult(null);
    setWritingInput("");
    setWritingSaved(false);
    setSpeakingResult(null);
    setSpeakingInput("");
    setSpeakingSaved(false);
  };

  const handleClear = () => {
    setTitle("");
    setRawText("");
    setNote("");
    setHasGeneratedPractice(false);
    setExtractedSentences([]);
    setVocabWords([]);
    setActiveSentence("");
    setWritingInput("");
    setWritingResult(null);
    setWritingSaved(false);
    setSpeakingInput("");
    setSpeakingResult(null);
    setSpeakingSaved(false);
    setSavedSentencesState({});
  };

  // 1. Save main text note to AI Notebook
  const handleSaveToNotebook = async () => {
    if (!title.trim() || !rawText.trim()) {
      alert("Please enter a title and text content first.");
      return;
    }
    setSavingNote(true);
    try {
      await aiNotebookService.createNote({
        title: title.trim(),
        sourceType: "User Import",
        originalContent: rawText.trim(),
        note: note.trim(),
        tags: ["user-notebook", "personal-import"],
        isUserCreated: true,
        isAdminContent: false,
        contentOwner: "user",
        moduleKey: "user-notebook",
      });

      await historyService.addEntry({
        type: "USER_TEXT_IMPORTED",
        title: "Imported Personal Text",
        description: `Saved "${title.trim()}" to AI Notebook`,
        sourceType: "USER_IMPORT",
        sourceId: null,
      });

      setSavedNoteMsg("Import saved successfully to AI Notebook! 🎉");
      setTimeout(() => setSavedNoteMsg(null), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to save imported text.");
    } finally {
      setSavingNote(false);
    }
  };

  // 2. Save Important Sentence
  const handleSaveSentence = async (sentence: string) => {
    try {
      await learnerInsightsService.addSavedSentence(
        sentence,
        `Extracted from personal import "${title || "Untitled"}"`,
        title || "Personal Import",
        "/personal-import"
      );

      await historyService.addEntry({
        type: "USER_SENTENCE_SAVED",
        title: "Saved Personal Sentence",
        description: `Saved: "${sentence.slice(0, 40)}..."`,
        sourceType: "USER_IMPORT",
        sourceId: null,
      });

      setSavedSentencesState(prev => ({ ...prev, [sentence]: true }));
      setSentenceSavedMsg("Sentence bookmarked in your AI Notebook! ✓");
      setTimeout(() => setSentenceSavedMsg(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Save Vocabulary Note
  const handleSaveVocabulary = async () => {
    if (vocabWords.length === 0) return;
    try {
      await aiNotebookService.createNote({
        title: `Vocabulary: ${title || "Personal Text"}`,
        sourceType: "User Import",
        originalContent: `Extracted words: ${vocabWords.join(", ")}`,
        note: `Saved vocabulary chips from your text import: "${title || "Untitled"}".`,
        tags: ["vocabulary", "user-notebook"],
        isUserCreated: true,
        isAdminContent: false,
        contentOwner: "user",
        moduleKey: "user-notebook",
      });

      setVocabSaved(true);
      setTimeout(() => setVocabSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Verify Writing Practice with Mock AI
  const handleVerifyWriting = async () => {
    if (!writingInput.trim() || !activeSentence) return;

    const original = activeSentence;
    const cleanOriginal = original.toLowerCase().replace(/[^\w\s]/g, "").trim();
    const cleanUser = writingInput.toLowerCase().replace(/[^\w\s]/g, "").trim();

    const origWords = cleanOriginal.split(/\s+/).filter(Boolean);
    const userWords = cleanUser.split(/\s+/).filter(Boolean);

    const common = origWords.filter((w) => userWords.includes(w));
    const score = Math.round((common.length / Math.max(origWords.length, 1)) * 100);

    const hasCapital = /^[A-Z]/.test(writingInput.trim());
    const hasPunctuation = /[.!?]$/.test(writingInput.trim());

    const result = {
      score,
      betterSentence: original,
      capitalizationHint: hasCapital ? null : "Remember to start your sentence with a capital letter.",
      punctuationHint: hasPunctuation ? null : "End your sentence with a punctuation mark (., ! or ?).",
      rule: "Sentence structure is rule-based: start capitalized, verify correct word order, and end with punctuation.",
    };

    setWritingResult(result);
    setWritingSaved(false);

    // Save mistake if score is low
    if (score < 90) {
      await mistakeService.saveMistake({
        sourceType: "USER_IMPORT",
        sourceTitle: `Writing Practice: ${title || "Untitled Import"}`,
        wrongSentence: writingInput.trim(),
        correctSentence: original,
        simpleRule: "Ensure correct words and spelling match the imported source.",
        mistakeType: "grammar",
      });
    }

    await historyService.addEntry({
      type: "USER_IMPORT_WRITING_CHECKED",
      title: "Checked Personal Writing Practice",
      description: `Score: ${score}% on "${title || "Import"}"`,
      sourceType: "USER_IMPORT",
      sourceId: null,
    });
  };

  const handleSaveWritingResult = async () => {
    if (!writingResult || !activeSentence) return;
    try {
      await aiNotebookService.createNote({
        title: `Writing Check: ${title || "Personal Text"}`,
        sourceType: "User Import",
        originalContent: `Target Sentence: "${activeSentence}"\nYour Answer: "${writingInput}"`,
        note: `Mock AI Check Result: Score ${writingResult.score}%\nRule: ${writingResult.rule}`,
        tags: ["writing", "user-notebook"],
        isUserCreated: true,
        isAdminContent: false,
        contentOwner: "user",
        moduleKey: "user-notebook",
      });
      setWritingSaved(true);
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Verify Speaking Practice (Typed Fallback)
  const handleVerifySpeaking = async () => {
    if (!speakingInput.trim() || !activeSentence) return;

    const original = activeSentence;
    const cleanOriginal = original.toLowerCase().replace(/[^\w\s]/g, "").trim();
    const cleanUser = speakingInput.toLowerCase().replace(/[^\w\s]/g, "").trim();

    const origWords = cleanOriginal.split(/\s+/).filter(Boolean);
    const userWords = cleanUser.split(/\s+/).filter(Boolean);

    const missingWords = origWords.filter((w) => !userWords.includes(w));
    const extraWords = userWords.filter((w) => !origWords.includes(w));
    const wordsToRepeat = Array.from(new Set([...missingWords, ...extraWords]));
    const accuracy = Math.round(((origWords.length - missingWords.length) / Math.max(origWords.length, 1)) * 100);

    setSpeakingResult({
      accuracy,
      missingWords,
      extraWords,
      wordsToRepeat,
    });
    setSpeakingSaved(false);

    // Save mistake if accuracy is low
    if (accuracy < 90) {
      await mistakeService.saveMistake({
        sourceType: "USER_IMPORT",
        sourceTitle: `Speaking Practice: ${title || "Untitled Import"}`,
        wrongSentence: speakingInput.trim(),
        correctSentence: original,
        simpleRule: "Ensure spoken/typed sentence accurately matches all original words.",
        mistakeType: "sentence",
      });
    }

    await historyService.addEntry({
      type: "USER_IMPORT_SPEAKING_CHECKED",
      title: "Checked Personal Speaking Practice",
      description: `Accuracy: ${accuracy}% on "${title || "Import"}"`,
      sourceType: "USER_IMPORT",
      sourceId: null,
    });
  };

  const handleSaveSpeakingResult = async () => {
    if (!speakingResult || !activeSentence) return;
    try {
      await aiNotebookService.createNote({
        title: `Speaking Practice: ${title || "Personal Text"}`,
        sourceType: "User Import",
        originalContent: `Target Sentence: "${activeSentence}"\nYour Spoken/Typed: "${speakingInput}"`,
        note: `Mock AI Accuracy Result: ${speakingResult.accuracy}%\nWords to Repeat: ${speakingResult.wordsToRepeat.join(", ") || "None"}`,
        tags: ["speaking", "user-notebook"],
        isUserCreated: true,
        isAdminContent: false,
        contentOwner: "user",
        moduleKey: "user-notebook",
      });
      setSpeakingSaved(true);
    } catch (err) {
      console.error(err);
    }
  };

  const speakSentence = (text: string) => {
    if (!text || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 px-4 sm:px-6">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 bg-white hover:bg-indigo-50/30 px-2.5 py-1 rounded-lg transition-colors shadow-sm/30 mb-2"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
            Personal Text Practice
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Paste your own English text and practice writing, speaking, vocabulary, and saved sentences.
          </p>
        </div>

        <div className="flex items-center bg-amber-50 border border-amber-200/60 rounded-xl px-3 py-1.5 text-[10px] font-extrabold text-amber-700 uppercase tracking-wide gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
          Frontend Preview · Mock AI Active
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Form imports */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-5 border-slate-100 bg-white shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
              <ClipboardPaste className="text-indigo-600 h-5 w-5" />
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
                Import Custom Text
              </h3>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Title / Source Name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Ted Talk: Motivation"
                className="input-base text-xs py-2.5 bg-slate-50 border-slate-100 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                English Text to Practice
              </label>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste simple English paragraphs, dialogues, or sentences here..."
                className="input-base text-xs py-2.5 bg-slate-50 border-slate-100 focus:bg-white resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Optional Notes / Translation
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional notes or custom translations..."
                className="input-base text-xs py-2.5 bg-slate-50 border-slate-100 focus:bg-white resize-none"
              />
            </div>

            <div className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 p-3 rounded-xl leading-relaxed flex gap-2">
              <BookOpen size={14} className="text-slate-400 shrink-0 mt-0.5" />
              <span>This text is saved to your personal notebook only. It will not change course content.</span>
            </div>

            {savedNoteMsg && (
              <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-center">
                {savedNoteMsg}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Button
                onClick={handleSaveToNotebook}
                disabled={savingNote || !title.trim() || !rawText.trim()}
                className="flex-1 text-xs font-bold h-10 gap-1.5"
              >
                <Save size={14} /> Save to AI Notebook
              </Button>
              <Button
                variant="secondary"
                onClick={handleGeneratePractice}
                disabled={!rawText.trim()}
                className="flex-1 text-xs font-bold h-10 gap-1.5"
              >
                <Sparkles size={14} /> Generate Mock AI
              </Button>
              <Button
                variant="ghost"
                onClick={handleClear}
                className="text-xs font-bold h-10 text-slate-400 hover:text-rose-600"
                title="Clear inputs"
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: AI Practice Workspace */}
        <div className="lg:col-span-7 space-y-6">
          {!hasGeneratedPractice ? (
            <Card className="p-10 border border-slate-100 bg-white text-center flex flex-col items-center justify-center min-h-[350px] text-slate-400">
              <Sparkles className="h-12 w-12 text-slate-300 stroke-1 mb-3 animate-pulse" />
              <h4 className="font-extrabold text-slate-700 text-xs tracking-tight">
                AI Practice Workspace Panel
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-1.5 max-w-xs leading-normal">
                Paste some English text in the left panel and click <strong>"Generate Mock AI"</strong> to unlock vocabulary extractions, writing rewrite tests, and spoken pronunciation fallbacks.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* 1. Important Sentences */}
              <Card className="p-5 border-slate-100 bg-white shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-indigo-600" /> 1. Important Sentences
                  </h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Interactive Select</span>
                </div>

                {sentenceSavedMsg && (
                  <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
                    {sentenceSavedMsg}
                  </div>
                )}

                <div className="space-y-3">
                  {extractedSentences.map((sen, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveSentence(sen)}
                      className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                        activeSentence === sen
                          ? "bg-indigo-50/40 border-indigo-200 shadow-sm"
                          : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
                      }`}
                    >
                      <p className="font-extrabold text-slate-800">"{sen}"</p>
                      
                      <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100/50 justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakSentence(sen);
                          }}
                          className="text-[9px] font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md flex items-center gap-1"
                        >
                          <Volume2 size={10} /> Listen
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveSentence(sen);
                          }}
                          disabled={savedSentencesState[sen]}
                          className={`text-[9px] font-extrabold px-2 py-1 rounded-md border ${
                            savedSentencesState[sen]
                              ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                              : "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100"
                          }`}
                        >
                          {savedSentencesState[sen] ? "✓ Saved" : "Save Sentence"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 2. Vocabulary words */}
              {vocabWords.length > 0 && (
                <Card className="p-5 border-slate-100 bg-white shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle size={14} className="text-amber-600" /> 2. Vocabulary Words ({vocabWords.length})
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveVocabulary}
                      disabled={vocabSaved}
                      className="text-[9px] font-extrabold h-7"
                    >
                      {vocabSaved ? "✓ Vocabulary Saved" : "Save Vocabulary Note"}
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {vocabWords.map((word) => (
                      <span
                        key={word}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200/50 rounded-lg text-slate-600 text-xs font-semibold uppercase tracking-wider"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </Card>
              )}

              {/* 3. Writing Practice */}
              {activeSentence && (
                <Card className="p-5 border-slate-100 bg-white shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <PenTool size={14} className="text-indigo-600" /> 3. Writing Practice
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Target sentence: <strong className="text-slate-700 font-extrabold">"{activeSentence}"</strong>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      Rewrite the target sentence below:
                    </label>
                    <textarea
                      rows={2}
                      value={writingInput}
                      onChange={(e) => setWritingInput(e.target.value)}
                      placeholder="Type your rewrite..."
                      className="input-base text-xs bg-slate-50 border-slate-100"
                    />
                  </div>

                  {writingResult && (
                    <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-slate-700">Mock AI Feedback</span>
                        <Badge tone={writingResult.score >= 90 ? "emerald" : "rose"} className="font-bold">
                          Score: {writingResult.score}%
                        </Badge>
                      </div>

                      <div className="space-y-1 mt-2 text-slate-600">
                        <p><strong className="text-slate-700 font-extrabold">Correct Sentence:</strong> {writingResult.betterSentence}</p>
                        {writingResult.capitalizationHint && (
                          <p className="text-rose-600 font-semibold flex items-center gap-1">
                            <AlertTriangle size={11} /> {writingResult.capitalizationHint}
                          </p>
                        )}
                        {writingResult.punctuationHint && (
                          <p className="text-rose-600 font-semibold flex items-center gap-1">
                            <AlertTriangle size={11} /> {writingResult.punctuationHint}
                          </p>
                        )}
                        <p className="text-[10px] bg-white border border-slate-100 rounded-lg p-2 mt-1.5 flex items-center gap-1 text-slate-500">
                          <Lightbulb size={12} className="text-amber-500 shrink-0" />
                          <span><strong>Rule:</strong> {writingResult.rule}</span>
                        </p>
                      </div>

                      {writingSaved ? (
                        <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-center mt-2">
                          ✓ Saved rewrite check to AI Notebook
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSaveWritingResult}
                          className="w-full text-[10px] font-extrabold mt-2 h-8"
                        >
                          Save Writing Result to Notebook
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <Button
                      onClick={handleVerifyWriting}
                      disabled={!writingInput.trim()}
                      className="text-xs font-bold"
                    >
                      Verify with Mock AI
                    </Button>
                  </div>
                </Card>
              )}

              {/* 4. Speaking Practice */}
              {activeSentence && (
                <Card className="p-5 border-slate-100 bg-white shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Mic size={14} className="text-emerald-600" /> 4. Speaking Practice (Typed Fallback)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Read target sentence aloud: <strong className="text-slate-700 font-extrabold">"{activeSentence}"</strong>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      Type or paste exactly what you spoke:
                    </label>
                    <textarea
                      rows={2}
                      value={speakingInput}
                      onChange={(e) => setSpeakingInput(e.target.value)}
                      placeholder="e.g. what you read aloud..."
                      className="input-base text-xs bg-slate-50 border-slate-100"
                    />
                  </div>

                  {speakingResult && (
                    <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-slate-700">Pronunciation Accuracy</span>
                        <Badge tone={speakingResult.accuracy >= 90 ? "emerald" : "rose"} className="font-bold">
                          Accuracy: {speakingResult.accuracy}%
                        </Badge>
                      </div>

                      <div className="space-y-1.5 mt-2 text-slate-600">
                        {speakingResult.missingWords.length > 0 && (
                          <p className="text-rose-600 font-semibold">
                            <strong>Missing words:</strong> {speakingResult.missingWords.join(", ")}
                          </p>
                        )}
                        {speakingResult.extraWords.length > 0 && (
                          <p className="text-amber-600 font-semibold">
                            <strong>Extra words:</strong> {speakingResult.extraWords.join(", ")}
                          </p>
                        )}
                        {speakingResult.wordsToRepeat.length > 0 ? (
                          <p className="text-[10px] text-slate-500 bg-white border border-slate-100 p-2 rounded-lg">
                            💡 <strong>Words to repeat:</strong> {speakingResult.wordsToRepeat.join(", ")}
                          </p>
                        ) : (
                          <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
                            ✓ Flawless speech input! Perfect alignment with target sentence.
                          </p>
                        )}
                      </div>

                      {speakingSaved ? (
                        <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-center mt-2">
                          ✓ Saved speaking attempt to AI Notebook
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSaveSpeakingResult}
                          className="w-full text-[10px] font-extrabold mt-2 h-8"
                        >
                          Save Speaking Attempt to Notebook
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <Button
                      onClick={handleVerifySpeaking}
                      disabled={!speakingInput.trim()}
                      className="text-xs font-bold"
                    >
                      Verify Speech Input
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
