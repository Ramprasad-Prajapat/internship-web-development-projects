import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import VocabularyCard from "../components/practice/VocabularyCard";
import learningService from "../services/mockLearningService";
import type { VocabularyWord } from "../types/learning.types";

const emptyForm = { word: "", meaning: "", hindiMeaning: "", example: "" };

export default function Vocabulary() {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    learningService.listVocab().then(setWords);
  }, []);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.word.trim() || !form.meaning.trim()) return;
    await learningService.addVocab(form);
    setWords(await learningService.listVocab());
    setForm(emptyForm);
    setShowForm(false);
  };

  const onLearned = async (id: string) =>
    setWords(await learningService.setVocabStatus(id, "learned"));
  const onWeak = async (id: string) =>
    setWords(await learningService.setVocabStatus(id, "weak"));
  const onDelete = async (id: string) =>
    setWords(await learningService.deleteVocab(id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vocabulary</h1>
          <p className="mt-1 text-slate-500">
            Save new words with meaning and an example sentence.
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus size={16} /> Add word
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={onAdd} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="input-base"
                placeholder="Word (e.g. improve)"
                value={form.word}
                onChange={(e) => setForm({ ...form, word: e.target.value })}
              />
              <input
                className="input-base"
                placeholder="English meaning"
                value={form.meaning}
                onChange={(e) => setForm({ ...form, meaning: e.target.value })}
              />
              <input
                className="input-base"
                placeholder="Hindi meaning (optional)"
                value={form.hindiMeaning}
                onChange={(e) =>
                  setForm({ ...form, hindiMeaning: e.target.value })
                }
              />
              <input
                className="input-base"
                placeholder="Example sentence (optional)"
                value={form.example}
                onChange={(e) => setForm({ ...form, example: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Save word</Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {words.length === 0 ? (
        <Card>
          <EmptyState
            title="No words yet"
            message="Add your first vocabulary word to start building your list."
            action={<Button onClick={() => setShowForm(true)}>Add word</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {words.map((w) => (
            <VocabularyCard
              key={w.id}
              word={w}
              onMarkLearned={onLearned}
              onMarkWeak={onWeak}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
