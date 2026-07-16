import { Volume2 } from "lucide-react";
import type { PrepositionExample } from "../../types/preposition.types";

function speak(text: string) {
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

interface PrepositionExampleListProps {
  examples: PrepositionExample[];
}

/** Example sentences with a "listen" button for each. */
export function PrepositionExampleList({
  examples,
}: PrepositionExampleListProps) {
  return (
    <ul className="space-y-2">
      {examples.map((ex, i) => (
        <li
          key={i}
          className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2"
        >
          <div>
            <p className="text-sm text-slate-700">{ex.sentence}</p>
            {ex.note && (
              <p className="mt-0.5 text-xs text-slate-400">{ex.note}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => speak(ex.sentence)}
            aria-label="Listen to example"
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
          >
            <Volume2 size={16} />
          </button>
        </li>
      ))}
    </ul>
  );
}

export default PrepositionExampleList;
