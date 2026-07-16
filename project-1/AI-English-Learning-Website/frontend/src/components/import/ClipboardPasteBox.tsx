import { ClipboardPaste } from "lucide-react";
import Button from "../common/Button";

interface ClipboardPasteBoxProps {
  value: string;
  onChange: (value: string) => void;
  onPasteFromClipboard: () => void;
  error?: string | null;
  rows?: number;
}

/**
 * Large content box with a "Paste from clipboard" button. Manual typing /
 * Ctrl+V always works; the button is just a convenience. If the clipboard
 * read fails, a plain fallback message is shown.
 */
export function ClipboardPasteBox({
  value,
  onChange,
  onPasteFromClipboard,
  error,
  rows = 12,
}: ClipboardPasteBoxProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor="import-content"
          className="text-sm font-medium text-slate-700"
        >
          Lesson content
        </label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onPasteFromClipboard}
        >
          <ClipboardPaste size={15} /> Paste from clipboard
        </Button>
      </div>

      <textarea
        id="import-content"
        rows={rows}
        className="input-base resize-y font-mono text-[13px] leading-relaxed"
        placeholder="Paste your copied notes here, or use the Paste button. Long content is fine — headings like Goal, Vocabulary, Grammar, Homework are detected automatically."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      <div role="status" aria-live="polite">
        {error ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {error}
          </p>
        ) : (
          <p className="text-xs text-slate-400">
            Tip: if the Paste button is blocked, just paste manually with Ctrl+V
            (Cmd+V on Mac).
          </p>
        )}
      </div>
    </div>
  );
}

export default ClipboardPasteBox;
