// r:/Inernship/WebDevelopment/Project/AI-English-Learning-Website/frontend/src/components/lesson/ExamplesMakeSentencesSection.tsx
import React, { useState, useEffect } from "react";
import {
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Send,
  RefreshCw
} from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import aiTutorService from "../../services/aiTutorService";

interface ExamplesMakeSentencesSectionProps {
  sectionData: {
    heading: string;
    body: string;
    sourceType: string;
  };
  parentTitle: string;
  checklist: {
    readExamples: boolean;
    listenExamples: boolean;
    understandPattern: boolean;
    make3Sentences: boolean;
    checkOneSentence: boolean;
  };
  setChecklist: React.Dispatch<React.SetStateAction<{
    readExamples: boolean;
    listenExamples: boolean;
    understandPattern: boolean;
    make3Sentences: boolean;
    checkOneSentence: boolean;
  }>>;
  weakPatterns: string[];
  setWeakPatterns: React.Dispatch<React.SetStateAction<string[]>>;
  handleMarkComplete: () => Promise<void>;
  handleStartNextSection: () => Promise<void>;
  progress: { completed: boolean } | null;
  handleListenPracticeLine: (line: string) => Promise<void>;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

const getPatternForSection = (heading: string, parentTitle: string) => {
  const title = (parentTitle || "").toLowerCase();
  if (title.includes("routine") || title.includes("day 1")) {
    return {
      pattern: "Subject + Verb(s/es) + Object / Time Expression",
      description: "Used to describe daily routines or habitual actions. Singular subjects take 'verb + s/es', while plural/I/you take base verbs.",
      formula: "e.g., I (Subject) + brush (Verb) + my teeth (Object) + every morning (Time)."
    };
  }
  if (title.includes("simple present") || title.includes("day 2")) {
    return {
      pattern: "Subject + Verb (Base/Present) + Object",
      description: "Basic sentence structure in English. Connects a doer to an action and the receiver of that action.",
      formula: "e.g., We (Subject) + play (Verb) + cricket (Object)."
    };
  }
  if (title.includes("introduction") || title.includes("day 3")) {
    return {
      pattern: "My name is [Name] / I am [Occupation/State]",
      description: "Used for introducing oneself, expressing origin, occupation, or status.",
      formula: "e.g., My name (Subject) + is (Verb) + Rahul (Name) / I (Subject) + am (Verb) + a student (Noun)."
    };
  }
  if (title.includes("demonstratives") || title.includes("day 4")) {
    return {
      pattern: "This/That/These/Those + Verb + Noun(s)",
      description: "Demonstrative pronouns pointing to things near or far, singular or plural.",
      formula: "e.g., These (Plural/Near) + are (Verb) + my books (Noun)."
    };
  }
  if (title.includes("there is") || title.includes("there are") || title.includes("day 5")) {
    return {
      pattern: "There is + Singular Noun + Place / There are + Plural Noun + Place",
      description: "Used to declare the existence or presence of something in a specific location.",
      formula: "e.g., There is (Singular) + a pen (Noun) + on the table (Place)."
    };
  }
  // Generic fallback
  return {
    pattern: "Subject + Verb + Object / Complement",
    description: "Standard English sentence pattern structure linking the subject to the action.",
    formula: "e.g., I (Subject) + learn (Verb) + English (Object)."
  };
};

export default function ExamplesMakeSentencesSection({
  sectionData,
  parentTitle,
  checklist,
  setChecklist,
  weakPatterns,
  setWeakPatterns,
  handleMarkComplete,
  handleStartNextSection,
  progress,
  handleListenPracticeLine,
  isBookmarked,
  onToggleBookmark
}: ExamplesMakeSentencesSectionProps) {
  const examples = sectionData.body
    .split("\n")
    .map(line => line.trim().replace(/^\d+\.\s*/, ""))
    .filter(Boolean);

  const patternInfo = getPatternForSection(sectionData.heading, parentTitle);

  // States
  const [inputs, setInputs] = useState<string[]>(["", "", ""]);
  const [checkResults, setCheckResults] = useState<Array<{
    checked: boolean;
    checking: boolean;
    result: "correct" | "incorrect" | null;
    answer?: string;
    correctedSentence?: string;
    explanation?: string;
    weakPattern?: string;
  }>>([
    { checked: false, checking: false, result: null },
    { checked: false, checking: false, result: null },
    { checked: false, checking: false, result: null }
  ]);

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "coach"; text: string }>>([
    {
      sender: "coach",
      text: "Hello! I am your Sentence Coach. Ask me to explain the pattern, give more examples, check your sentences, or generate a quiz."
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<{
    question: string;
    correctLetter: string;
    explanation: string;
  } | null>(null);

  // Listen State for global player
  const [isListeningAll, setIsListeningAll] = useState(false);
  type SentenceCoachResult = Awaited<ReturnType<typeof aiTutorService.askSentenceCoach>>;

  const formatResultLabel = (result: SentenceCoachResult["result"]) => {
    if (result === "correct") return "Correct";
    if (result === "incorrect") return "Incorrect";
    if (result === "unrelated") return "Info";
    return "Info";
  };

  const formatCoachResponse = (response: SentenceCoachResult) => {
    const parts = [
      `Result: ${formatResultLabel(response.result)}`,
      `Answer: ${response.answer || "N/A"}`,
    ];

    if (response.correctedSentence) {
      parts.push(`Corrected Sentence: ${response.correctedSentence}`);
    }

    parts.push(`Explanation: ${response.explanation}`);

    if (response.weakPattern) {
      parts.push(`Weak Pattern: ${response.weakPattern}`);
    }

    return parts.join("\n");
  };

  const addWeakPattern = (pattern?: string) => {
    if (!pattern) return;
    setWeakPatterns(prev => (prev.includes(pattern) ? prev : [...prev, pattern]));
  };


  // Auto-fill checklist for Make 3 sentences when inputs are 5+ characters long
  useEffect(() => {
    const filledAll = inputs.every(inp => inp.trim().length >= 5);
    if (filledAll !== checklist.make3Sentences) {
      setChecklist(prev => ({ ...prev, make3Sentences: filledAll }));
    }
  }, [inputs, checklist.make3Sentences, setChecklist]);

  // Audio helper: Listen all examples sequentially
  const handleListenAll = async () => {
    if (typeof window === "undefined" || !window.speechSynthesis || examples.length === 0) return;

    if (isListeningAll) {
      window.speechSynthesis.cancel();
      setIsListeningAll(false);
      return;
    }

    setIsListeningAll(true);
    setChecklist(prev => ({ ...prev, listenExamples: true }));

    const speakSequence = (index: number) => {
      if (index >= examples.length || !isListeningAll) {
        setIsListeningAll(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(examples[index]);
      utterance.lang = "en-US";
      utterance.rate = 0.85;

      utterance.onend = () => {
        speakSequence(index + 1);
      };
      utterance.onerror = () => {
        setIsListeningAll(false);
      };

      window.speechSynthesis.speak(utterance);
    };

    window.speechSynthesis.cancel();
    speakSequence(0);
  };

  // Check one input sentence
  const handleCheckInput = async (idx: number) => {
    const text = inputs[idx].trim();
    if (!text) return;

    setCheckResults(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], checking: true };
      return copy;
    });

    try {
      const response = await aiTutorService.askSentenceCoach(
        "check_sentence",
        text,
        examples,
        patternInfo
      );

      setChecklist(prev => ({ ...prev, checkOneSentence: true }));

      if (response.result === "incorrect") {
        addWeakPattern(response.weakPattern);
      }

      setCheckResults(prev => {
        const copy = [...prev];
        copy[idx] = {
          checked: true,
          checking: false,
          result: response.result === "correct" ? "correct" : "incorrect",
          answer: response.answer,
          correctedSentence: response.correctedSentence,
          explanation: response.explanation,
          weakPattern: response.weakPattern,
        };
        return copy;
      });

      setChatHistory(prev => [
        ...prev,
        { sender: "user", text: `Check my sentence: "${text}"` },
        { sender: "coach", text: formatCoachResponse(response) }
      ]);
    } catch (e) {
      console.error(e);
      setCheckResults(prev => {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          checking: false,
          checked: true,
          result: "incorrect",
          explanation: "Something went wrong while checking this sentence. Please try again.",
        };
        return copy;
      });
    }
  };

  // Coach Quick Actions
  const handleExplainPattern = async () => {
    setIsTyping(true);
    setChecklist(prev => ({ ...prev, understandPattern: true }));
    try {
      const response = await aiTutorService.askSentenceCoach("explain_examples", "", examples, patternInfo);
      setChatHistory(prev => [
        ...prev,
        { sender: "user", text: "Can you explain today's sentence pattern and examples?" },
        { sender: "coach", text: formatCoachResponse(response) }
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGiveExamples = async () => {
    setIsTyping(true);
    try {
      const response = await aiTutorService.askSentenceCoach("give_examples", "", examples, patternInfo);
      setChatHistory(prev => [
        ...prev,
        { sender: "user", text: "Give me more examples of this pattern." },
        { sender: "coach", text: formatCoachResponse(response) }
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleImproveSentence = async () => {
    const sentence = inputs.find(inp => inp.trim().length > 0)?.trim();
    if (!sentence) {
      setChatHistory(prev => [
        ...prev,
        { sender: "coach", text: "Please write a sentence in one of the input fields first so I can help you improve it!" }
      ]);
      return;
    }

    setIsTyping(true);
    try {
      const response = await aiTutorService.askSentenceCoach("improve_sentence", sentence, examples, patternInfo);
      setChatHistory(prev => [
        ...prev,
        { sender: "user", text: `How can I improve my sentence: "${sentence}"?` },
        { sender: "coach", text: response.explanation }
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setIsTyping(true);
    try {
      const response = await aiTutorService.askSentenceCoach("generate_quiz", "", examples, patternInfo);
      setChatHistory(prev => [
        ...prev,
        { sender: "user", text: "Start a quiz for me." },
        { sender: "coach", text: response.answer }
      ]);

      const lowerText = response.explanation.toLowerCase();
      let correctLetter = "B";
      if (lowerText.includes("correct answer: a")) correctLetter = "A";
      else if (lowerText.includes("correct answer: b")) correctLetter = "B";
      else if (lowerText.includes("correct answer: c")) correctLetter = "C";

      setActiveQuiz({
        question: response.answer,
        correctLetter,
        explanation: response.explanation
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAnswerQuiz = (selectedLetter: string) => {
    if (!activeQuiz) return;
    const isCorrect = selectedLetter === activeQuiz.correctLetter;

    setChatHistory(prev => [
      ...prev,
      { sender: "user", text: `My answer is ${selectedLetter}.` },
      {
        sender: "coach",
        text: isCorrect
          ? `**Result:** Correct! 🎉\n\n${activeQuiz.explanation}`
          : `**Result:** Incorrect. ❌\n\n${activeQuiz.explanation}`
      }
    ]);

    if (!isCorrect) {
      const wrongPattern = patternInfo.pattern;
      if (!weakPatterns.includes(wrongPattern)) {
        setWeakPatterns(prev => [...prev, wrongPattern]);
      }
    }

    setActiveQuiz(null);
  };

  const handleSendCustomChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatInput("");
    setChatHistory(prev => [...prev, { sender: "user", text: userText }]);
    setIsTyping(true);

    try {
      const lower = userText.toLowerCase();
      let action: "explain_examples" | "give_examples" | "check_sentence" | "improve_sentence" | "generate_quiz" = "check_sentence";

      if (lower.includes("explain") || lower.includes("pattern") || lower.includes("rule")) {
        action = "explain_examples";
      } else if (lower.includes("example") || lower.includes("more")) {
        action = "give_examples";
      } else if (lower.includes("improve") || lower.includes("better") || lower.includes("natural")) {
        action = "improve_sentence";
      } else if (lower.includes("quiz") || lower.includes("test")) {
        action = "generate_quiz";
      }

      const response = await aiTutorService.askSentenceCoach(action, userText, examples, patternInfo);

      setChatHistory(prev => [
        ...prev,
        {
          sender: "coach",
          text: response.result === "unrelated"
            ? response.explanation
            : response.result === "correct"
              ? `**Result:** Correct! ✓\n\n${response.explanation}`
              : response.result === "incorrect"
                ? `**Result:** Needs Improvement ❌\n\n${response.explanation}` +
                (response.correctedSentence ? `\n\n**Corrected:** "${response.correctedSentence}"` : "")
                : response.explanation
        }
      ]);

      if (response.result === "incorrect" && response.weakPattern) {
        const wp = response.weakPattern;
        if (!weakPatterns.includes(wp)) {
          setWeakPatterns(prev => [...prev, wp]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Columns (2/3 width) */}
      <div className="lg:col-span-2 space-y-6">

        {/* Examples Card */}
        <Card className="border border-slate-200 shadow-sm p-6 space-y-4 bg-white rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-indigo-500 text-white px-3 py-1 rounded-bl-xl text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 shadow-sm">
            <Sparkles size={11} /> Examples List
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">📖</span>
                Example Sentences
              </h2>
              <p className="text-xs text-slate-400 font-medium">Read and listen to how the sentence pattern is used.</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleListenAll}
                variant="outline"
                size="sm"
                className={`text-xs ${isListeningAll ? "bg-rose-50 border-rose-200 text-rose-600" : ""}`}
              >
                {isListeningAll ? (
                  <>
                    <VolumeX size={13} className="mr-1" /> Stop
                  </>
                ) : (
                  <>
                    <Volume2 size={13} className="mr-1" /> Listen All
                  </>
                )}
              </Button>
              <label className="flex items-center gap-1.5 cursor-pointer select-none bg-slate-50 border border-slate-200/60 rounded-xl px-2.5 py-1">
                <input
                  type="checkbox"
                  checked={checklist.readExamples}
                  onChange={(e) => setChecklist(prev => ({ ...prev, readExamples: e.target.checked }))}
                  className="h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                />
                <span className="text-[10px] font-bold text-slate-500">Mark Read</span>
              </label>
            </div>
          </div>

          <div className="space-y-2.5">
            {examples.map((line, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200/60 text-[10px] font-extrabold text-slate-600">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-bold text-slate-700">{line}</span>
                </div>
                <button
                  onClick={() => {
                    void handleListenPracticeLine(line);
                    setChecklist(prev => ({ ...prev, listenExamples: true }));
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Listen Sentence"
                >
                  <Volume2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Sentence Pattern Card */}
        <Card className="border border-slate-200 shadow-sm p-6 bg-white rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">⚖️</span>
                Sentence Pattern
              </h2>
              <p className="text-xs text-slate-400 font-medium">Understand the underlying structure.</p>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer select-none bg-slate-50 border border-slate-200/60 rounded-xl px-2.5 py-1">
              <input
                type="checkbox"
                checked={checklist.understandPattern}
                onChange={(e) => setChecklist(prev => ({ ...prev, understandPattern: e.target.checked }))}
                className="h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
              />
              <span className="text-[10px] font-bold text-slate-500">I Understand</span>
            </label>
          </div>

          <div className="p-4 bg-emerald-50/20 border border-emerald-100/50 rounded-xl space-y-2">
            <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">Formula</span>
            <div className="text-sm font-black text-emerald-800 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100/30">
              {patternInfo.pattern}
            </div>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed pt-1">
              {patternInfo.description}
            </p>
            <div className="text-xs italic text-slate-400 pt-1 font-medium">
              {patternInfo.formula}
            </div>
          </div>
        </Card>

        {/* Make Sentences Practice */}
        <Card className="border border-slate-200 shadow-sm p-6 bg-white rounded-2xl space-y-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">✍️</span>
              Make Your Sentences
            </h2>
            <p className="text-xs text-slate-400 font-medium">Write 3 sentences applying the pattern above.</p>
          </div>

          <div className="space-y-4">
            {inputs.map((inp, idx) => (
              <div key={idx} className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Sentence #{idx + 1}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inp}
                    onChange={(e) => {
                      const val = e.target.value;
                      setInputs(prev => {
                        const copy = [...prev];
                        copy[idx] = val;
                        return copy;
                      });
                    }}
                    placeholder={`Write sentence #${idx + 1} here...`}
                    className="flex-1 text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/40 focus:bg-white transition-colors"
                  />
                  <Button
                    size="sm"
                    disabled={!inp.trim() || checkResults[idx].checking}
                    onClick={() => handleCheckInput(idx)}
                    className="shrink-0"
                  >
                    {checkResults[idx].checking ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      "Check"
                    )}
                  </Button>
                </div>

                {checkResults[idx].checked && (
                  <div className={`p-3 rounded-xl border flex gap-2.5 text-xs font-semibold ${checkResults[idx].result === "correct"
                    ? "bg-emerald-50/60 border-emerald-100/60 text-slate-700"
                    : "bg-rose-50/60 border-rose-100/60 text-slate-700"
                    }`}>
                    {checkResults[idx].result === "correct" ? (
                      <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                    )}

                    <div className="space-y-1">
                      <p className="font-black">
                        Result:{" "}
                        <span className={checkResults[idx].result === "correct" ? "text-emerald-600" : "text-rose-600"}>
                          {checkResults[idx].result === "correct" ? "Correct" : "Incorrect"}
                        </span>
                      </p>

                      {checkResults[idx].answer && (
                        <p className="text-slate-600 leading-normal font-medium">
                          <span className="font-bold text-slate-700">Answer:</span>{" "}
                          {checkResults[idx].answer}
                        </p>
                      )}

                      {checkResults[idx].correctedSentence && (
                        <p className="text-emerald-700 font-bold">
                          Corrected Sentence:{" "}
                          <span className="underline">{checkResults[idx].correctedSentence}</span>
                        </p>
                      )}

                      {checkResults[idx].explanation && (
                        <p className="text-slate-500 leading-normal font-medium">
                          <span className="font-bold text-slate-700">Explanation:</span>{" "}
                          {checkResults[idx].explanation}
                        </p>
                      )}

                      {checkResults[idx].weakPattern && (
                        <p className="text-rose-600 font-bold">
                          Weak Pattern: {checkResults[idx].weakPattern}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Right Column (1/3 width) */}
      <div className="space-y-6">

        {/* Sentence Coach Chat Card */}
        <Card className="border border-slate-200 shadow-sm p-5 bg-white rounded-2xl flex flex-col h-[500px]">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-1.5 bg-indigo-500 rounded-xl text-white">
              <Sparkles size={15} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                Sentence Coach
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI tutor workspace</p>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1.5 scrollbar-thin">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
              >
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">
                  {msg.sender === "user" ? "You" : "Sentence Coach"}
                </span>
                <div
                  className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed whitespace-pre-wrap ${msg.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-slate-100/80 text-slate-700 rounded-tl-none border border-slate-200/50"
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex flex-col items-start mr-auto max-w-[85%]">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">
                  Sentence Coach
                </span>
                <div className="bg-slate-100/80 text-slate-400 rounded-2xl rounded-tl-none p-3 border border-slate-200/50 text-xs font-bold flex items-center gap-1 animate-pulse">
                  <RefreshCw size={12} className="animate-spin" /> Coach is thinking...
                </div>
              </div>
            )}

            {activeQuiz && (
              <div className="bg-indigo-50 border border-indigo-100/50 rounded-xl p-3.5 space-y-2 mt-1">
                <span className="text-[10px] font-bold uppercase text-indigo-700 block">Select your answer:</span>
                <div className="grid grid-cols-3 gap-2">
                  {["A", "B", "C"].map((letter) => (
                    <button
                      key={letter}
                      onClick={() => handleAnswerQuiz(letter)}
                      className="px-3 py-2 bg-white border border-indigo-200 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold text-indigo-700 transition-all shadow-sm"
                    >
                      Option {letter}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="border-t border-slate-100 pt-3 pb-2.5">
            <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
              Quick Coach Actions
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={handleExplainPattern}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 rounded-lg text-[10px] font-extrabold text-slate-600 hover:text-indigo-600 transition-all"
              >
                Explain Pattern
              </button>
              <button
                onClick={handleGiveExamples}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 rounded-lg text-[10px] font-extrabold text-slate-600 hover:text-indigo-600 transition-all"
              >
                Give Examples
              </button>
              <button
                onClick={handleImproveSentence}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 rounded-lg text-[10px] font-extrabold text-slate-600 hover:text-indigo-600 transition-all"
              >
                Improve Sentence
              </button>
              <button
                onClick={handleGenerateQuiz}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 rounded-lg text-[10px] font-extrabold text-slate-600 hover:text-indigo-600 transition-all"
              >
                Generate Quiz
              </button>
            </div>
          </div>

          {/* Custom text chat form */}
          <form onSubmit={handleSendCustomChat} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask the Sentence Coach..."
              className="flex-1 text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isTyping}
              className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
            >
              <Send size={14} />
            </button>
          </form>
        </Card>

        {/* Weak Sentence Patterns Card */}
        {weakPatterns.length > 0 && (
          <Card className="border border-red-200 shadow-sm p-4 bg-red-50/30 rounded-2xl space-y-2.5">
            <h4 className="text-xs font-extrabold text-red-700 flex items-center gap-1.5">
              <AlertCircle size={14} /> Focus Area (Weak Patterns)
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {weakPatterns.map((pat) => (
                <button
                  key={pat}
                  onClick={() => {
                    setChatInput(`Explain structure and correct usage of this weak area: "${pat}"`);
                  }}
                  className="px-2.5 py-1 bg-red-100/50 border border-red-200 hover:bg-red-200 text-[10px] font-bold text-red-700 rounded-lg transition-all"
                  title="Ask Coach to explain this weak area"
                >
                  {pat} 🔍
                </button>
              ))}
            </div>
            <p className="text-[10px] text-red-500 font-semibold italic">
              💡 Tip: Click on a pattern to ask the Sentence Coach for detailed rules and help.
            </p>
          </Card>
        )}

        {/* Checklist Tracker */}
        <Card className="border border-slate-200 shadow-sm p-5 bg-white rounded-2xl space-y-3">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider block border-b border-slate-100 pb-1.5">
            Today's Checklist
          </span>
          <div className="space-y-2">
            {[
              { key: "readExamples", label: "Read examples" },
              { key: "listenExamples", label: "Listen examples" },
              { key: "understandPattern", label: "Understand pattern" },
              { key: "make3Sentences", label: "Make 3 sentences" },
              { key: "checkOneSentence", label: "Check one sentence" }
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-2.5 p-2 bg-slate-50/30 border border-slate-100/50 rounded-xl text-xs font-semibold select-none cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={(checklist as any)[item.key]}
                  onChange={(e) =>
                    setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                />
                <span className={`transition-all ${(checklist as any)[item.key] ? "line-through text-slate-400 font-medium" : "text-slate-700 font-bold"}`}>
                  {item.label}
                </span>
              </label>
            ))}
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
              onClick={handleStartNextSection}
              className="w-full flex items-center justify-center gap-1.5"
              variant="outline"
            >
              Today's Next Step <ArrowRight size={15} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
