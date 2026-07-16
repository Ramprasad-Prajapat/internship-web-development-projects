import { useEffect, useState } from "react";
import { Chrome, DownloadCloud, Inbox, Plus, RefreshCw, Trash2 } from "lucide-react";
import extensionImportService from "../services/extensionImportService";
import type { ExtensionInboxItem } from "../types/extension.types";
import type { PrepositionType } from "../types/preposition.types";
import ExtensionInboxCard from "../components/extension/ExtensionInboxCard";
import ExtensionImportForm from "../components/extension/ExtensionImportForm";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import { PREPOSITION_TYPES } from "../types/preposition.types";

export default function ExtensionInbox() {
  const [items, setItems] = useState<ExtensionInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Conversion state
  const [convertingItem, setConvertingItem] = useState<ExtensionInboxItem | null>(null);
  const [convertType, setConvertType] = useState<NonNullable<ExtensionInboxItem["convertedAs"]>>("DAILY_LESSON");
  
  // Convert Daily Lesson fields
  const [weekNum, setWeekNum] = useState(1);
  const [dayNum, setDayNum] = useState(1);
  
  // Convert Preposition fields
  const [prepType, setPrepType] = useState<PrepositionType>("in");
  
  // Convert Vocabulary fields
  const [vocabWord, setVocabWord] = useState("");
  const [vocabMeaning, setVocabMeaning] = useState("");
  const [vocabHindi, setVocabHindi] = useState("");
  const [vocabExample, setVocabExample] = useState("");
  
  // Convert Grammar / General tags
  const [tagsInput, setTagsInput] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await extensionImportService.listItems();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const triggerToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  const handleAddManualItem = async (data: {
    title: string;
    sourceUrl?: string;
    rawContent: string;
    sourceType: string;
  }) => {
    await extensionImportService.addItem(data);
    setShowAddForm(false);
    triggerToast("Item added successfully! 🎉");
    refresh();
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this extension content?")) return;
    await extensionImportService.deleteItem(id);
    triggerToast("Extension item deleted.");
    refresh();
  };

  const handleClearConverted = async () => {
    if (!window.confirm("Clear all converted items from inbox? This will not delete the converted lessons/words.")) return;
    await extensionImportService.clearCompleted();
    triggerToast("Cleared converted items.");
    refresh();
  };

  const openConversionModal = (item: ExtensionInboxItem) => {
    setConvertingItem(item);
    setConvertType("DAILY_LESSON");
    setWeekNum(1);
    setDayNum(1);
    setPrepType("in");
    setVocabWord(item.title.split(":").pop()?.trim() || item.title);
    setVocabMeaning("");
    setVocabHindi("");
    setVocabExample(item.rawContent.slice(0, 200));
    setTagsInput("");
  };

  const handleSaveConversion = async () => {
    if (!convertingItem) return;
    try {
      const details: any = {};
      if (convertType === "DAILY_LESSON") {
        details.weekNumber = weekNum;
        details.dayNumber = dayNum;
        details.tags = ["daily-lesson", "extension"];
      } else if (convertType === "PREPOSITION") {
        details.prepositionType = prepType;
      } else if (convertType === "VOCABULARY") {
        if (!vocabWord.trim()) {
          alert("Word is required for vocabulary note");
          return;
        }
        details.word = vocabWord.trim();
        details.meaning = vocabMeaning.trim();
        details.hindiMeaning = vocabHindi.trim();
        details.example = vocabExample.trim();
      } else if (convertType === "GRAMMAR" || convertType === "GENERAL" || convertType === "AI_NOTEBOOK") {
        details.tags = tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }

      await extensionImportService.convertItem(convertingItem.id, convertType, details);
      setConvertingItem(null);
      triggerToast(`Successfully converted to ${convertType.replace("_", " ")}! 🚀`);
      refresh();
    } catch (e: any) {
      alert(e.message || "Conversion failed.");
    }
  };

  const totalConverted = items.filter((i) => i.convertedStatus === "CONVERTED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Extension Inbox</h1>
          <p className="mt-1 text-slate-500">
            Web articles, YouTube transcripts or vocabulary clipped via browser extension.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {totalConverted > 0 && (
            <Button size="sm" variant="ghost" onClick={handleClearConverted}>
              <Trash2 size={15} /> Clear Converted
            </Button>
          )}
          <Button size="sm" className="inline-flex items-center gap-1" onClick={() => setShowAddForm(true)}>
            <Plus size={15} /> Add Mock Content
          </Button>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm border border-emerald-100"
        >
          {toast}
        </div>
      )}

      {/* Integration Info Banner */}
      <Card className="border border-indigo-100 bg-indigo-50/40">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <Chrome size={20} />
          </span>
          <div>
            <h4 className="font-semibold text-slate-800">Waiting for browser extension integration</h4>
            <p className="mt-0.5 text-sm text-slate-600 leading-relaxed">
              When the browser extension is active, clicking "Send to Inbox" on any website or paragraph will automatically push it here. For now, you can manually simulate imports below!
            </p>
          </div>
        </div>
      </Card>

      {/* Manual Import Form */}
      {showAddForm && (
        <div className="animate-fadeIn">
          <ExtensionImportForm
            onAdd={handleAddManualItem}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Inbox Items List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox size={28} className="text-slate-400" />}
            title="Inbox is empty"
            message="No clips or articles received. Add mock content to simulate browser extension imports."
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <ExtensionInboxCard
              key={item.id}
              item={item}
              onDelete={handleDeleteItem}
              onConvertClick={openConversionModal}
            />
          ))}
        </div>
      )}

      {/* Conversion Modal Wizard */}
      {convertingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Convert Content</h3>
            <p className="text-sm text-slate-500 mb-4 truncate">
              Converting: <span className="font-medium text-slate-700">{convertingItem.title}</span>
            </p>

            <div className="space-y-4">
              {/* Target Format Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Convert Into
                </label>
                <select
                  value={convertType}
                  onChange={(e) => setConvertType(e.target.value as any)}
                  className="input-base w-full bg-white"
                >
                  <option value="DAILY_LESSON">Daily Lesson</option>
                  <option value="PREPOSITION">Preposition Note</option>
                  <option value="VOCABULARY">Vocabulary Word</option>
                  <option value="GRAMMAR">Grammar Note (Lesson)</option>
                  <option value="GENERAL">General Lesson</option>
                  <option value="AI_NOTEBOOK">AI Notebook Note</option>
                </select>
              </div>

              {/* Conditional Fields based on Target Type */}
              {convertType === "DAILY_LESSON" && (
                <div className="grid gap-3 sm:grid-cols-2 rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Week Number
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={weekNum}
                      onChange={(e) => setWeekNum(Math.max(1, Number(e.target.value)))}
                      className="input-base w-full bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Day Number
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={dayNum}
                      onChange={(e) => setDayNum(Math.max(1, Number(e.target.value)))}
                      className="input-base w-full bg-white"
                    />
                  </div>
                </div>
              )}

              {convertType === "PREPOSITION" && (
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Select Preposition Group
                  </label>
                  <select
                    value={prepType}
                    onChange={(e) => setPrepType(e.target.value as PrepositionType)}
                    className="input-base w-full bg-white"
                  >
                    {PREPOSITION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {convertType === "VOCABULARY" && (
                <div className="space-y-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-0.5">
                      English Word
                    </label>
                    <input
                      value={vocabWord}
                      onChange={(e) => setVocabWord(e.target.value)}
                      className="input-base w-full bg-white"
                      placeholder="e.g. Schedule"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-0.5">
                      English Meaning
                    </label>
                    <input
                      value={vocabMeaning}
                      onChange={(e) => setVocabMeaning(e.target.value)}
                      className="input-base w-full bg-white"
                      placeholder="e.g. to plan something"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-0.5">
                      Hindi Meaning
                    </label>
                    <input
                      value={vocabHindi}
                      onChange={(e) => setVocabHindi(e.target.value)}
                      className="input-base w-full bg-white"
                      placeholder="e.g. dincharya banana"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-0.5">
                      Example Sentence
                    </label>
                    <textarea
                      value={vocabExample}
                      onChange={(e) => setVocabExample(e.target.value)}
                      rows={2}
                      className="input-base w-full bg-white"
                      placeholder="e.g. Let's schedule a meeting."
                    />
                  </div>
                </div>
              )}

              {(convertType === "GRAMMAR" || convertType === "GENERAL" || convertType === "AI_NOTEBOOK") && (
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tags (Comma-separated)
                  </label>
                  <input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="input-base w-full bg-white"
                    placeholder="e.g. simple-present, extension, office"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setConvertingItem(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveConversion}>
                Save Conversion
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
