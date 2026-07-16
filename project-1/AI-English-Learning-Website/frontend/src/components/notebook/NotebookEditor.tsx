import { useState, useEffect } from "react";
import { NotebookItem, NotebookSourceType } from "../../types/aiNotebook.types";
import Card from "../common/Card";
import Button from "../common/Button";
import { Edit3, Trash2, Plus, Sparkles, BookOpen } from "lucide-react";
import aiNotebookService from "../../services/aiNotebookService";

interface NotebookEditorProps {
  selectedNote: NotebookItem | null;
  onNoteCreated: (note: NotebookItem) => void;
  onNoteUpdated: (note: NotebookItem) => void;
  onNoteDeleted: (id: string) => void;
}

const SOURCES: NotebookSourceType[] = [
  "Daily Lesson",
  "Preposition",
  "Extension Inbox",
  "Vocabulary",
  "Speaking",
  "Listening",
  "Reading",
  "Writing",
  "Grammar",
  "Manual Note",
];

export default function NotebookEditor({
  selectedNote,
  onNoteCreated,
  onNoteUpdated,
  onNoteDeleted,
}: NotebookEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<NotebookSourceType>("Manual Note");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      setSourceType(selectedNote.sourceType);
      setContent(selectedNote.originalContent);
      setTagsInput(selectedNote.tags?.join(", ") || "");
      setIsEditing(false);
      setIsCreating(false);
    } else {
      resetForm();
    }
  }, [selectedNote]);

  const resetForm = () => {
    setTitle("");
    setSourceType("Manual Note");
    setContent("");
    setTagsInput("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      if (isCreating) {
        const newNote = await aiNotebookService.createNote({
          title,
          sourceType,
          originalContent: content,
          tags,
        });
        onNoteCreated(newNote);
        setIsCreating(false);
      } else if (selectedNote) {
        const updated = await aiNotebookService.updateNote(selectedNote.id, {
          title,
          sourceType,
          originalContent: content,
          tags,
        });
        onNoteUpdated(updated);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNote) return;
    if (!window.confirm("Are you sure you want to delete this notebook note?")) return;

    try {
      await aiNotebookService.deleteNote(selectedNote.id);
      onNoteDeleted(selectedNote.id);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  if (isCreating || (selectedNote && isEditing)) {
    return (
      <Card className="p-5 border border-slate-100 bg-white space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
            <Sparkles size={16} className="text-indigo-600" />
            {isCreating ? "New AI Notebook Item" : "Edit Notebook Item"}
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsCreating(false);
              setIsEditing(false);
            }}
            className="text-xs font-bold"
          >
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Note Title
            </label>
            <input
              type="text"
              required
              className="input-base w-full text-xs font-semibold"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Past Perfect Rules"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Content Source
              </label>
              <select
                className="input-base w-full bg-white text-xs font-semibold"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as NotebookSourceType)}
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                className="input-base w-full text-xs font-semibold"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="grammar, perfect, exam"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Notebook originalContent
            </label>
            <textarea
              required
              rows={6}
              className="input-base w-full text-xs font-semibold leading-relaxed"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or write your sentences, vocabulary rules, or story here to analyze..."
            />
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={loading} className="w-full text-xs font-bold">
              {loading ? "Saving Note..." : "Save to Notebook"}
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  if (!selectedNote) {
    return (
      <Card className="p-10 border border-slate-100 bg-white text-center flex flex-col items-center justify-center min-h-[300px]">
        <BookOpen className="h-12 w-12 text-slate-300 stroke-1 mb-4" />
        <h4 className="font-extrabold text-slate-700 text-sm tracking-tight">
          Select or add a note to start practice
        </h4>
        <p className="text-[11px] text-slate-400 font-semibold mt-1.5 max-w-sm leading-relaxed">
          Select an item from the left menu list or create a manual card to analyze, quiz, and study using mock AI utilities.
        </p>
        <Button
          onClick={() => {
            resetForm();
            setIsCreating(true);
          }}
          className="mt-5 text-xs font-bold inline-flex items-center gap-1.5"
        >
          <Plus size={15} /> Create Notebook Note
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-5 border border-slate-100 bg-white space-y-4 shadow-sm">
      <div className="flex justify-between items-start gap-4 border-b border-slate-50 pb-3">
        <div>
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
            {selectedNote.sourceType} Note
          </span>
          <h3 className="font-extrabold text-slate-800 text-base mt-1 tracking-tight">
            {selectedNote.title}
          </h3>
        </div>

        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="p-2 h-8 w-8 inline-flex items-center justify-center"
            title="Edit note"
          >
            <Edit3 size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            className="p-2 h-8 w-8 inline-flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:border-rose-100"
            title="Delete note"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <div className="text-xs font-semibold text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/40 whitespace-pre-wrap">
        {selectedNote.originalContent}
      </div>

      {selectedNote.tags && selectedNote.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2">
          {selectedNote.tags.map((t) => (
            <span
              key={t}
              className="bg-slate-100 text-slate-500 font-extrabold text-[9px] px-2 py-0.5 rounded-lg border border-slate-200/30 uppercase tracking-wider"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400">
        <span>Added: {new Date(selectedNote.createdAt).toLocaleDateString()}</span>
        <span>Updated: {new Date(selectedNote.updatedAt).toLocaleDateString()}</span>
      </div>

      <div className="bg-indigo-50/15 border border-indigo-100/30 p-3 rounded-2xl flex items-center justify-between gap-4 mt-2">
        <span className="text-[10px] text-slate-500 leading-relaxed font-semibold">
          💡 Ready to practice? Select any tool in the <b>Practice AI Panel</b> on the right to start studying!
        </span>
        <Button
          size="sm"
          onClick={() => {
            resetForm();
            setIsCreating(true);
          }}
          className="text-[10px] font-bold h-7 shrink-0 inline-flex items-center gap-1"
        >
          <Plus size={12} /> Add New
        </Button>
      </div>
    </Card>
  );
}
