import { useState } from "react";
import { CheckCircle2, Save, Volume2, Wand2 } from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import learningService from "../services/mockLearningService";
import type { WritingCheckResult } from "../types/learning.types";

function speak(text: string) {
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export default function Writing() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<WritingCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const check = async () => {
    if (!text.trim()) return;
    setChecking(true);
    setSavedMsg(null);
    const res = await learningService.checkWriting(text);
    setResult(res);
    await learningService.incrementCount("writing");
    setChecking(false);
  };

  const saveMistake = async () => {
    if (!result || !result.hasMistake) return;
    await learningService.addMistake({
      category: "grammar",
      wrong: result.original,
      correct: result.corrected,
      rule: result.rule,
      source: "Writing",
    });
    setSavedMsg("Saved to your mistakes. Practice it again later! ✅");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Writing notebook</h1>
        <p className="mt-1 text-slate-500">
          Write a sentence about your day, then check your English.
        </p>
      </div>

      <Card>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Your sentence
        </label>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setSavedMsg(null);
          }}
          rows={4}
          placeholder="Example: i am go to market."
          className="input-base resize-none"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={check} disabled={!text.trim() || checking}>
            <Wand2 size={16} /> {checking ? "Checking..." : "Check my English"}
          </Button>
          {text && (
            <Button variant="ghost" onClick={() => speak(text)}>
              <Volume2 size={16} /> Listen
            </Button>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Note: this is a simple offline check (mock). Real AI grammar checking
          (LanguageTool / Gemini) will be added with the backend.
        </p>
      </Card>

      {result && (
        <Card
          className={
            result.hasMistake
              ? "border-amber-100"
              : "border-emerald-100 bg-emerald-50/50"
          }
        >
          {result.hasMistake ? (
            <>
              <h3 className="mb-3 font-semibold text-slate-800">Correction</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Your sentence
                  </p>
                  <p className="text-slate-500 line-through">
                    {result.original}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Correct sentence
                  </p>
                  <p className="font-medium text-emerald-700">
                    {result.corrected}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Simple rule
                  </p>
                  <p className="text-sm text-slate-600">{result.rule}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button variant="secondary" onClick={saveMistake}>
                  <Save size={16} /> Save mistake
                </Button>
                <Button variant="ghost" onClick={() => speak(result.corrected)}>
                  <Volume2 size={16} /> Hear correct
                </Button>
                {savedMsg && (
                  <span className="text-sm font-medium text-emerald-600">
                    {savedMsg}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 size={20} />
              <p className="font-medium">
                Looks good! No common mistakes found. 🎉
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
