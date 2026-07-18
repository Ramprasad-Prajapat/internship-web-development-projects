import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileX, Save, Trash2 } from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import ImportPreviewCard from "../components/import/ImportPreviewCard";
import ImportSourceSelector from "../components/import/ImportSourceSelector";
import clipboardImportService from "../services/clipboardImportService";
import type { ImportDraft, ImportSaveType } from "../types/import.types";
import type { PrepositionType } from "../types/preposition.types";

export default function ImportPreview() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ImportDraft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saveType, setSaveType] = useState<ImportSaveType>("general");
  const [prepositionType, setPrepositionType] =
    useState<PrepositionType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const d = clipboardImportService.getImportDraft();
    setDraft(d);
    if (d) {
      setSaveType(d.saveType);
      setPrepositionType(d.prepositionType);
    }
    setLoaded(true);
  }, []);

  const previewData = useMemo(() => {
    if (!draft) return null;
    return clipboardImportService.createImportPreview({
      ...draft,
      saveType,
      prepositionType,
    });
  }, [draft, saveType, prepositionType]);

  const onFinalSave = async () => {
    if (!draft) return;
    setError(null);
    if (saveType === "preposition" && !prepositionType) {
      setError("Please pick which preposition this note is about.");
      return;
    }
    setSaving(true);
    const finalDraft: ImportDraft = { ...draft, saveType, prepositionType };
    // finalizeImport logs IMPORT_FINAL_SAVED + the specific save event.
    const result = await clipboardImportService.finalizeImport(finalDraft);
    clipboardImportService.clearImportDraft();
    setSaving(false);
    if (result.lessonId) navigate(`/lesson/${result.lessonId}`);
    else navigate("/prepositions");
  };

  const onClearDraft = () => {
    clipboardImportService.clearImportDraft();
    navigate("/lesson-import");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/lesson-import"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600"
        >
          <ArrowLeft size={16} /> Back to Edit
        </Link>
        {draft && (
          <Button size="sm" variant="ghost" onClick={onClearDraft}>
            <Trash2 size={15} /> Clear Draft
          </Button>
        )}
      </div>

      <h1 className="text-2xl font-bold text-slate-800">Import preview</h1>

      {!loaded ? (
        <Card>
          <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
        </Card>
      ) : !draft || !previewData ? (
        <Card>
          <EmptyState
            icon={<FileX size={24} />}
            title="No import draft yet"
            message="Go to Import a lesson, paste your content, then click Create Preview."
            action={
              <Link
                to="/lesson-import"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                Go to Import
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <ImportPreviewCard data={previewData} />

          <Card className="space-y-3">
            <h3 className="font-semibold text-slate-800">Save as…</h3>
            <ImportSourceSelector
              value={saveType}
              onChange={setSaveType}
              prepositionType={prepositionType}
              onPrepositionChange={setPrepositionType}
            />
            {saveType === "daily" && draft.dayNumber == null && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                No day number set — add one on the edit page so it appears under
                Daily Lessons.
              </p>
            )}
            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={onFinalSave} disabled={saving}>
                <Save size={16} /> {saving ? "Saving…" : "Final Save"}
              </Button>
              <Link
                to="/lesson-import"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Back to Edit
              </Link>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
