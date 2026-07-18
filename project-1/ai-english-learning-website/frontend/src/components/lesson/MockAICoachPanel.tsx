import React, { useState } from "react";
import { Sparkles, PenTool, Mic, Save, Check, Lightbulb } from "lucide-react";
import Button from "../common/Button";

interface MockAICoachPanelProps {
  sectionHeading: string;
  onTabChange: (tab: "tips" | "write" | "speak" | "notebook" | "mistakes") => void;
  onSaveTipToNotebook: (tipText: string) => void;
  savingTip: boolean;
  tipSaved: boolean;
  isQASection?: boolean;
}

export default function MockAICoachPanel({
  sectionHeading,
  onTabChange,
  onSaveTipToNotebook,
  savingTip,
  tipSaved,
  isQASection = false,
}: MockAICoachPanelProps) {
  const [tipsCompleted, setTipsCompleted] = useState<Record<number, boolean>>({});

  const getCoachData = (heading: string) => {
    const h = heading.toLowerCase();
    if (h.includes("vocab") || h.includes("word")) {
      return {
        title: "Vocabulary Coach",
        tips: [
          "Practice 3 difficult words and make 2 sentences.",
          "Check pronunciation of each word with the speaker tool.",
          "Save the new words to your AI Notebook for future review.",
        ],
      };
    }
    if (h.includes("grammar") || h.includes("rule") || h.includes("prep")) {
      return {
        title: "Grammar & Preposition Coach",
        tips: [
          "Check capitalization, punctuation, and sentence structure.",
          "Practice examples with IN, ON, AT or the current preposition.",
          "Write 3 custom sentences applying this rule in Write Mode.",
        ],
      };
    }
    if (h.includes("speaking") || h.includes("drill") || h.includes("pronun")) {
      return {
        title: "Speaking AI Coach",
        tips: [],
      };
    }
    if (h.includes("question") || h.includes("q&a") || h.includes("answers")) {
      return {
        title: "Q&A AI Tutor",
        tips: [
          "Answer questions in complete sentences in Write or Speak Mode.",
          "Listen to the correct pronunciation of questions and native answers.",
          "Generate extra practice questions to challenge yourself.",
          "Save mistakes and useful notes to build your study lists.",
        ],
      };
    }
    if (h.includes("mistake")) {
      return {
        title: "Mistake Prevention Coach",
        tips: [
          "Review wrong answers before moving forward.",
          "Note down why you used the wrong preposition/verb.",
          "Re-write the correct sentences in Write Mode to build muscle memory.",
        ],
      };
    }
    return {
      title: "General Study Guide",
      tips: [
        "Read the section content carefully and summarize it.",
        "Write a 2-sentence summary in Write Mode.",
        "Save the most important notes to the Notebook.",
      ],
    };
  };

  const coachData = getCoachData(sectionHeading);
  const isSpeakingCoach = coachData.title === "Speaking AI Coach";

  const toggleTipDone = (idx: number) => {
    setTipsCompleted((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleSaveAll = () => {
    const tipText = `Coach recommendations for ${sectionHeading}:\n` + coachData.tips.map((t, i) => `${i + 1}. ${t}`).join("\n");
    onSaveTipToNotebook(tipText);
  };

  return (
    <div className="bg-gradient-to-tr from-indigo-50/50 to-purple-50/30 border border-indigo-100/70 rounded-2xl p-5 shadow-sm/30 space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-indigo-500 rounded-xl text-white">
          <Sparkles size={16} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            {coachData.title} <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">Mock AI Coach</span>
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Frontend Preview</p>
        </div>
      </div>

      {isSpeakingCoach ? (
        <div className="text-xs font-semibold text-slate-600 bg-white border border-indigo-100/50 p-3.5 rounded-xl leading-relaxed">
          This is a frontend mock coach. It checks your transcript against the target sentence and helps you improve.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {coachData.tips.map((tip, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all text-xs font-semibold ${
                  tipsCompleted[idx]
                    ? "bg-emerald-50/40 border-emerald-100/70 text-slate-500 line-through"
                    : "bg-white border-slate-100 text-slate-700"
                }`}
              >
                <button
                  onClick={() => toggleTipDone(idx)}
                  className={`p-0.5 rounded-full border mt-0.5 transition-colors ${
                    tipsCompleted[idx]
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-slate-300 hover:border-indigo-500 text-transparent"
                  }`}
                  aria-label={tipsCompleted[idx] ? "Mark tip active" : "Mark tip done"}
                >
                  <Check size={10} />
                </button>
                <div className="flex-1 leading-relaxed">{tip}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1.5">
            <button
              onClick={() => onTabChange("write")}
              className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <PenTool size={13} />
              Start Writing
            </button>
            <button
              onClick={() => onTabChange("speak")}
              className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <Mic size={13} />
              Speak / Record Answer
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isQASection && (
              <Button
                onClick={handleSaveAll}
                disabled={savingTip || tipSaved}
                variant="outline"
                className="w-full justify-center text-xs"
                size="sm"
              >
                <Save size={13} className="mr-1.5" />
                {tipSaved ? "Tips Saved ✓" : "Save Tips to Notebook"}
              </Button>
            )}
            <button
              onClick={() => {
                const allDone = {} as Record<number, boolean>;
                coachData.tips.forEach((_, i) => {
                  allDone[i] = true;
                });
                setTipsCompleted(allDone);
              }}
              className={`flex items-center justify-center gap-1 px-3 py-1.5 border border-transparent hover:bg-slate-100 rounded-xl text-[11px] font-bold text-slate-405 hover:text-slate-600 transition-colors ${
                isQASection ? "w-full" : ""
              }`}
            >
              <Check size={13} />
              All Done
            </button>
          </div>
        </>
      )}
    </div>
  );
}
