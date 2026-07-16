import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import Button from "../common/Button";
import { cn } from "../../utils/cn";
import type { PrepositionQuizQuestion } from "../../types/preposition.types";

interface PrepositionQuizCardProps {
  questions: PrepositionQuizQuestion[];
  onComplete?: (score: number, total: number) => void;
}

/** Simple tap-to-answer mini quiz with instant feedback and a score. */
export function PrepositionQuizCard({
  questions,
  onComplete,
}: PrepositionQuizCardProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const completedRef = useRef(false);

  const answeredAll =
    questions.length > 0 && questions.every((q) => answers[q.id] !== undefined);
  const score = questions.filter((q) => answers[q.id] === q.answerIndex).length;

  useEffect(() => {
    if (answeredAll && !completedRef.current) {
      completedRef.current = true;
      onComplete?.(score, questions.length);
    }
  }, [answeredAll, score, questions.length, onComplete]);

  const select = (qId: string, optionIndex: number) => {
    if (answers[qId] !== undefined) return; // lock once answered
    setAnswers((prev) => ({ ...prev, [qId]: optionIndex }));
  };

  const reset = () => {
    setAnswers({});
    completedRef.current = false;
  };

  if (questions.length === 0) {
    return (
      <p className="text-sm text-slate-500">No quiz for this preposition yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => {
        const chosen = answers[q.id];
        const answered = chosen !== undefined;
        return (
          <div key={q.id} className="rounded-xl border border-slate-100 p-3">
            <p className="text-sm font-medium text-slate-700">
              {qi + 1}. {q.prompt}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {q.options.map((opt, oi) => {
                const isCorrect = oi === q.answerIndex;
                const isChosen = oi === chosen;
                let tone =
                  "border-slate-200 bg-white text-slate-600 hover:bg-slate-100";
                if (answered) {
                  if (isCorrect)
                    tone = "border-emerald-200 bg-emerald-100 text-emerald-700";
                  else if (isChosen)
                    tone = "border-rose-200 bg-rose-100 text-rose-700";
                  else tone = "border-slate-100 bg-white text-slate-400";
                }
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={answered}
                    onClick={() => select(q.id, oi)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-default",
                      tone,
                    )}
                  >
                    {opt}
                    {answered && isCorrect && (
                      <span className="sr-only"> (correct answer)</span>
                    )}
                    {answered && isChosen && !isCorrect && (
                      <span className="sr-only"> (your answer, incorrect)</span>
                    )}
                  </button>
                );
              })}
            </div>
            {answered && (
              <p className="mt-2 text-xs text-slate-500" aria-live="polite">
                {chosen === q.answerIndex ? "✅ Correct! " : "❌ Not quite. "}
                {q.explanation}
              </p>
            )}
          </div>
        );
      })}

      {answeredAll && (
        <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3">
          <p className="text-sm font-semibold text-indigo-700" aria-live="polite">
            Score: {score} / {questions.length}
          </p>
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw size={15} /> Try again
          </Button>
        </div>
      )}
    </div>
  );
}

export default PrepositionQuizCard;
