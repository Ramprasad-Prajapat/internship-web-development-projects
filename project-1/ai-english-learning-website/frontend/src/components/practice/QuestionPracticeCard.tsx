import { useState } from "react";
import { BookmarkCheck, BookmarkPlus, Check, Eye, EyeOff } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import Badge from "../common/Badge";
import type { BadgeTone } from "../common/Badge";
import AiFeedbackCard from "./AiFeedbackCard";
import type { AnswerCheckResult, Difficulty, Question } from "../../types/ai.types";

interface QuestionPracticeCardProps {
  question: Question;
  number: number;
  total: number;
  value: string;
  onChange: (value: string) => void;
  onCheck: () => void;
  checking?: boolean;
  result?: AnswerCheckResult | null;
  onSaveMistake?: () => void;
  mistakeSaved?: boolean;
}

const difficultyTone: Record<Difficulty, BadgeTone> = {
  easy: "emerald",
  medium: "amber",
  hard: "rose",
};

/** One practice question: prompt, optional sample, answer box, check + feedback. */
export function QuestionPracticeCard({
  question,
  number,
  total,
  value,
  onChange,
  onCheck,
  checking = false,
  result,
  onSaveMistake,
  mistakeSaved = false,
}: QuestionPracticeCardProps) {
  const [showSample, setShowSample] = useState(false);
  // A mistake is worth saving only when the answer was checked and not correct.
  const canSaveMistake = !!result && !result.isCorrect && !!result.correctSentence;

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Badge tone="indigo">
          Question {number} of {total}
        </Badge>
        <Badge tone={difficultyTone[question.difficulty]}>{question.difficulty}</Badge>
      </div>

      <p className="font-medium text-slate-800">{question.questionText}</p>

      <div>
        <button
          type="button"
          onClick={() => setShowSample((s) => !s)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 transition-colors hover:underline"
        >
          {showSample ? <EyeOff size={13} /> : <Eye size={13} />}
          {showSample ? "Hide sample answer" : "Show sample answer"}
        </button>
        {showSample && (
          <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {question.sampleAnswer}
          </p>
        )}
      </div>

      <textarea
        rows={3}
        className="input-base resize-y"
        aria-label={`Your answer to question ${number}`}
        placeholder="Write your answer here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onCheck} disabled={checking || !value.trim()}>
          <Check size={15} /> {checking ? "Checking…" : "Check answer"}
        </Button>
        {canSaveMistake &&
          (mistakeSaved ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <BookmarkCheck size={15} /> Saved to mistakes
            </span>
          ) : (
            <Button size="sm" variant="ghost" onClick={onSaveMistake}>
              <BookmarkPlus size={15} /> Save mistake
            </Button>
          ))}
      </div>

      {result && <AiFeedbackCard result={result} />}
    </Card>
  );
}

export default QuestionPracticeCard;
