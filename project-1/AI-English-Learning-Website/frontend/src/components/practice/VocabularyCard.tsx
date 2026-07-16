import { Check, Trash2, Volume2 } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import type { BadgeTone } from "../common/Badge";
import type { VocabStatus, VocabularyWord } from "../../types/learning.types";

interface VocabularyCardProps {
  word: VocabularyWord;
  onMarkLearned?: (id: string) => void;
  onMarkWeak?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const statusTone: Record<VocabStatus, BadgeTone> = {
  learning: "sky",
  learned: "emerald",
  weak: "amber",
};

/** Speak a word using the browser (free, no API). Falls back silently. */
function pronounce(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/** A single vocabulary word with meaning, example, status and actions. */
export function VocabularyCard({
  word,
  onMarkLearned,
  onMarkWeak,
  onDelete,
}: VocabularyCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-semibold text-slate-800">
              {word.word}
            </h4>
            <button
              onClick={() => pronounce(word.word)}
              title="Pronounce"
              className="rounded-full p-1 text-indigo-500 hover:bg-indigo-50"
            >
              <Volume2 size={16} />
            </button>
          </div>
          <p className="text-sm text-slate-600">{word.meaning}</p>
          {word.hindiMeaning && (
            <p className="text-sm text-slate-400">{word.hindiMeaning}</p>
          )}
        </div>
        <Badge tone={statusTone[word.status]}>{word.status}</Badge>
      </div>

      {word.example && (
        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm italic text-slate-600">
          “{word.example}”
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {onMarkLearned && word.status !== "learned" && (
          <button
            onClick={() => onMarkLearned(word.id)}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
          >
            <Check size={13} /> Learned
          </button>
        )}
        {onMarkWeak && word.status !== "weak" && (
          <button
            onClick={() => onMarkWeak(word.id)}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
          >
            Mark weak
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(word.id)}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 size={13} /> Delete
          </button>
        )}
      </div>
    </Card>
  );
}

export default VocabularyCard;
