import { useState, useEffect } from "react";
import { Save, Check, BookOpen, AlertCircle } from "lucide-react";
import Button from "../common/Button";
import aiNotebookService from "../../services/aiNotebookService";
import historyService from "../../services/historyService";
import type { NotebookItem, NotebookSourceType } from "../../types/aiNotebook.types";

interface SectionNotebookPanelProps {
  heading: string;
  body: string;
  sourceType: NotebookSourceType;
  moduleKey: string;
  dayNumber: number | null;
  sectionId: string;
  sourceTitle: string;
}

export default function SectionNotebookPanel({
  heading,
  body,
  sourceType,
  moduleKey,
  dayNumber,
  sectionId,
  sourceTitle
}: SectionNotebookPanelProps) {
  const [noteText, setNoteText] = useState("");
  const [existingNote, setExistingNote] = useState<NotebookItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing note if any
  useEffect(() => {
    async function checkExisting() {
      try {
        setLoading(true);
        const allNotes = await aiNotebookService.listNotes();
        const found = allNotes.find((n) => {
          const hasSourceType = n.sourceType === sourceType;
          const hasModuleKey = n.tags?.includes(moduleKey);
          const hasSectionId = n.tags?.includes(`section-${sectionId}`);
          const hasDay = dayNumber ? n.tags?.includes(`day-${dayNumber}`) : true;
          return hasSourceType && hasModuleKey && hasSectionId && hasDay;
        });

        if (found) {
          setExistingNote(found);
          setNoteText(found.originalContent);
        } else {
          setExistingNote(null);
          // Set some starter text template
          setNoteText(`Study notes for "${heading}" section:\n\n- `);
        }
      } catch (err) {
        console.error("Error loading notebook note:", err);
      } finally {
        setLoading(false);
      }
    }
    checkExisting();
  }, [sourceType, moduleKey, dayNumber, sectionId, heading]);

  const handleSave = async () => {
    if (!noteText.trim()) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Simulate slight network delay for premium feel
      await new Promise((r) => setTimeout(r, 500));

      if (existingNote) {
        // Update existing note
        const updated = await aiNotebookService.updateNote(existingNote.id, {
          originalContent: noteText.trim(),
        });
        setExistingNote(updated);
      } else {
        // Create new note
        const title = dayNumber
          ? `Day ${dayNumber} Lesson — ${heading}`
          : `Preposition ${sourceTitle} — ${heading}`;

        const tags = [
          "section-note",
          moduleKey,
          dayNumber ? `day-${dayNumber}` : "",
          `section-${sectionId}`,
        ].filter(Boolean);

        const created = await aiNotebookService.createNote({
          title,
          sourceType,
          originalContent: noteText.trim(),
          tags,
        });
        setExistingNote(created);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Log event
      await historyService.addEntry({
        type: "SECTION_NOTEBOOK_SAVED",
        title: `Saved ${heading} to Notebook`,
        description: `Saved notes for section "${heading}" in ${sourceTitle} to AI Notebook.`,
        sourceType: sourceType === "Daily Lesson" ? "DAILY_LESSON" : "PREPOSITION",
        sourceId: dayNumber ? dayNumber.toString() : sectionId,
        dayNumber: dayNumber,
      });
    } catch (err) {
      console.error("Error saving to notebook:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <p className="text-xs text-slate-400 py-4 animate-pulse">Loading notes...</p>;
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <BookOpen size={13} className="text-indigo-500" /> AI Notebook Section Notes
        </h4>
        {existingNote && (
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">
            Linked to AI Notebook
          </span>
        )}
      </div>

      <div className="relative">
        <textarea
          rows={4}
          className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-sans leading-relaxed text-slate-700 resize-y placeholder-slate-400 bg-slate-50/20"
          placeholder="Write down vocabulary, key rules, and sentences to save to your notebook..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !noteText.trim()}
          variant={existingNote ? "secondary" : "primary"}
        >
          {isSaving ? (
            "Saving..."
          ) : saveSuccess ? (
            <span className="flex items-center gap-1">
              <Check size={14} /> Saved Note!
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Save size={14} /> {existingNote ? "Update Note" : "Save Note to AI Notebook"}
            </span>
          )}
        </Button>

        {saveSuccess && (
          <p className="text-[11px] text-emerald-600 font-medium animate-fade-in flex items-center gap-1">
            ✓ Syncing complete. Available in your main AI Notebook.
          </p>
        )}
      </div>

      {/* Notebook Section Preview for Context */}
      <div className="rounded-lg bg-slate-50/80 p-2.5 text-[11px] text-slate-500 border border-slate-200/50 space-y-1">
        <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400 block">Section Reference Content</span>
        <p className="italic line-clamp-2">&ldquo;{body}&rdquo;</p>
      </div>
    </div>
  );
}
