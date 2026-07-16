import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookmarkPlus, Dumbbell, Save, Trash2 } from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import PrepositionRuleCard from "../components/prepositions/PrepositionRuleCard";
import PrepositionExampleList from "../components/prepositions/PrepositionExampleList";
import PrepositionQuizCard from "../components/prepositions/PrepositionQuizCard";
import { usePolling } from "../hooks/usePolling";
import prepositionService from "../services/prepositionService";
import historyService from "../services/historyService";
import aiNotebookService from "../services/aiNotebookService";
import LessonSectionCard from "../components/lesson/LessonSectionCard";
import NextStepCard from "../components/lesson/NextStepCard";
import type {
  PrepositionContent,
  PrepositionNote,
} from "../types/preposition.types";

export default function PrepositionDetail() {
  const { type } = useParams<{ type: string }>();
  const [content, setContent] = useState<PrepositionContent | null>(null);
  const [notes, setNotes] = useState<PrepositionNote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const refresh = useCallback(async () => {
    if (!type) {
      setLoaded(true);
      return;
    }
    const c = await prepositionService.getPreposition(type);
    setContent(c);
    setNotes(c ? await prepositionService.listNotes(c.type) : []);
    setLoaded(true);
  }, [type]);
  usePolling(refresh, 3000);

  // Reset + reload when the preposition changes (route is reused).
  useEffect(() => {
    setContent(null);
    setNotes([]);
    setLoaded(false);
    setNoteText("");
    refresh();
  }, [refresh]);

  // Log one PREPOSITION_VIEWED entry per preposition, once it has loaded.
  // A ref guards against the 3s poll re-render spamming history; it re-logs
  // only when the preposition type actually changes.
  const loggedTypeRef = useRef<string | null>(null);
  useEffect(() => {
    if (!content) return;
    if (loggedTypeRef.current === content.type) return;
    loggedTypeRef.current = content.type;
    void historyService.addEntry({
      type: "PREPOSITION_VIEWED",
      title: `Viewed preposition “${content.name}”`,
      description: content.meaning,
    });
  }, [content]);

  const onSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !noteText.trim()) return;
    await prepositionService.addNote(content.type, noteText);
    setNoteText("");
    setNotes(await prepositionService.listNotes(content.type));
    flash("Note saved.");
  };

  const onDeleteNote = async (id: string) => {
    if (!content) return;
    await prepositionService.deleteNote(id);
    setNotes(await prepositionService.listNotes(content.type));
  };

  const onSaveMistake = async (m: {
    wrong: string;
    correct: string;
    rule: string;
  }) => {
    if (!content) return;
    await prepositionService.saveMistake({ type: content.type, ...m });
    flash("Saved to your Mistakes page.");
  };

  const onQuizComplete = (score: number, total: number) => {
    if (!content) return;
    prepositionService.saveQuizResult(content.type, score, total);
  };

  const [savedToNotebook, setSavedToNotebook] = useState(false);
  const onSaveToNotebook = async () => {
    if (!content) return;
    await aiNotebookService.createNote({
      title: `Preposition: ${content.name}`,
      sourceType: "Preposition",
      originalContent: `Preposition Name: ${content.name}\n\nMeaning:\n${content.meaning}\n\nRule:\n${content.rule}\n\nWhen to Use:\n${content.whenToUse.map(r => `- ${r}`).join("\n")}\n\nExamples:\n${content.examples.map(ex => `- ${ex.sentence}`).join("\n")}`,
      tags: ["prepositions", content.type]
    });
    setSavedToNotebook(true);
    flash("Saved successfully to AI Notebook! 🎉");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        to="/prepositions"
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 bg-white hover:bg-indigo-50/30 px-2.5 py-1 rounded-lg transition-colors shadow-sm/30"
      >
        <ArrowLeft size={12} /> Back to Prepositions
      </Link>

      {!loaded ? (
        <Card>
          <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
        </Card>
      ) : !content ? (
        <Card>
          <EmptyState
            title="Preposition not found"
            message="Pick a preposition from the list."
            action={
              <Link
                to="/prepositions"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                Back to Prepositions
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-violet-100 px-4 py-2 text-2xl font-bold text-violet-700">
                {content.name}
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Preposition “{content.name}”
                </h1>
                <p className="text-sm text-slate-500">{content.meaning}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onSaveToNotebook} disabled={savedToNotebook}>
                {savedToNotebook ? "Saved to Notebook ✓" : "Save to AI Notebook"}
              </Button>
              <Link
                to={`/practice/preposition/${content.type}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                <Dumbbell size={16} /> Practice
              </Link>
            </div>
          </div>

          {toast && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {toast}
            </div>
          )}

          <PrepositionRuleCard content={content} />

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-800">
              Example sentences
            </h2>
            <Card>
              <PrepositionExampleList examples={content.examples} />
            </Card>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-800">
              Common mistakes
            </h2>
            <div className="space-y-2">
              {content.commonMistakes.map((m, i) => (
                <Card key={i}>
                  <p className="text-sm text-slate-400 line-through">{m.wrong}</p>
                  <p className="font-medium text-emerald-700">{m.correct}</p>
                  <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    💡 {m.rule}
                  </p>
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSaveMistake(m)}
                    >
                      <BookmarkPlus size={15} /> Save to my mistakes
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-800">
              Mini quiz — practice questions
            </h2>
            <Card>
              <PrepositionQuizCard
                questions={content.quiz}
                onComplete={onQuizComplete}
              />
            </Card>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-800">My notes</h2>
            <Card>
              <form onSubmit={onSaveNote} className="space-y-2">
                <textarea
                  rows={3}
                  className="input-base resize-y"
                  placeholder={`Write your own note about "${content.name}"...`}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <Button type="submit" disabled={!noteText.trim()}>
                  <Save size={16} /> Save note
                </Button>
              </form>

              {notes.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {notes.map((n) => (
                    <li
                      key={n.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2"
                    >
                      <p className="whitespace-pre-wrap text-sm text-slate-700">
                        {n.text}
                      </p>
                      <button
                        type="button"
                        onClick={() => onDeleteNote(n.id)}
                        aria-label="Delete note"
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Interactive Section Cards at the bottom */}
          {content && (() => {
            const prepSections = [
              {
                heading: "Grammar Rules",
                body: `Rule:\n${content.rule}\n\nWhen to Use:\n${content.whenToUse.map((r) => `• ${r}`).join("\n")}\n\nWhen Not to Use:\n${content.whenNotToUse.map((r) => `• ${r}`).join("\n")}`,
              },
              {
                heading: "Example Sentences",
                body: `Examples:\n${content.examples.map((ex, i) => `${i + 1}. ${ex.sentence}`).join("\n")}`,
              },
              {
                heading: "Common Mistakes",
                body: `Mistakes:\n${content.commonMistakes
                  .map((m) => `Wrong: ${m.wrong}\nCorrect: ${m.correct}\nRule: ${m.rule}`)
                  .join("\n\n")}`,
              },
              {
                heading: "Practice Quiz",
                body: `Quiz Questions:\n${content.quiz
                  .map((q, i) => `${i + 1}. Question: ${q.prompt}\n   Options: ${q.options.join(", ")}`)
                  .join("\n\n")}`,
              },
            ];

            return (
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">
                  Interactive Section Tools (AI-Ready)
                </h2>

                <NextStepCard
                  sourceId={content.type}
                  sourceType="PREPOSITION"
                  sections={prepSections}
                />

                <div className="space-y-3">
                  {prepSections.map((s, i) => (
                    <LessonSectionCard
                      key={i}
                      heading={s.heading}
                      body={s.body}
                      sourceType="Preposition"
                      moduleKey="prepositions"
                      dayNumber={null}
                      sourceTitle={`Preposition ${content.name}`}
                    />
                  ))}
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
