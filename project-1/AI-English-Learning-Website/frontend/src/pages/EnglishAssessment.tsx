import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Sparkles, Volume2, Mic, PenTool, CheckCircle, GraduationCap } from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import englishAssessmentService, { type AssessmentQuestion } from "../services/englishAssessmentService";
import { useAuth } from "../hooks/useAuth";

export default function EnglishAssessment() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const questions = englishAssessmentService.getQuestions();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const activeQuestion = questions[currentStep];
  
  const handleSelectOption = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setFeedback(null);
  };

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setFeedback(null);
  };

  const playListeningAudio = () => {
    if (!activeQuestion.audioText) return;
    setIsPlayingAudio(true);
    const utterance = new SpeechSynthesisUtterance(activeQuestion.audioText);
    utterance.lang = "en-US";
    utterance.onend = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleCheckAnswer = () => {
    if (!activeQuestion) return;
    const userAnswer = answers[activeQuestion.id] || "";
    if (!userAnswer.trim()) {
      setFeedback("⚠️ Please provide an answer first.");
      return;
    }

    if (activeQuestion.correctAnswer) {
      if (userAnswer.trim().toLowerCase() === activeQuestion.correctAnswer.toLowerCase()) {
        setFeedback("✅ Mock AI Check: Correct! Excellent grammatical structure.");
      } else {
        setFeedback(`❌ Mock AI Check: Not quite correct. Recommended: "${activeQuestion.correctAnswer}"`);
      }
    } else {
      // open-ended
      if (activeQuestion.category === "writing") {
        const words = userAnswer.split(/\s+/).filter(Boolean).length;
        if (words >= 10) {
          setFeedback("✅ Mock AI Check: Great length! Good use of punctuation and structure.");
        } else {
          setFeedback("💡 Mock AI Check: Try to write at least 2 complete sentences (10+ words).");
        }
      } else if (activeQuestion.category === "speaking") {
        if (userAnswer.toLowerCase().includes("pleasant") || userAnswer.toLowerCase().includes("walk")) {
          setFeedback("✅ Mock AI Check: Pronunciation transcript matches key terms. Good job!");
        } else {
          setFeedback("💡 Mock AI Check: Make sure to read the sentence exactly: 'The weather today is very pleasant for a walk.'");
        }
      } else if (activeQuestion.category === "listening") {
        const cleaned = userAnswer.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
        const target = "practice makes perfect and consistent study builds fluency";
        if (cleaned === target) {
          setFeedback("✅ Mock AI Check: 100% Match! Perfect listening comprehension.");
        } else {
          setFeedback("💡 Mock AI Check: Close! Check spelling of 'consistent' or 'fluency'.");
        }
      } else {
        setFeedback("✅ Mock AI Check: Answer registered for learning path calibration.");
      }
    }
  };

  const handleNextStep = () => {
    setFeedback(null);
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinishAssessment();
    }
  };

  const handlePrevStep = () => {
    setFeedback(null);
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinishAssessment = () => {
    const finalResult = englishAssessmentService.evaluateAnswers(answers);
    englishAssessmentService.saveAssessmentResult(finalResult);
    refreshUser();
    navigate("/english-assessment/result");
  };

  // UI styling helpers
  const categoryMeta = (cat: string) => {
    switch (cat) {
      case "grammar": return { label: "Grammar Core", icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" };
      case "vocabulary": return { label: "Vocabulary Drill", icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" };
      case "writing": return { label: "Writing Skills", icon: PenTool, color: "text-purple-600", bg: "bg-purple-50" };
      case "speaking": return { label: "Speaking Accuracy", icon: Mic, color: "text-amber-600", bg: "bg-amber-50" };
      case "listening": return { label: "Listening & Dictation", icon: Volume2, color: "text-emerald-600", bg: "bg-emerald-50" };
      default: return { label: "Assessment", icon: Sparkles, color: "text-slate-600", bg: "bg-slate-50" };
    }
  };

  const activeMeta = categoryMeta(activeQuestion?.category || "");
  const StepIcon = activeMeta.icon;
  const progressPercent = Math.round(((currentStep + 1) / questions.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 pt-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-700 uppercase tracking-widest">
          <Sparkles size={11} className="animate-spin" /> Frontend Preview
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">English Level Assessment</h1>
        <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto">
          This quick test evaluates your grammar, vocabulary, writing, speaking, and listening to build a personalized roadmap.
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm space-y-2">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <span>Question {currentStep + 1} of {questions.length}</span>
          <span>{progressPercent}% Complete</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main card */}
      <Card className="p-6 border border-slate-100 bg-white shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
          <div className={`p-2 rounded-xl ${activeMeta.bg} ${activeMeta.color}`}>
            <StepIcon size={16} />
          </div>
          <div>
            <Badge tone="indigo" className="text-[8px] font-extrabold uppercase">{activeMeta.label}</Badge>
            <h3 className="font-extrabold text-slate-700 text-xs mt-0.5">Section {currentStep + 1}</h3>
          </div>
        </div>

        {/* Question Text */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-slate-800 leading-normal">
            {activeQuestion?.questionText}
          </h2>

          {/* Grammar & Vocab Choices */}
          {activeQuestion?.choices && (
            <div className="grid gap-2.5">
              {activeQuestion.choices.map((choice) => {
                const isSelected = answers[activeQuestion.id] === choice;
                return (
                  <button
                    key={choice}
                    onClick={() => handleSelectOption(activeQuestion.id, choice)}
                    className={`w-full p-3 rounded-xl border text-left text-xs font-semibold transition-all duration-150 flex items-center justify-between ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/20 text-indigo-700 font-extrabold shadow-sm"
                        : "border-slate-100 bg-white hover:border-slate-200 text-slate-600"
                    }`}
                  >
                    <span>{choice}</span>
                    {isSelected && <CheckCircle size={14} className="text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Listening Audio Trigger */}
          {activeQuestion?.category === "listening" && (
            <div className="flex justify-center py-4">
              <Button
                variant={isPlayingAudio ? "outline" : "primary"}
                onClick={playListeningAudio}
                className="h-10 text-xs font-bold px-6 rounded-xl inline-flex items-center gap-2"
                disabled={isPlayingAudio}
              >
                <Volume2 size={16} className={isPlayingAudio ? "animate-bounce" : ""} />
                {isPlayingAudio ? "Playing Sentence..." : "Play Dictation Audio"}
              </Button>
            </div>
          )}

          {/* Open Ended Text Inputs */}
          {!activeQuestion?.choices && (
            <div className="space-y-2">
              <textarea
                rows={4}
                value={answers[activeQuestion.id] || ""}
                onChange={(e) => handleTextChange(activeQuestion.id, e.target.value)}
                placeholder={activeQuestion.placeholder}
                className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-xs font-semibold leading-relaxed"
              />
              {activeQuestion.category === "speaking" && (
                <div className="p-3 bg-amber-50/30 border border-amber-100 rounded-xl flex items-center gap-2">
                  <span className="text-sm">🗣️</span>
                  <span className="text-[10px] text-amber-800 font-bold">
                    Speak the phrase aloud, then type or paste your spoken transcription in the playground box above.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feedback box */}
        {feedback && (
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-700 leading-normal">
            {feedback}
          </div>
        )}

        {/* Question actions */}
        <div className="flex items-center justify-between border-t border-slate-50 pt-4 gap-3">
          <Button
            variant="ghost"
            onClick={handlePrevStep}
            disabled={currentStep === 0}
            className="text-xs font-bold px-4 h-9 rounded-xl"
          >
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCheckAnswer}
              className="text-xs font-bold px-4 h-9 rounded-xl border-slate-200"
            >
              Check Answer
            </Button>
            <Button
              onClick={handleNextStep}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 h-9 rounded-xl shadow-sm"
            >
              {currentStep === questions.length - 1 ? "Finish Assessment" : "Next Section"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
