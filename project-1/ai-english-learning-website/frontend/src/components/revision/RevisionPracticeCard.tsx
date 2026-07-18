import { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, AlertCircle, Volume2, Mic, Check, ArrowRight, CornerDownRight } from "lucide-react";
import type { RevisionPracticeQuestion, RevisionPracticeResult } from "../../types/revision.types";
import Card from "../common/Card";
import Button from "../common/Button";
import revisionService from "../../services/revisionService";

interface RevisionPracticeCardProps {
  questions: RevisionPracticeQuestion[];
  onFinished: () => void;
}

export default function RevisionPracticeCard({ questions, onFinished }: RevisionPracticeCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [result, setResult] = useState<RevisionPracticeResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const question = questions[currentIndex];

  useEffect(() => {
    setUserAnswer("");
    setResult(null);
  }, [currentIndex, questions]);

  if (!question) {
    return (
      <Card className="p-8 text-center bg-emerald-50 border-emerald-100 max-w-xl mx-auto space-y-4">
        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
          <CheckCircle2 size={24} className="animate-bounce" />
        </div>
        <h3 className="font-extrabold text-lg text-slate-800">
          Practice Complete!
        </h3>
        <p className="text-xs font-semibold text-slate-500">
          You finished all generated practice questions for this session. Great job revising!
        </p>
        <Button
          onClick={onFinished}
          className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Back to Revision Dashboard
        </Button>
      </Card>
    );
  }

  const handleCheck = async () => {
    if (!userAnswer.trim()) return;
    setChecking(true);
    try {
      const res = await revisionService.checkPracticeAnswer(question, userAnswer);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onFinished();
    }
  };

  const simulateSpeech = () => {
    setIsListening(true);
    setTimeout(() => {
      setUserAnswer(question.correctAnswer);
      setIsListening(false);
    }, 1200);
  };

  const speakPrompt = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(question.correctAnswer);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto p-5 sm:p-6 space-y-5 border border-indigo-100 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
            Practice Item {currentIndex + 1} of {questions.length}
          </span>
          <h3 className="font-extrabold text-sm text-slate-800 mt-1">
            Mock AI Revision Practice
          </h3>
        </div>
        <span className="text-xs font-bold text-slate-400">
          Type: {question.practiceType.replace("_", " ")}
        </span>
      </div>

      {/* Prompt / Question */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
        <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">
          Instruction
        </span>
        <h4 className="font-extrabold text-slate-800 text-sm leading-relaxed">
          {question.prompt}
        </h4>
        {question.contextText && (
          <p className="text-xs font-medium text-slate-500 flex items-start gap-1">
            <CornerDownRight size={13} className="shrink-0 text-slate-400 mt-0.5" />
            <span>{question.contextText}</span>
          </p>
        )}
      </div>

      {/* Input controls based on question type */}
      <div className="space-y-3">
        <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">
          Your Answer
        </span>

        {question.practiceType === "preposition_choice" && question.options ? (
          <div className="grid grid-cols-2 gap-2">
            {question.options.map((opt) => (
              <button
                key={opt}
                disabled={result !== null}
                onClick={() => setUserAnswer(opt)}
                className={`py-3 px-4 border rounded-xl font-bold text-xs text-center transition-all ${
                  userAnswer === opt
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {opt.toUpperCase()}
              </button>
            ))}
          </div>
        ) : question.practiceType === "speaking_repeat" ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                disabled={result !== null}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Click Simulate Speak or type the sentence here..."
                className="flex-grow py-3 px-4 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl font-bold text-xs"
              />
              <Button
                type="button"
                disabled={result !== null}
                onClick={speakPrompt}
                variant="ghost"
                className="p-3 border border-slate-200 hover:bg-slate-50 rounded-xl"
                title="Listen to native pronunciation"
              >
                <Volume2 size={16} />
              </Button>
            </div>
            <div className="flex justify-center">
              <Button
                onClick={simulateSpeech}
                disabled={result !== null || isListening}
                className={`flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-bold text-white shadow transition-all ${
                  isListening
                    ? "bg-red-500 animate-pulse"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                <Mic size={14} className={isListening ? "animate-spin" : ""} />
                {isListening ? "Simulating Recording..." : "🎤 Simulate Speak"}
              </Button>
            </div>
          </div>
        ) : (
          <textarea
            disabled={result !== null}
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full min-h-[100px] py-3 px-4 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl font-semibold text-xs"
            rows={3}
          />
        )}
      </div>

      {/* Button Check */}
      {result === null && (
        <Button
          onClick={handleCheck}
          disabled={!userAnswer.trim() || checking}
          className="w-full flex items-center justify-center gap-1.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm"
        >
          <Sparkles size={14} className={checking ? "animate-spin" : ""} />
          {checking ? "Analyzing..." : "Check with Mock AI"}
        </Button>
      )}

      {/* Feedback Results */}
      {result !== null && (
        <div className={`border rounded-2xl p-4 sm:p-5 space-y-3.5 transition-all ${
          result.correct
            ? "bg-emerald-50/50 border-emerald-200 text-emerald-800"
            : "bg-rose-50/50 border-rose-200 text-rose-800"
        }`}>
          <div className="flex items-start gap-2.5">
            {result.correct ? (
              <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
            ) : (
              <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={18} />
            )}
            <div>
              <h4 className="font-extrabold text-sm">
                {result.correct ? "Correct Match!" : "Needs Improvement"}
              </h4>
              <p className="text-xs font-semibold text-slate-700 mt-1">
                {result.feedbackMessage}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-2 text-xs">
            <div>
              <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400 block">
                Correct Answer
              </span>
              <p className="font-extrabold text-slate-800 mt-0.5">
                {result.correctAnswer}
              </p>
            </div>

            <div>
              <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400 block">
                Mock AI Grammar Tip / Rule
              </span>
              <p className="font-medium text-slate-600 mt-0.5">
                {result.ruleExplanation}
              </p>
            </div>

            {result.nextSuggestion && (
              <div>
                <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400 block">
                  Next Step Recommendation
                </span>
                <p className="font-medium text-slate-500 italic mt-0.5">
                  {result.nextSuggestion}
                </p>
              </div>
            )}
          </div>

          <Button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs"
          >
            {currentIndex + 1 < questions.length ? "Next practice question" : "Complete session"}
            <ArrowRight size={13} />
          </Button>
        </div>
      )}
    </Card>
  );
}
