import { CheckCircle2, Lightbulb, Repeat, Volume2, XCircle } from "lucide-react";
import type { AnswerCheckResult } from "../../types/ai.types";

interface AiFeedbackCardProps {
  result: AnswerCheckResult;
}

function speak(text: string) {
  if (!text || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/**
 * Beginner-friendly mock-AI feedback. No grammar jargon — just the wrong line,
 * the correct line, one simple rule, and a "say it again" prompt.
 */
export function AiFeedbackCard({ result }: AiFeedbackCardProps) {
  const good = result.isCorrect;

  return (
    <div
      className={[
        "rounded-xl border p-3",
        good ? "border-emerald-100 bg-emerald-50/60" : "border-amber-100 bg-amber-50/60",
      ].join(" ")}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className={[
            "inline-flex items-center gap-1.5 text-sm font-semibold",
            good ? "text-emerald-700" : "text-amber-700",
          ].join(" ")}
        >
          {good ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {good ? "Looks good!" : "Almost — small fix"}
        </span>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
          Score: {result.score}
        </span>
      </div>

      {!good && result.wrongSentence && (
        <p className="text-sm text-slate-400 line-through">{result.wrongSentence}</p>
      )}
      {result.correctSentence && (
        <p className="font-medium text-emerald-700">{result.correctSentence}</p>
      )}

      <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-white/70 px-3 py-2 text-sm text-slate-600">
        <Lightbulb size={15} className="mt-0.5 shrink-0 text-amber-500" />
        <span>{result.simpleRule}</span>
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="flex items-center gap-1.5 text-sm text-slate-500">
          <Repeat size={14} /> {result.practiceAgain}
        </p>
        {result.correctSentence && (
          <button
            type="button"
            onClick={() => speak(result.correctSentence)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            <Volume2 size={13} /> Listen
          </button>
        )}
      </div>
    </div>
  );
}

export default AiFeedbackCard;
