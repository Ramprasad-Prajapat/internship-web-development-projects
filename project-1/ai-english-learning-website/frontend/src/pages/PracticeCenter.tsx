import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sparkles,
  BookOpen,
  PenLine,
  Mic,
  AlertTriangle,
  Bookmark,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Play,
  ArrowRight,
  Clipboard,
  BookMarked,
  Compass,
  GraduationCap
} from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import LoadingState from "../components/common/LoadingState";
import practiceCenterService from "../services/practiceCenterService";
import mistakeService from "../services/mistakeService";
import englishAssessmentService from "../services/englishAssessmentService";
import learnerInsightsService, { type SavedSentence } from "../services/learnerInsightsService";
import { aiNotebookService } from "../services/aiNotebookService";
import historyService from "../services/historyService";
import authService from "../services/authService";
import type { Mistake } from "../types/mistake.types";

import { speakingAiService } from "../services/speakingAiService";
import { writingAiService } from "../services/writingAiService";

type ActiveTab =
  | "hub"
  | "writing"
  | "speaking"
  | "mistakes"
  | "listening";

export default function PracticeCenter() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get("tab") as ActiveTab;

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    (tabParam && ["hub", "writing", "speaking", "mistakes", "listening"].includes(tabParam))
      ? tabParam
      : "hub"
  );

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab") as ActiveTab;
    if (tab && ["hub", "writing", "speaking", "mistakes", "listening"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const [loading, setLoading] = useState(false);

  const assessmentData = englishAssessmentService.getAssessmentResult();
  const user = authService.getUser();
  const userWeakAreas = user?.weakAreas && user.weakAreas.length > 0 ? user.weakAreas : (assessmentData?.weakAreas || []);

  // Writing practice state
  const [writingInput, setWritingInput] = useState("");
  const [writingTargetSentence, setWritingTargetSentence] = useState("");
  const [writingResult, setWritingResult] = useState<{
    score: number;
    betterSentence: string;
    hints: string[];
    simpleRule: string;
    checked: boolean;
    isRealAI?: boolean;
  } | null>(null);

  // Speaking practice state
  const [speakingTarget, setSpeakingTarget] = useState("Continuous practice is the key to mastering English speaking.");
  const [speakingInput, setSpeakingInput] = useState("");
  const [speakingResult, setSpeakingResult] = useState<{
    score: number;
    missingWords: string[];
    extraWords: string[];
    wordsToRepeat: string[];
    recommendedLine: string;
    checked: boolean;
    isRealAI?: boolean;
    grammarMistakes?: string[];
    pronunciationHints?: string[];
    correctedAnswer?: string;
    betterAnswer?: string;
  } | null>(null);
  const [isSpeakingTargetTTS, setIsSpeakingTargetTTS] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Mistake revision state
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [selectedMistake, setSelectedMistake] = useState<Mistake | null>(null);
  const [mistakeRetryAnswer, setMistakeRetryAnswer] = useState("");
  const [mistakeFeedback, setMistakeFeedback] = useState<{
    checked: boolean;
    isCorrect: boolean;
    message: string;
  } | null>(null);

  // Saved sentence practice state
  const [savedSentences, setSavedSentences] = useState<SavedSentence[]>([]);

  // Listening states
  const listeningSampleSentences = [
    "If I were you, I would take that opportunity immediately.",
    "She must have left her keys on the dining table.",
    "He succeeded in finishing the project on schedule.",
    "We should have discussed this issue during yesterday's meeting.",
    "The teacher explained the grammatical rules very clearly to the students."
  ];
  const [listeningTarget, setListeningTarget] = useState(listeningSampleSentences[0]);
  const [listeningInput, setListeningInput] = useState("");
  const [listeningResult, setListeningResult] = useState<{
    score: number;
    checked: boolean;
    diff: Array<{ word: string; match: boolean }>;
  } | null>(null);
  const [isListeningTTSPlaying, setIsListeningTTSPlaying] = useState(false);

  // Speech Synth
  const synthRef = useRef<SpeechSynthesis | null>(window.speechSynthesis);

  // Insights and Suggestions state
  const [insights, setInsights] = useState<any>(null);
  const mistakesCount = insights?.pendingMistakesCount ?? mistakes.filter(m => !m.practicedCount).length;

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [allMistakes, allSentences, ins] = await Promise.all([
        mistakeService.getMistakes(),
        learnerInsightsService.getSavedSentences(),
        learnerInsightsService.getInsights(),
      ]);

      setMistakes(allMistakes);
      setSavedSentences(allSentences);
      setInsights(ins);
    } catch (e) {
      console.error("Error loading practice center data:", e);
    } finally {
      setLoading(false);
    }
  };

  // Text to speech helpers
  const handleTTSPlay = (text: string, onEnd: () => void) => {
    if (!synthRef.current) return;
    synthRef.current.cancel(); // Stop current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    synthRef.current.speak(utterance);
  };

  const handleTTSStop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeakingTargetTTS(false);
    }
  };


  // Start Speech Recognition
  const handleStartSpeechRecognition = () => {
    const rec = speakingAiService.getSpeechRecognitionInstance();
    if (!rec) return;
    setIsRecording(true);
    setSpeakingInput("");
    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setSpeakingInput(text);
    };
    rec.onend = () => {
      setIsRecording(false);
    };
    rec.onerror = (e: any) => {
      console.error("Speech Recognition Error", e);
      setIsRecording(false);
    };
    rec.start();
  };

  // Writing Practice
  const handleCheckWriting = async () => {
    setLoading(true);
    try {
      const res = await writingAiService.checkWriting(writingInput, writingTargetSentence);
      setWritingResult({
        score: res.score,
        betterSentence: res.correctedSentence,
        hints: res.hints,
        simpleRule: res.hints[0] || "Check word usage, capitalization, and punctuation.",
        checked: true,
        isRealAI: res.isRealAI
      });
      if (res.score < 80) {
        await mistakeService.saveMistake({
          sourceType: "WRITING",
          sourceId: "writing_practice",
          sourceTitle: writingTargetSentence ? `Writing: ${writingTargetSentence}` : "Writing Practice Drill",
          wrongSentence: writingInput,
          correctSentence: res.correctedSentence,
          simpleRule: res.hints[0] || "Improve sentence structure, word usage, and spelling.",
          mistakeType: "sentence"
        });
      }
      loadAllData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Speaking Practice
  const handleCheckSpeaking = async () => {
    setLoading(true);
    try {
      const res = await speakingAiService.analyzeSpeaking(null, speakingInput, speakingTarget);
      setSpeakingResult({
        score: res.fluencyScore,
        missingWords: res.wordsToRepeat,
        extraWords: [],
        wordsToRepeat: res.wordsToRepeat,
        recommendedLine: res.betterAnswer || "Practice the target sentence speaking rhythm.",
        checked: true,
        isRealAI: res.isRealAI,
        grammarMistakes: res.grammarMistakes,
        pronunciationHints: res.pronunciationHints,
        correctedAnswer: res.correctedAnswer,
        betterAnswer: res.betterAnswer
      });
      if (res.fluencyScore < 80) {
        await mistakeService.saveMistake({
          sourceType: "SPEAKING",
          sourceId: "speaking_practice",
          sourceTitle: `Speaking: ${speakingTarget}`,
          wrongSentence: speakingInput || "[Incomplete / Muffled speech]",
          correctSentence: speakingTarget,
          simpleRule: res.pronunciationHints?.[0] || "Work on clear pronunciation and syllable emphasis.",
          mistakeType: "sentence"
        });
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Mistake retry verification
  const handleVerifyMistakeRetry = async () => {
    if (!selectedMistake || !mistakeRetryAnswer.trim()) return;
    
    const isMatched = mistakeRetryAnswer.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") ===
      selectedMistake.correctSentence.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

    setMistakeFeedback({
      checked: true,
      isCorrect: isMatched,
      message: isMatched
        ? "Excellent! You corrected the sentence perfectly."
        : "Not quite correct. Review the spelling and preposition uses.",
    });

    if (isMatched) {
      await mistakeService.markMistakePracticed(selectedMistake.id);
      loadAllData();
    }
  };

  // Mark mistake reviewed
  const handleMarkMistakeReviewed = async (id: string) => {
    await mistakeService.markMistakeReviewed(id);
    await historyService.addEntry({
      type: "PRACTICE_CENTER_MISTAKE_REVIEWED" as any,
      title: "Revised Mistake",
      description: "Marked saved mistake as reviewed in Practice Center.",
      sourceType: "MISTAKE",
      sourceId: id,
    });
    setSelectedMistake(null);
    setMistakeFeedback(null);
    setMistakeRetryAnswer("");
    loadAllData();
  };

  const playSentenceTTS = (text: string) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleCheckListening = async () => {
    if (!listeningInput.trim()) return;
    const cleanInput = listeningInput.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    
    const targetWords = listeningTarget.split(/\s+/);
    const inputWords = cleanInput.split(/\s+/);
    
    let matched = 0;
    const diff = targetWords.map(tw => {
      const cleanTw = tw.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      const isMatch = inputWords.includes(cleanTw);
      if (isMatch) matched++;
      return { word: tw, match: isMatch };
    });
    
    const score = Math.round((matched / targetWords.length) * 100);
    
    setListeningResult({
      score,
      checked: true,
      diff
    });
    
    if (score < 80) {
      await mistakeService.saveMistake({
        sourceType: "DAILY_LESSON",
        sourceId: "listening_drill",
        sourceTitle: "Listening Dictation Drill",
        wrongSentence: listeningInput,
        correctSentence: listeningTarget,
        simpleRule: "Dictation spelling or listening omission error.",
        mistakeType: "spelling"
      });
      loadAllData();
    }
    
    historyService.addEntry({
      type: "PRACTICE_CENTER_QUIZ_COMPLETED" as any,
      title: "Completed Listening Practice",
      description: `Scored ${score}% in listening exercise.`,
      sourceType: "PRACTICE_CENTER",
      sourceId: "listening",
    }).catch(() => {});
  };

  // Dynamic Suggestion logic
  const getCoachSuggestion = () => {
    if (mistakesCount > 0) {
      return {
        text: "You have pending mistakes to clear. Practice Mistake Revision to strengthen your grammar!",
        tab: "mistakes",
        actionText: "Fix Mistakes"
      };
    }
    return {
      text: "Speaking is the fastest route to fluency. Try our Speaking Practice module now!",
      tab: "speaking",
      actionText: "Start Speaking"
    };
  };

  const suggestion = getCoachSuggestion();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">English Practice Center</h1>
            <Badge tone="indigo">Frontend Preview</Badge>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Practice writing, speaking, grammar, vocabulary, saved sentences, and mistakes in one place.
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline" size="sm">Back to Dashboard</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left column: Sidebar Tabs & Suggestions */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="flex flex-col gap-2 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
              Practice Modules
            </span>
            {(() => {
              const showWritingFocus = userWeakAreas.some((w: any) => w.toLowerCase() === "writing");
              const showSpeakingFocus = userWeakAreas.some((w: any) => w.toLowerCase() === "speaking");
              const showListeningFocus = userWeakAreas.some((w: any) => w.toLowerCase() === "listening");

              return (
                <>
                  <button
                    onClick={() => setActiveTab("hub")}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-bold transition-all ${
                      activeTab === "hub"
                        ? "bg-indigo-50 text-indigo-750 font-black border-l-2 border-indigo-600 pl-2.5"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Compass className="h-4.5 w-4.5 text-indigo-500" />
                    <span>Skills Practice Hub</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("speaking")}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-bold transition-all ${
                      activeTab === "speaking"
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Mic className="h-4.5 w-4.5 text-indigo-500" />
                    <span>Speaking Practice</span>
                    {showSpeakingFocus && (
                      <Badge tone="violet" className="ml-auto text-[8px] px-1 py-0 shadow-sm animate-pulse">Focus</Badge>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("writing")}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-bold transition-all ${
                      activeTab === "writing"
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <PenLine className="h-4.5 w-4.5 text-indigo-500" />
                    <span>Writing Practice</span>
                    {showWritingFocus && (
                      <Badge tone="violet" className="ml-auto text-[8px] px-1 py-0 shadow-sm animate-pulse">Focus</Badge>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("listening")}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-bold transition-all ${
                      activeTab === "listening"
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Volume2 className="h-4.5 w-4.5 text-indigo-500" />
                    <span>Listening Practice</span>
                    {showListeningFocus && (
                      <Badge tone="violet" className="ml-auto text-[8px] px-1 py-0 shadow-sm animate-pulse">Focus</Badge>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("mistakes")}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-bold transition-all ${
                      activeTab === "mistakes"
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <AlertTriangle className="h-4.5 w-4.5 text-indigo-500" />
                    <span>Mistake Revision</span>
                    {mistakesCount > 0 && (
                      <span className="ml-auto bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                        {mistakesCount}
                      </span>
                    )}
                  </button>
                </>
              );
            })()}
          </div>

          {/* Coach suggestions */}
          <Card className="p-4 border-dashed border-indigo-200 bg-indigo-50/40">
            <span className="text-[10px] font-black text-indigo-600 tracking-wider uppercase flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3 w-3" />
              Mock AI Suggestion
            </span>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold mb-3">
              "{suggestion.text}"
            </p>
            <Button
              size="sm"
              variant="primary"
              className="w-full"
              onClick={() => setActiveTab(suggestion.tab as ActiveTab)}
            >
              {suggestion.actionText}
            </Button>
          </Card>
        </div>

        {/* Right column: Active module content */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {loading ? (
            <LoadingState message="Preparing practice workspace..." />
          ) : (
            <>
              {/* Tab 0: Skills Practice Hub Dashboard */}
              {activeTab === "hub" && (
                <div className="space-y-6 animate-fade-in">
                  {/* Mock AI Suggestion card */}
                  <Card className="p-5 border border-purple-200 bg-purple-50/5 shadow-sm space-y-3 rounded-2xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 -mt-6 -mr-6 h-24 w-24 rounded-full bg-indigo-50/30 blur-lg" />
                    <div className="flex items-center gap-1.5 border-b border-purple-100/40 pb-2">
                      <Sparkles size={16} className="text-purple-600 animate-pulse" />
                      <h3 className="font-extrabold text-slate-800 tracking-tight text-xs uppercase">
                        Mock AI Study Calibration & Suggestions
                      </h3>
                    </div>
                    <div className="text-xs space-y-2 pt-1">
                      <p className="font-bold text-slate-700 leading-normal">
                        Today's focus recommendation:{" "}
                        <span className="text-purple-600 font-black">
                          {(() => {
                            const recommendList = userWeakAreas.map((w: any) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
                            if (recommendList.length === 0) {
                              return "Speaking + Writing";
                            }
                            if (recommendList.length === 1) {
                              return `${recommendList[0]} + Writing`;
                            }
                            return recommendList.slice(0, 2).join(" + ");
                          })()}
                        </span>.
                      </p>
                      <p className="text-slate-500 font-medium leading-relaxed">
                        Today focus: Speaking + Writing. Practice Speaking Room first, then try the Writing Lab or Listening Practice. We highlighted your focus areas based on your study history and placement results.
                      </p>
                    </div>
                  </Card>

                  {/* 4-Card Skills Practice Hub Grid */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    {/* 1. Writing Lab */}
                    <Card className="p-5 border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <PenLine className="h-5 w-5 text-indigo-650" />
                          <h4 className="text-sm font-extrabold text-slate-800">Writing Lab</h4>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-normal">
                          Write sentences or paragraphs. Get checked for grammar, spelling, and keywords.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4 w-full text-xs font-bold"
                        onClick={() => setActiveTab("writing")}
                      >
                        Start Writing Practice
                      </Button>
                    </Card>

                    {/* 2. Speaking Room */}
                    <Card className="p-5 border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Mic className="h-5 w-5 text-indigo-650" />
                          <h4 className="text-sm font-extrabold text-slate-800">Speaking Room</h4>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-normal">
                          Speak target phrases aloud. Receive feedback on word matches and pronunciation.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4 w-full text-xs font-bold"
                        onClick={() => setActiveTab("speaking")}
                      >
                        Start Speaking Practice
                      </Button>
                    </Card>

                    {/* 3. Listening Practice */}
                    <Card className="p-5 border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Volume2 className="h-5 w-5 text-indigo-650" />
                          <h4 className="text-sm font-extrabold text-slate-800">Listening Practice</h4>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-normal">
                          Listen to native-speaker audio clips, then type what you hear to evaluate your listening.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4 w-full text-xs font-bold"
                        onClick={() => setActiveTab("listening")}
                      >
                        Start Listening Practice
                      </Button>
                    </Card>

                    {/* 4. Mistake Revision */}
                    <Card className="p-5 border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-rose-500" />
                          <h4 className="text-sm font-extrabold text-slate-800">Mistake Revision</h4>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-normal">
                          Review your logged grammar/spelling mistakes and re-verify corrected versions.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4 w-full text-xs font-bold"
                        onClick={() => setActiveTab("mistakes")}
                      >
                        Start Revision
                      </Button>
                    </Card>
                  </div>
                </div>
              )}

              {/* Tab 0: Writing playground */}
              {activeTab === "writing" && (
                <Card className="p-6">
                  <h2 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 mb-4">
                    Mock AI Writing Playground
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mb-6">
                    Compose a sentence or a short paragraph. Mock AI checks grammar, capitalization, punctuation, and keyword structures.
                  </p>

                  <div className="mb-4">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                      Topic Idea / Target sentence (optional)
                    </label>
                    <input
                      type="text"
                      value={writingTargetSentence}
                      onChange={(e) => setWritingTargetSentence(e.target.value)}
                      placeholder="e.g. I live in London."
                      className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 mb-4"
                    />

                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                      Your Draft
                    </label>
                    <textarea
                      rows={4}
                      value={writingInput}
                      onChange={(e) => setWritingInput(e.target.value)}
                      placeholder="Type your sentence..."
                      className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  {writingResult?.checked && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl font-black text-indigo-600">{writingResult.score}%</span>
                        <div>
                          <span className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Evaluation Score</span>
                          <span className="text-xs text-slate-500 font-semibold">{writingResult.simpleRule}</span>
                        </div>
                      </div>

                      {writingResult.hints.length > 0 ? (
                        <div className="mb-4">
                          <span className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                            Areas to Polish
                          </span>
                          <ul className="list-disc pl-5 text-xs text-slate-600 font-semibold space-y-1.5">
                            {writingResult.hints.map((hint, idx) => (
                              <li key={idx}>{hint}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-600 font-black mb-4">
                          Perfect capitalization and punctuation! Keep it up.
                        </p>
                      )}

                      <div>
                        <span className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                          Suggested Sentence
                        </span>
                        <div className="text-sm font-bold text-indigo-700 bg-indigo-50/50 rounded-xl p-3 border border-indigo-50 flex items-center justify-between">
                          <span>{writingResult.betterSentence}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(writingResult.betterSentence);
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await aiNotebookService.createNote({
                                title: `Writing Lab: ${writingTargetSentence || "Draft Correction"}`,
                                sourceType: "Writing",
                                originalContent: `My Draft: "${writingInput}"\nCorrection: "${writingResult.betterSentence}"\nFeedback: ${writingResult.simpleRule}`,
                                tags: ["writing-correction", "grammar"]
                              });
                              alert("Correction successfully saved to your AI Notebook!");
                              loadAllData();
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="text-[10px] h-8 font-bold"
                        >
                          Save Correction to Notebook
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setWritingInput("");
                        setWritingTargetSentence("");
                        setWritingResult(null);
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="primary"
                      disabled={!writingInput.trim()}
                      onClick={handleCheckWriting}
                    >
                      Analyze Draft
                    </Button>
                  </div>
                </Card>
              )}

              {/* Tab 1: Speaking check */}
              {activeTab === "speaking" && (
                <Card className="p-6">
                  <h2 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 mb-4">
                    Mock Speaking Practice
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mb-6">
                    Listen to the target sentence, practice reading it aloud, then type or paste what you spoke to evaluate your accuracy.
                  </p>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Target Phrase
                      </span>
                      <span className="text-sm font-bold text-slate-800">{speakingTarget}</span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsSpeakingTargetTTS(true);
                          handleTTSPlay(speakingTarget, () => setIsSpeakingTargetTTS(false));
                        }}
                      >
                        <Volume2 className="h-4 w-4" />
                        {isSpeakingTargetTTS ? "Playing..." : "Listen"}
                      </Button>
                      {isSpeakingTargetTTS && (
                        <Button size="sm" variant="ghost" onClick={handleTTSStop}>
                          Stop
                        </Button>
                      )}
                    </div>
                  </div>

                  {speakingAiService.isSpeechRecognitionSupported() ? (
                    <div className="flex justify-center py-2 mb-4">
                      <button
                        onClick={isRecording ? () => setIsRecording(false) : handleStartSpeechRecognition}
                        className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                          isRecording
                            ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-200"
                            : "bg-indigo-50 hover:bg-indigo-100 text-indigo-650 border border-indigo-200 hover:scale-105"
                        }`}
                        title={isRecording ? "Stop Recording" : "Start Microphone Recording"}
                      >
                        <Mic size={18} className={isRecording ? "animate-bounce" : ""} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-amber-600 font-semibold bg-amber-50 p-2 rounded-lg text-center mb-4">
                      Note: Voice recording not fully supported in this browser. Please type your response.
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                      New Custom Target Sentence (Optional)
                    </label>
                    <input
                      type="text"
                      onChange={(e) => setSpeakingTarget(e.target.value || "Continuous practice is the key to mastering English speaking.")}
                      placeholder="Enter a new sentence to practice..."
                      className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-650 mb-4"
                    />

                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                      Type what you spoke (fallback input)
                    </label>
                    <textarea
                      rows={3}
                      value={speakingInput}
                      onChange={(e) => setSpeakingInput(e.target.value)}
                      placeholder={isRecording ? "Listening to your voice..." : "Speak out loud first, then type it here to verify accuracy..."}
                      className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  {speakingResult?.checked && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black text-indigo-600">{speakingResult.score}%</span>
                          <div>
                            <span className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Pronunciation Accuracy</span>
                            <span className="text-xs text-slate-500 font-semibold">{speakingResult.recommendedLine}</span>
                          </div>
                        </div>
                        {speakingResult.isRealAI !== undefined && (
                          <Badge tone={speakingResult.isRealAI ? "emerald" : "violet"} className="text-[8px] font-black uppercase">
                            {speakingResult.isRealAI ? "Real AI" : "Mock AI"}
                          </Badge>
                        )}
                      </div>

                      {speakingResult.correctedAnswer && (
                        <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[8px] font-bold text-slate-455 uppercase block">Corrected Transcript</span>
                            <p className="text-xs font-extrabold text-slate-700 mt-0.5">"{speakingResult.correctedAnswer}"</p>
                          </div>
                          <button
                            onClick={() => speakingAiService.speakAloud(speakingResult.correctedAnswer || "")}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg"
                            title="Listen corrected answer"
                          >
                            <Volume2 size={12} />
                          </button>
                        </div>
                      )}

                      {speakingResult.betterAnswer && (
                        <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[8px] font-bold text-slate-455 uppercase block">Better spoken suggestion</span>
                            <p className="text-xs font-extrabold text-indigo-600 mt-0.5">"{speakingResult.betterAnswer}"</p>
                          </div>
                          <button
                            onClick={() => speakingAiService.speakAloud(speakingResult.betterAnswer || "")}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg"
                            title="Listen suggestion"
                          >
                            <Volume2 size={12} />
                          </button>
                        </div>
                      )}

                      {speakingResult.grammarMistakes && speakingResult.grammarMistakes.length > 0 && (
                        <div className="text-[10px] leading-normal text-slate-500 border-t border-slate-200/50 pt-2">
                          <span className="font-bold text-rose-500 block">Grammar Corrections:</span>
                          <ul className="list-disc list-inside text-rose-750 font-semibold space-y-0.5">
                            {speakingResult.grammarMistakes.map((m, idx) => (
                              <li key={idx}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {speakingResult.pronunciationHints && speakingResult.pronunciationHints.length > 0 && (
                        <div className="text-[10px] leading-normal text-slate-500">
                          <span className="font-bold text-indigo-550 block">Pronunciation Hints:</span>
                          <ul className="list-disc list-inside text-slate-650 font-semibold space-y-0.5">
                            {speakingResult.pronunciationHints.map((h, idx) => (
                              <li key={idx}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSpeakingInput("");
                        setSpeakingResult(null);
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="primary"
                      disabled={!speakingInput.trim()}
                      onClick={handleCheckSpeaking}
                    >
                      Verify Pronunciation
                    </Button>
                  </div>
                </Card>
              )}

              {/* Tab 2: Mistake revision */}
              {activeTab === "mistakes" && (
                <Card className="p-6">
                  <h2 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 mb-4">
                    Mistakes Revision
                  </h2>
                  
                  {mistakes.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <CheckCircle className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-605">No registered mistakes! Keep practicing to test your skills.</p>
                      <Button size="sm" onClick={() => setActiveTab("speaking")} className="text-[11px] font-bold">Practice Speaking</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Left list */}
                      <div className="md:col-span-1 border-r border-slate-100 pr-4 flex flex-col gap-2 max-h-[450px] overflow-y-auto">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                          Mistakes Log ({mistakes.length})
                        </span>
                        {mistakes.map((mis) => (
                          <button
                            key={mis.id}
                            onClick={() => {
                              setSelectedMistake(mis);
                              setMistakeFeedback(null);
                              setMistakeRetryAnswer("");
                            }}
                            className={`p-3 rounded-xl border text-left transition-all relative ${
                              selectedMistake?.id === mis.id
                                ? "border-indigo-600 bg-indigo-50/20"
                                : "border-slate-100 hover:border-slate-200"
                            }`}
                          >
                            <span className="block text-xs font-bold text-slate-800 truncate pr-6">
                              {mis.wrongSentence}
                            </span>
                            <span className="block text-[9.5px] text-slate-400 font-semibold truncate mt-0.5">
                              Source: {mis.sourceTitle}
                            </span>
                            {mis.practicedCount > 0 && (
                              <span className="absolute top-3 right-3 text-emerald-600" title="Practiced">
                                <CheckCircle size={14} />
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Right retry panel */}
                      <div className="md:col-span-2">
                        {selectedMistake ? (
                          <div className="flex flex-col gap-4">
                            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                              <span className="text-[9px] font-extrabold text-rose-500 uppercase tracking-wider">Incorrect sentence</span>
                              <p className="text-sm font-bold text-slate-800 mt-0.5">"{selectedMistake.wrongSentence}"</p>
                              
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mt-3">Simple Hint</span>
                              <p className="text-xs text-slate-650 font-semibold">{selectedMistake.simpleRule}</p>
                            </div>

                            <div>
                              <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                                Write the Correct Sentence
                              </label>
                              <textarea
                                rows={3}
                                value={mistakeRetryAnswer}
                                onChange={(e) => setMistakeRetryAnswer(e.target.value)}
                                placeholder="Correct the sentence here..."
                                className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-650"
                              />
                            </div>

                            {mistakeFeedback?.checked && (
                              <div className={`p-4 rounded-xl border text-xs font-bold ${
                                mistakeFeedback.isCorrect
                                  ? "bg-emerald-50/70 border-emerald-100 text-emerald-800"
                                  : "bg-amber-50/70 border-amber-100 text-amber-800"
                              }`}>
                                {mistakeFeedback.message}
                                {!mistakeFeedback.isCorrect && (
                                  <p className="mt-2 opacity-95">
                                    Correct: <span className="font-extrabold">{selectedMistake.correctSentence}</span>
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="flex justify-between mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkMistakeReviewed(selectedMistake.id)}
                              >
                                Mark Reviewed
                              </Button>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setMistakeRetryAnswer("");
                                    setMistakeFeedback(null);
                                  }}
                                >
                                  Reset
                                </Button>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  disabled={!mistakeRetryAnswer.trim()}
                                  onClick={handleVerifyMistakeRetry}
                                >
                                  Verify Correction
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                            <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-bold text-slate-500">Select a mistake from the list to start revision</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              )}


              {/* Tab 7: Listening Practice */}
              {activeTab === "listening" && (
                <Card className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-black text-slate-800">Mock AI Listening Practice</h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Listen to a line read aloud using browser Text-to-Speech, then transcribe it to compare accuracy.
                    </p>
                  </div>

                  <div className="space-y-4 max-w-xl mx-auto">
                    {/* Sentence selector */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        Select Listening Sentence
                      </label>
                      <select
                        value={listeningTarget}
                        onChange={(e) => {
                          setListeningTarget(e.target.value);
                          setListeningResult(null);
                          setListeningInput("");
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-xs font-semibold text-slate-700"
                      >
                        {listeningSampleSentences.map((s, idx) => (
                          <option key={idx} value={s}>
                            Sample {idx + 1}: {s.slice(0, 50)}...
                          </option>
                        ))}
                        {savedSentences.map((s, idx) => (
                          <option key={s.id} value={s.sentence}>
                            Saved Note Sentence {idx + 1}: {s.sentence.slice(0, 50)}...
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Audio buttons */}
                    <div className="flex gap-2 justify-center py-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setIsListeningTTSPlaying(true);
                          playSentenceTTS(listeningTarget);
                          setTimeout(() => setIsListeningTTSPlaying(false), 3000);
                        }}
                        className="flex items-center gap-1.5 font-bold h-9 px-4 text-xs"
                      >
                        <Volume2 size={15} />
                        {isListeningTTSPlaying ? "Speaking..." : "Play Sentence Audio"}
                      </Button>
                    </div>

                    {/* Text area */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        Type What You Heard
                      </label>
                      <textarea
                        rows={3}
                        value={listeningInput}
                        onChange={(e) => setListeningInput(e.target.value)}
                        placeholder="Listen to the audio above, then type what you heard..."
                        className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    {/* Result and Highlight */}
                    {listeningResult?.checked && (
                      <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-fade-in">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                          <span>Transcription Score</span>
                          <span className={listeningResult.score >= 85 ? "text-emerald-600" : "text-amber-600"}>
                            {listeningResult.score}%
                          </span>
                         </div>

                         <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                           <div
                             className={`h-full rounded-full transition-all duration-300 ${
                               listeningResult.score >= 85 ? "bg-emerald-500" : "bg-amber-500"
                             }`}
                             style={{ width: `${listeningResult.score}%` }}
                           />
                         </div>

                         {/* Word highlight */}
                         <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-2">
                           <span className="text-[9px] font-bold text-slate-400 block uppercase">Word Matching Analysis</span>
                           <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                             {listeningResult.diff.map((item, idx) => (
                               <span
                                 key={idx}
                                 className={`px-2 py-0.5 rounded-lg border ${
                                   item.match
                                     ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                                     : "bg-rose-50 border-rose-100 text-rose-700"
                                 }`}
                                 title={item.match ? "Matched" : "Missing or mismatched"}
                               >
                                 {item.word}
                               </span>
                             ))}
                           </div>
                         </div>

                         {listeningResult.score === 100 ? (
                           <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/35">
                             ✓ Flawless translation! You heard and typed every single word perfectly.
                           </div>
                         ) : (
                           <div className="text-[10px] text-slate-500 font-semibold bg-white p-2.5 rounded-lg border border-slate-100">
                             Target Sentence: <strong className="text-slate-700">"{listeningTarget}"</strong>
                           </div>
                         )}
                       </div>
                     )}

                     {/* Actions */}
                     <div className="flex justify-end gap-2">
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => {
                           setListeningInput("");
                           setListeningResult(null);
                         }}
                       >
                         Reset
                       </Button>
                       <Button
                         size="sm"
                         variant="primary"
                         disabled={!listeningInput.trim()}
                         onClick={handleCheckListening}
                       >
                         Check Listening
                       </Button>
                     </div>
                   </div>
                  </Card>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
