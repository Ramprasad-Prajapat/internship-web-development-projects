import { useState } from "react";
import { Lightbulb, Repeat, Trash2, Volume2, Sparkles } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import Badge from "../common/Badge";
import aiNotebookService from "../../services/aiNotebookService";
import type { BadgeTone } from "../common/Badge";
import { shortDate } from "../../utils/dateUtils";
import type { PracticeSourceType } from "../../types/ai.types";
import type { Mistake } from "../../types/mistake.types";

/** Human labels + tones for each practice source. Reused by the filter chips. */
export const SOURCE_LABELS: Record<PracticeSourceType, string> = {
  DAILY_LESSON: "Daily Lesson",
  PREPOSITION: "Preposition",
  WRITING: "Writing",
  SPEAKING: "Speaking",
  USER_IMPORT: "User Import",
};

export const SOURCE_TONES: Record<PracticeSourceType, BadgeTone> = {
  DAILY_LESSON: "indigo",
  PREPOSITION: "violet",
  WRITING: "sky",
  SPEAKING: "amber",
  USER_IMPORT: "indigo",
};

function speak(text: string) {
  if (!text || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

interface MistakeCardProps {
  mistake: Mistake;
  onRepeat: (mistake: Mistake) => void;
  onDelete?: (id: string) => void;
}

export function MistakeCard({ mistake, onRepeat, onDelete }: MistakeCardProps) {
  // Bridged legacy mistakes are read-only (cannot be deleted here).
  const isLegacy = mistake.id.startsWith("legacy_");
  const [savedToNotebook, setSavedToNotebook] = useState(false);
  const handleSaveToNotebook = async () => {
    await aiNotebookService.createNote({
      title: `Mistake: ${mistake.correctSentence}`,
      sourceType: "Mistake",
      originalContent: `Wrong Sentence: ${mistake.wrongSentence || ""}\nCorrect Sentence: ${mistake.correctSentence}\nRule: ${mistake.simpleRule}`,
      tags: ["mistake", mistake.sourceType.toLowerCase()]
    });
    setSavedToNotebook(true);
  };

  return (
    <Card>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone={SOURCE_TONES[mistake.sourceType]}>
          {SOURCE_LABELS[mistake.sourceType]}
        </Badge>
        <Badge tone="slate">{mistake.mistakeType}</Badge>
        {mistake.sourceTitle && (
          <span className="text-xs text-slate-400">{mistake.sourceTitle}</span>
        )}
        <span className="ml-auto text-xs text-slate-400">
          {shortDate(mistake.createdAt)}
        </span>
      </div>

      {mistake.wrongSentence && (
        <p className="text-sm text-slate-400 line-through">{mistake.wrongSentence}</p>
      )}
      <p className="font-medium text-emerald-700">{mistake.correctSentence}</p>

      <p className="mt-1 flex items-start gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
        <Lightbulb size={15} className="mt-0.5 shrink-0 text-amber-500" />
        <span>{mistake.simpleRule}</span>
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => onRepeat(mistake)}>
          <Repeat size={15} /> Practice again
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => speak(mistake.correctSentence)}
        >
          <Volume2 size={15} /> Listen
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSaveToNotebook}
          disabled={savedToNotebook}
          className="text-xs font-semibold"
        >
          <Sparkles size={13} className="text-indigo-500 shrink-0" />
          {savedToNotebook ? "Saved ✓" : "Save to Notebook"}
        </Button>
        {mistake.practicedCount > 0 && (
          <span className="text-xs text-slate-400">
            Practiced {mistake.practicedCount}×
          </span>
        )}
        {!isLegacy && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(mistake.id)}
            aria-label="Delete mistake"
            className="ml-auto rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </Card>
  );
}

export default MistakeCard;
