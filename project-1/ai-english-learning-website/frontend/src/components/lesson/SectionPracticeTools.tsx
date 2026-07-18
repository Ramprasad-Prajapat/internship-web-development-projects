import { useState, useEffect } from "react";
import {
  Volume2,
  VolumeX,
  PenTool,
  Mic,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Trophy
} from "lucide-react";
import Button from "../common/Button";
import Card from "../common/Card";
import lessonSectionPracticeService from "../../services/lessonSectionPracticeService";
import historyService from "../../services/historyService";
import type { MockWritingCheckResult, MockSpeakingCheckResult } from "../../types/lessonSection.types";
import type { PracticeSourceType } from "../../types/ai.types";

interface SectionPracticeToolsProps {
  heading: string;
  body: string;
  sourceType: PracticeSourceType;
  sourceId: string | null;
  sourceTitle: string;
  sectionId: string;
}

export default function SectionPracticeTools({
  heading,
  body,
  sourceType,
  sourceId,
  sourceTitle,
  sectionId
}: SectionPracticeToolsProps) {
  const [activeTab, setActiveTab] = useState<"write" | "speak" | "tips">("tips");
  
  // Speaker state
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Write Mode state
  const [writeInput, setWriteInput] = useState("");
  const [writeResult, setWriteResult] = useState<MockWritingCheckResult | null>(null);
  const [checkingWrite, setCheckingWrite] = useState(false);

  // Speak Mode state
  const [speakInput, setSpeakInput] = useState("");
  const [speakResult, setSpeakResult] = useState<MockSpeakingCheckResult | null>(null);
  const [checkingSpeak, setCheckingSpeak] = useState(false);

  // Recommendations state
  const [tips, setTips] = useState<string[]>([]);

  useEffect(() => {
    setTips(lessonSectionPracticeService.getSectionRecommendations(heading, body));
  }, [heading, body]);

  // Log recommendation view once
  useEffect(() => {
    if (activeTab === "tips") {
      void historyService.addEntry({
        type: "SECTION_AI_RECOMMENDATION_VIEWED",
        title: `Viewed recommendations for ${heading}`,
        description: `Checked Mock AI tips for section "${heading}" in ${sourceTitle}.`,
        sourceType,
        sourceId
      });
    }
  }, [activeTab, heading, sourceType, sourceId, sourceTitle]);

  // TTS Speaker
  const handleSpeak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${heading}. ${body}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.cancel(); // Stop any ongoing speech
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Write Check
  const handleCheckWriting = async () => {
    if (!writeInput.trim()) return;
    setCheckingWrite(true);
    
    // Simulate slight network delay for premium feel
    await new Promise(r => setTimeout(r, 600));

    const result = await lessonSectionPracticeService.checkWriting(
      writeInput,
      sourceType,
      sourceId,
      `${sourceTitle} - ${heading}`
    );

    setWriteResult(result);
    setCheckingWrite(false);

    // Log event
    void historyService.addEntry({
      type: "SECTION_WRITING_CHECKED",
      title: `Checked writing in ${heading}`,
      description: `Wrote sentence score: ${result.score}%. Corrected: "${result.betterSentence}"`,
      sourceType,
      sourceId
    });

    if (result.status === "needs-improvement") {
      void historyService.addEntry({
        type: "SECTION_MISTAKE_FOUND",
        title: `Mistake detected in ${heading}`,
        description: `Correction suggested: "${writeInput}" -> "${result.betterSentence}"`,
        sourceType,
        sourceId
      });
    }
  };

  // Speak Check
  const handleCheckSpeaking = async () => {
    if (!speakInput.trim()) return;
    setCheckingSpeak(true);
    
    await new Promise(r => setTimeout(r, 600));

    const result = lessonSectionPracticeService.checkSpeaking(speakInput, body);
    setSpeakResult(result);
    setCheckingSpeak(false);

    // Log event
    void historyService.addEntry({
      type: "SECTION_SPEAKING_CHECKED",
      title: `Checked speaking in ${heading}`,
      description: `Spoken sentence matching accuracy: ${result.accuracy}%`,
      sourceType,
      sourceId
    });
  };

  return (
    <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
      {/* Top tools bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/60 p-1.5 rounded-xl border border-slate-100">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab("tips")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "tips"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
            }`}
          >
            <Lightbulb size={13} /> AI Tips
          </button>
          <button
            onClick={() => setActiveTab("write")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "write"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
            }`}
          >
            <PenTool size={13} /> Write Mode
          </button>
          <button
            onClick={() => setActiveTab("speak")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "speak"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
            }`}
          >
            <Mic size={13} /> Speak Mode
          </button>
        </div>

        <button
          onClick={handleSpeak}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            isSpeaking
              ? "bg-rose-50 text-rose-600 border border-rose-100 animate-pulse"
              : "bg-indigo-50 text-indigo-600 border border-indigo-100/50 hover:bg-indigo-100/80"
          }`}
        >
          {isSpeaking ? (
            <>
              <VolumeX size={14} /> Stop listening
            </>
          ) : (
            <>
              <Volume2 size={14} /> Listen Section
            </>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm/30">
        
        {/* Tips Tab */}
        {activeTab === "tips" && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Lightbulb size={13} className="text-amber-500" /> Mock AI Study Recommendations
            </h4>
            <ul className="space-y-2">
              {tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                  {tip}
                </li>
              ))}
            </ul>
            <div className="mt-3 bg-indigo-50/40 border border-indigo-100/30 rounded-lg p-2.5 text-[11px] text-indigo-600 font-medium">
              💡 Tip: Click on &apos;Listen Section&apos; to hear native-like voice, or use &apos;Speak Mode&apos; to practice pronouncing it.
            </div>
          </div>
        )}

        {/* Write Tab */}
        {activeTab === "write" && (
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <PenTool size={13} className="text-indigo-500" /> Write Mode
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Write a practice sentence or answer based on this section.
              </p>
            </div>
            
            <textarea
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none placeholder-slate-400"
              placeholder="e.g. There is a book on the desk..."
              value={writeInput}
              onChange={(e) => setWriteInput(e.target.value)}
            />

            <div className="flex justify-between items-center">
              <Button
                size="sm"
                onClick={handleCheckWriting}
                disabled={checkingWrite || !writeInput.trim()}
              >
                {checkingWrite ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Checking...
                  </>
                ) : (
                  "Check Writing with Mock AI"
                )}
              </Button>
              {writeResult && (
                <button
                  onClick={() => {
                    setWriteInput("");
                    setWriteResult(null);
                  }}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Write feedback */}
            {writeResult && (
              <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    writeResult.status === "correct"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                  }`}>
                    {writeResult.status === "correct" ? (
                      <>
                        <CheckCircle size={10} /> Correct
                      </>
                    ) : (
                      <>
                        <AlertCircle size={10} /> Needs Improvement
                      </>
                    )}
                  </span>
                  
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                    <Trophy size={12} className="text-amber-500" />
                    Score: {writeResult.score}/100
                  </div>
                </div>

                <div className="bg-slate-50/80 rounded-lg p-2.5 space-y-1.5 text-xs">
                  <div>
                    <span className="font-semibold text-slate-400 text-[10px] uppercase block">Your Input</span>
                    <p className="text-slate-600">{writeInput}</p>
                  </div>
                  
                  {writeResult.status === "needs-improvement" && (
                    <>
                      <div>
                        <span className="font-semibold text-emerald-600 text-[10px] uppercase block">Suggested correction</span>
                        <p className="font-medium text-emerald-700">{writeResult.betterSentence}</p>
                      </div>
                      <div className="text-[11px] text-slate-600 border-l-2 border-indigo-500 pl-2">
                        💡 {writeResult.simpleRule}
                      </div>
                    </>
                  )}

                  {writeResult.capitalizationHint && (
                    <p className="text-[10px] text-amber-600 flex items-center gap-1">
                      ⚠️ {writeResult.capitalizationHint}
                    </p>
                  )}
                  {writeResult.punctuationHint && (
                    <p className="text-[10px] text-amber-600 flex items-center gap-1">
                      ⚠️ {writeResult.punctuationHint}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Speak Tab */}
        {activeTab === "speak" && (
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Mic size={13} className="text-rose-500" /> Speak Mode
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Type or paste the sentence you spoke to calculate pronunciation and memory accuracy.
              </p>
            </div>
            
            <textarea
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none placeholder-slate-400"
              placeholder="Type what you spoke aloud..."
              value={speakInput}
              onChange={(e) => setSpeakInput(e.target.value)}
            />

            <div className="flex justify-between items-center">
              <Button
                size="sm"
                onClick={handleCheckSpeaking}
                disabled={checkingSpeak || !speakInput.trim()}
              >
                {checkingSpeak ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Checking...
                  </>
                ) : (
                  "Check Speaking"
                )}
              </Button>
              {speakResult && (
                <button
                  onClick={() => {
                    setSpeakInput("");
                    setSpeakResult(null);
                  }}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Speak feedback */}
            {speakResult && (
              <div className="mt-3 border-t border-slate-100 pt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          speakResult.accuracy >= 80
                            ? "bg-emerald-500"
                            : speakResult.accuracy >= 50
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${speakResult.accuracy}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600">
                      {speakResult.accuracy}% Match
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50/80 rounded-lg p-2.5 space-y-2">
                  {speakResult.missingWords.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase text-rose-500 block">Missing Words</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {speakResult.missingWords.map(w => (
                          <span key={w} className="bg-rose-50 text-rose-600 text-[10px] px-1.5 py-0.5 rounded border border-rose-100/50 font-medium">
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {speakResult.extraWords.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase text-amber-500 block">Extra/Unrecognized Words</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {speakResult.extraWords.map(w => (
                          <span key={w} className="bg-amber-50 text-amber-600 text-[10px] px-1.5 py-0.5 rounded border border-amber-100/50 font-medium">
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {speakResult.wordsToRepeat.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase text-indigo-500 block">Words to Repeat Practice</span>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        Practice repeating: <span className="font-semibold text-indigo-700">{speakResult.wordsToRepeat.join(", ")}</span>
                      </p>
                    </div>
                  )}

                  <div className="border-t border-slate-200/50 pt-2 mt-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Recommended Practice Line</span>
                    <p className="text-[11px] text-slate-700 italic mt-0.5">&ldquo;{speakResult.recommendedPracticeLine}&rdquo;</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
