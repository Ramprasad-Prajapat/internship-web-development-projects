import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  BookOpen,
  Plus,
  Flame,
  Volume2,
  Mic,
  PenLine,
  CheckCircle2,
  Search,
  Filter,
  ArrowUpDown,
  BookMarked,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Trash2,
  ExternalLink,
  Edit3,
  Lightbulb,
} from "lucide-react";
import aiNotebookService from "../services/aiNotebookService";
import historyService from "../services/historyService";
import learnerInsightsService, { type SavedSentence } from "../services/learnerInsightsService";
import mistakeService from "../services/mistakeService";
import { notebookAiService } from "../services/notebookAiService";
import { writingAiService } from "../services/writingAiService";
import { speakingAiService } from "../services/speakingAiService";
import { NotebookItem } from "../types/aiNotebook.types";
import { HistoryEntry } from "../types/history.types";
import { Mistake } from "../types/mistake.types";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import NotebookEditor from "../components/notebook/NotebookEditor";

export default function AINotebook() {
  const [notes, setNotes] = useState<NotebookItem[]>([]);
  const [historyList, setHistoryList] = useState<HistoryEntry[]>([]);
  const [savedSentences, setSavedSentences] = useState<SavedSentence[]>([]);
  const [mistakesList, setMistakesList] = useState<Mistake[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title-az">("newest");

  // Selected item state (can be note, sentence, or mistake)
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    type: "note" | "sentence" | "mistake";
    payload: any;
  } | null>(null);

  // Edit / Create Note trigger states
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  // Practice States
  const [practiceTab, setPracticeTab] = useState<"writing" | "speaking" | "vocab">("writing");
  const [workspaceTab, setWorkspaceTab] = useState<"summary" | "detector" | "vocab" | "questions" | "review">("summary");
  const [practiceWritingInput, setPracticeWritingInput] = useState("");
  const [writingResult, setWritingResult] = useState<{
    score: number;
    betterSentence: string;
    hints: string[];
    submitted: boolean;
    isRealAI?: boolean;
  } | null>(null);

  const [practiceSpeakingInput, setPracticeSpeakingInput] = useState("");
  const [speakingResult, setSpeakingResult] = useState<{
    score: number;
    missing: string[];
    extra: string[];
    repeated: string[];
    grammarMistakes?: string[];
    pronunciationHints?: string[];
    betterAnswer?: string;
    correctedAnswer?: string;
    submitted: boolean;
    isRealAI?: boolean;
  } | null>(null);

  const [aiSummary, setAiSummary] = useState<string[]>([]);
  const [aiVocabulary, setAiVocabulary] = useState<any[]>([]);
  const [aiQuestions, setAiQuestions] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isRealAIWorkspace, setIsRealAIWorkspace] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Load all user collections
  const loadData = async (selectFirst = false) => {
    try {
      const [notesList, hist, sents, mistakes, ins] = await Promise.all([
        aiNotebookService.listNotes(),
        historyService.list(),
        learnerInsightsService.getSavedSentences(),
        mistakeService.getMistakes(),
        learnerInsightsService.getInsights(),
      ]);
      setNotes(notesList);
      setHistoryList(hist);
      setSavedSentences(sents);
      setMistakesList(mistakes);
      setInsights(ins);

      // Auto select first item if requested and empty
      if (selectFirst && !selectedItem) {
        if (notesList.length > 0) {
          setSelectedItem({ id: `note-${notesList[0].id}`, type: "note", payload: notesList[0] });
        } else if (sents.length > 0) {
          setSelectedItem({ id: `sent-${sents[0].id}`, type: "sentence", payload: sents[0] });
        } else if (mistakes.length > 0) {
          setSelectedItem({ id: `mistake-${mistakes[0].id}`, type: "mistake", payload: mistakes[0] });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  useEffect(() => {
    if (selectedItem && selectedItem.type === "note") {
      const fetchAiWorkspaceData = async () => {
        setIsAiLoading(true);
        try {
          const noteContent = selectedItem.payload.originalContent || "";
          const [summaryRes, vocabRes, questionsRes] = await Promise.all([
            notebookAiService.summarizeNote(noteContent),
            notebookAiService.extractVocabulary(noteContent),
            notebookAiService.generateNotebookQuestions(noteContent)
          ]);
          setAiSummary(summaryRes.summary);
          setAiVocabulary(vocabRes.vocabulary);
          setAiQuestions(questionsRes.questions);
          setIsRealAIWorkspace(summaryRes.isRealAI || vocabRes.isRealAI || questionsRes.isRealAI);
        } catch (e) {
          console.error("AI Notebook workspace fetch failed", e);
        } finally {
          setIsAiLoading(false);
        }
      };
      fetchAiWorkspaceData();
    }
  }, [selectedItem]);

  // Map different collections into a single unified list
  const unifiedItems = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      sourceType: string;
      originalContent: string;
      note?: string;
      tags: string[];
      createdAt: string;
      reviewedAt?: string;
      routePath?: string;
      type: "note" | "sentence" | "mistake";
      payload: any;
    }> = [];

    // Add Notes
    notes.forEach((n) => {
      list.push({
        id: `note-${n.id}`,
        title: n.title,
        sourceType: n.sourceType,
        originalContent: n.originalContent,
        note: n.note,
        tags: n.tags || [],
        createdAt: n.createdAt,
        reviewedAt: n.reviewedAt,
        routePath: n.sourceType === "User Import" ? "/personal-import" : undefined,
        type: "note",
        payload: n,
      });
    });

    // Add Saved Sentences
    savedSentences.forEach((s) => {
      list.push({
        id: `sent-${s.id}`,
        title: s.source ? `Saved Sentence: ${s.source}` : "Saved Sentence",
        sourceType: "Saved Sentence",
        originalContent: s.sentence,
        note: s.meaning,
        tags: ["sentence", "vocabulary"],
        createdAt: s.createdAt || new Date().toISOString(),
        reviewedAt: s.reviewedAt,
        routePath: s.routePath,
        type: "sentence",
        payload: s,
      });
    });

    // Add Mistakes/Corrections
    mistakesList.forEach((m) => {
      list.push({
        id: `mistake-${m.id}`,
        title: m.sourceTitle ? `Correction: ${m.sourceTitle}` : "Correction",
        sourceType: "Correction",
        originalContent: m.wrongSentence,
        note: m.correctSentence,
        tags: [m.mistakeType || "grammar"],
        createdAt: m.createdAt,
        reviewedAt: m.reviewedAt,
        routePath:
          m.sourceType === "DAILY_LESSON"
            ? `/daily-lessons`
            : m.sourceType === "USER_IMPORT"
              ? `/personal-import`
              : undefined,
        type: "mistake",
        payload: m,
      });
    });

    return list;
  }, [notes, savedSentences, mistakesList]);

  // Search, filter, and sort computed items
  const filteredAndSortedItems = useMemo(() => {
    let result = unifiedItems;

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.originalContent.toLowerCase().includes(q) ||
          (item.note && item.note.toLowerCase().includes(q))
      );
    }

    // Apply Type Filter
    if (selectedType !== "All") {
      result = result.filter((item) => {
        switch (selectedType) {
          case "Daily Lesson":
            return item.sourceType === "Daily Lesson" || item.sourceType === "Preposition";
          case "User Import":
            return item.sourceType === "User Import";
          case "Saved Sentence":
            return item.type === "sentence";
          case "Writing":
            return item.sourceType === "Writing" || item.tags.includes("writing");
          case "Speaking":
            return item.sourceType === "Speaking" || item.tags.includes("speaking");
          case "Correction":
            return item.type === "mistake";
          case "Mock AI Tip":
            return (
              item.sourceType === "Grammar" ||
              item.tags.includes("tip") ||
              item.tags.includes("mock-ai-tip") ||
              item.tags.includes("coach-tip")
            );
          default:
            return true;
        }
      });
    }

    // Apply Sort order
    result = [...result].sort((a, b) => {
      if (sortBy === "newest") {
        return b.createdAt.localeCompare(a.createdAt);
      }
      if (sortBy === "oldest") {
        return a.createdAt.localeCompare(b.createdAt);
      }
      if (sortBy === "title-az") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [unifiedItems, searchQuery, selectedType, sortBy]);

  // Generate dynamic, rule-based mock AI review suggestions
  const smartReviewSuggestions = useMemo(() => {
    const suggestions: string[] = [];

    if (savedSentences.length > 0) {
      suggestions.push(`Review ${Math.min(3, savedSentences.length)} saved sentences today.`);
      suggestions.push(`Speak the saved sentence "${savedSentences[0].sentence.slice(0, 32)}..." 5 times.`);
    } else {
      suggestions.push("Save 3 new sentences from daily lessons to build your study queue.");
    }

    const grammarMistakes = mistakesList.filter((m) => m.mistakeType === "grammar");
    if (grammarMistakes.length > 0) {
      suggestions.push(`Practice your last writing correction: "${grammarMistakes[0].wrongSentence.slice(0, 32)}...".`);
    } else {
      suggestions.push("Complete a Writing exercise to check spelling and sentence structure.");
    }

    const hasImports = notes.some((n) => n.sourceType === "User Import");
    if (!hasImports) {
      suggestions.push("Import a custom English paragraph and practice it in the Personal Workspace.");
    } else {
      suggestions.push("Review your last imported custom text and perform a speaking pronunciation check.");
    }

    const dailyLessonNotes = notes.filter((n) => n.sourceType === "Daily Lesson");
    if (dailyLessonNotes.length > 0) {
      suggestions.push(`Revise grammar notes: "${dailyLessonNotes[0].title}".`);
    }

    return suggestions;
  }, [notes, savedSentences, mistakesList]);

  // Handlers for selection
  const handleSelectItem = (id: string, type: "note" | "sentence" | "mistake", payload: any) => {
    setSelectedItem({ id, type, payload });
    setIsEditingNote(false);
    setIsCreatingNote(false);
    setWritingResult(null);
    setPracticeWritingInput("");
    setSpeakingResult(null);
    setPracticeSpeakingInput("");
  };

  // Mark Reviewed Handler
  const handleMarkReviewed = async () => {
    if (!selectedItem) return;
    const nowStr = new Date().toISOString();

    try {
      if (selectedItem.type === "note") {
        const updated = await aiNotebookService.updateNote(selectedItem.payload.id, {
          reviewedAt: nowStr,
        });
        setSelectedItem({
          ...selectedItem,
          payload: updated,
        });
        setNotes(notes.map((n) => (n.id === updated.id ? updated : n)));
        await historyService.addEntry({
          type: "NOTEBOOK_ITEM_UPDATED" as any,
          title: "Reviewed Notebook Item",
          description: `Marked "${updated.title}" as reviewed.`,
          sourceType: "AI_NOTEBOOK" as any,
          sourceId: updated.id,
        });
      } else if (selectedItem.type === "sentence") {
        const nextSents = learnerInsightsService.updateSavedSentence(selectedItem.payload.id, {
          reviewedAt: nowStr,
        });
        setSavedSentences(nextSents);
        const updatedPayload = nextSents.find((s) => s.id === selectedItem.payload.id);
        setSelectedItem({
          ...selectedItem,
          payload: updatedPayload,
        });
        await historyService.addEntry({
          type: "NOTEBOOK_ITEM_UPDATED" as any,
          title: "Reviewed Saved Sentence",
          description: `Marked sentence "${updatedPayload?.sentence.slice(0, 20)}..." as reviewed.`,
          sourceType: "AI_NOTEBOOK" as any,
          sourceId: selectedItem.payload.id,
        });
      } else if (selectedItem.type === "mistake") {
        await mistakeService.markMistakeReviewed(selectedItem.payload.id);
        const updatedMistakes = await mistakeService.getMistakes();
        setMistakesList(updatedMistakes);
        const updatedPayload = updatedMistakes.find((m) => m.id === selectedItem.payload.id);
        setSelectedItem({
          ...selectedItem,
          payload: updatedPayload,
        });
        await historyService.addEntry({
          type: "NOTEBOOK_ITEM_UPDATED" as any,
          title: "Reviewed Correction",
          description: `Marked grammar correction in "${updatedPayload?.sourceTitle}" as reviewed.`,
          sourceType: "AI_NOTEBOOK" as any,
          sourceId: selectedItem.payload.id,
        });
      }
      alert("Item successfully marked as reviewed!");
    } catch (e) {
      console.error(e);
    }
  };

  // Delete/Remove Handlers
  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    if (!window.confirm("Are you sure you want to remove this item from your library?")) return;

    try {
      if (selectedItem.type === "note") {
        await aiNotebookService.deleteNote(selectedItem.payload.id);
        setNotes(notes.filter((n) => n.id !== selectedItem.payload.id));
      } else if (selectedItem.type === "sentence") {
        const updated = learnerInsightsService.removeSavedSentence(selectedItem.payload.id);
        setSavedSentences(updated);
      } else if (selectedItem.type === "mistake") {
        await mistakeService.deleteMistake(selectedItem.payload.id);
        setMistakesList(mistakesList.filter((m) => m.id !== selectedItem.payload.id));
      }
      setSelectedItem(null);
      loadData(true);
      alert("Item successfully removed!");
    } catch (e) {
      console.error(e);
    }
  };

  // Note editor callbacks
  const handleNoteCreated = (newNote: NotebookItem) => {
    setNotes([newNote, ...notes]);
    setSelectedItem({ id: `note-${newNote.id}`, type: "note", payload: newNote });
    setIsCreatingNote(false);
    loadData();
  };

  const handleNoteUpdated = (updated: NotebookItem) => {
    setNotes(notes.map((n) => (n.id === updated.id ? updated : n)));
    setSelectedItem({ id: `note-${updated.id}`, type: "note", payload: updated });
    setIsEditingNote(false);
    loadData();
  };

  const handleNoteDeleted = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
    setSelectedItem(null);
    loadData(true);
  };

  // Start Speech Recognition
  const handleStartSpeechRecognition = () => {
    const rec = speakingAiService.getSpeechRecognitionInstance();
    if (!rec) return;
    setIsRecording(true);
    setPracticeSpeakingInput("");
    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setPracticeSpeakingInput(text);
    };
    rec.onend = () => {
      setIsRecording(false);
    };
    rec.onerror = (e: any) => {
      console.error("Speech Recognition Error", e);
      setIsRecording(false);
    };
    rec.start();
  };

  // Real-ready AI Writing Practice Logic
  const handleCheckWriting = async () => {
    if (!practiceWritingInput.trim() || !selectedItem) return;
    setIsAiLoading(true);
    try {
      const promptTitle = selectedItem.payload.title || "Sentence Practice";
      const res = await writingAiService.checkWriting(practiceWritingInput, `Notebook Practice: ${promptTitle}`);
      setWritingResult({
        score: res.score,
        betterSentence: res.correctedSentence,
        hints: res.hints,
        submitted: true,
        isRealAI: res.isRealAI
      });
      loadData();

      // Log history
      await historyService.addEntry({
        type: "NOTEBOOK_WRITING_CHECKED" as any,
        title: "AI Writing Check",
        description: `Completed writing practice. Score: ${res.score}% on "${promptTitle}".`,
        sourceType: "AI_NOTEBOOK" as any,
        sourceId: selectedItem.payload.id || selectedItem.payload.sentence,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Real-ready AI Speaking Practice Logic
  const handleCheckSpeaking = async () => {
    if (!practiceSpeakingInput.trim() || !selectedItem) return;
    setIsAiLoading(true);
    try {
      const sourceText = selectedItem.payload.originalContent || selectedItem.payload.sentence || "";
      const res = await speakingAiService.analyzeSpeaking(
        null,
        practiceSpeakingInput,
        sourceText,
        { title: selectedItem.payload.title }
      );
      setSpeakingResult({
        score: res.fluencyScore,
        missing: res.wordsToRepeat,
        extra: [],
        repeated: [],
        grammarMistakes: res.grammarMistakes,
        pronunciationHints: res.pronunciationHints,
        betterAnswer: res.betterAnswer,
        correctedAnswer: res.correctedAnswer,
        submitted: true,
        isRealAI: res.isRealAI
      });

      // Log history
      await historyService.addEntry({
        type: "NOTEBOOK_SPEAKING_PRACTICED" as any,
        title: "AI Speaking Practice",
        description: `Pronounced speaking check. Accuracy: ${res.fluencyScore}% on "${selectedItem.payload.title || "Sentence"}".`,
        sourceType: "AI_NOTEBOOK" as any,
        sourceId: selectedItem.payload.id || selectedItem.payload.sentence,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Helper colors for types
  const getTypeBadgeTone = (type: string) => {
    switch (type) {
      case "Daily Lesson":
      case "Preposition":
        return "indigo";
      case "User Import":
        return "amber";
      case "Saved Sentence":
        return "emerald";
      case "Correction":
        return "rose";
      case "Writing":
        return "sky";
      case "Speaking":
        return "violet";
      default:
        return "slate";
    }
  };

  // Counts bound directly to the unified insights service
  const savedNotesCount = insights?.notebookNotesCount ?? notes.length;
  const savedSentencesCount = insights?.savedSentencesCount ?? savedSentences.length;
  const writingChecksCount = insights?.writingChecksCount ?? historyList.filter((h) => h.type === "NOTEBOOK_WRITING_CHECKED" || String(h.type).includes("WRITING")).length;
  const speakingAttemptsCount = insights?.speakingChecksCount ?? historyList.filter((h) => h.type === "NOTEBOOK_SPEAKING_PRACTICED" || String(h.type).includes("SPEAKING")).length;
  const mistakesCount = insights?.mistakesCount ?? mistakesList.length;
  const userImportsCount = insights?.userImportsCount ?? notes.filter((n) => n.sourceType === "User Import").length;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <Link
            to="/modules"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 bg-white hover:bg-indigo-50/30 px-2.5 py-1 rounded-lg transition-colors shadow-sm/30 mb-2"
          >
            ← Back to Modules
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
              AI Notebook
            </h1>
            <Badge tone="indigo" className="text-[10px] font-bold uppercase">
              Personal Notebook
            </Badge>
            <Badge tone="amber" className="text-[10px] font-bold uppercase">
              Frontend Preview
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Review your saved notes, sentences, writing, speaking, and practice content.
          </p>
        </div>

        <div className="flex items-center bg-indigo-50 border border-indigo-100/60 rounded-xl px-3 py-1.5 text-[10px] font-extrabold text-indigo-700 uppercase tracking-wide gap-1.5">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
          Mock AI revision ready
        </div>
      </div>

      {/* 2. Top Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="p-3 border border-slate-100 bg-white shadow-sm text-center">
          <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Total Notes</span>
          <span className="text-base font-extrabold text-slate-700 block mt-1">{savedNotesCount} Notes</span>
        </Card>
        <Card className="p-3 border border-slate-100 bg-white shadow-sm text-center">
          <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Saved Sentences</span>
          <span className="text-base font-extrabold text-slate-700 block mt-1">{savedSentencesCount} Sentences</span>
        </Card>
        <Card className="p-3 border border-slate-100 bg-white shadow-sm text-center">
          <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Writing Checks</span>
          <span className="text-base font-extrabold text-slate-700 block mt-1">{writingChecksCount} attempts</span>
        </Card>
        <Card className="p-3 border border-slate-100 bg-white shadow-sm text-center">
          <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Speaking Checks</span>
          <span className="text-base font-extrabold text-slate-700 block mt-1">{speakingAttemptsCount} attempts</span>
        </Card>
        <Card className="p-3 border border-slate-100 bg-white shadow-sm text-center">
          <span className="text-[8.5px] font-bold text-rose-400 uppercase tracking-wider block">Corrections Saved</span>
          <span className="text-base font-extrabold text-rose-500 block mt-1">{mistakesCount} Saved</span>
        </Card>
        <Card className="p-3 border border-slate-100 bg-white shadow-sm text-center">
          <span className="text-[8.5px] font-bold text-amber-500 uppercase tracking-wider block">User Imports</span>
          <span className="text-base font-extrabold text-amber-600 block mt-1">{userImportsCount} Texts</span>
        </Card>
      </div>

      {/* 3. Smart Review Suggestion Box */}
      <Card className="p-4 border border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-indigo-50/20 to-transparent shadow-sm rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase text-indigo-700 flex items-center gap-1.5 tracking-wider">
              <Lightbulb size={14} className="text-indigo-600" /> Smart Review Suggestions
            </h3>
            <div className="space-y-1 mt-2">
              {smartReviewSuggestions.map((s, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600 font-semibold leading-relaxed">
                  <span className="text-indigo-500 mt-0.5">•</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0 self-start md:self-center">
            <Link to="/practice-center">
              <Button
                size="sm"
                className="text-[10px] font-black h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Go to Practice Center
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedType("Saved Sentence")}
              className="text-[10px] font-black h-8 border-indigo-100 text-indigo-700 bg-white"
            >
              Review Saved Sentences
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedType("Correction")}
              className="text-[10px] font-black h-8 border-indigo-100 text-indigo-700 bg-white"
            >
              Review Corrections
            </Button>
            <Link to="/mistakes">
              <Button
                size="sm"
                variant="outline"
                className="text-[10px] font-black h-8 border-rose-100 text-rose-700 hover:bg-rose-50 bg-white"
              >
                Open Mistakes
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="py-20 text-center text-xs font-semibold text-slate-400">
          Loading library data...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* LEFT COLUMN: Library List & Search & Filters */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <BookMarked size={14} className="text-indigo-600" /> Unified Learning Library
              </h3>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedItem(null);
                  setIsCreatingNote(true);
                  setIsEditingNote(false);
                }}
                className="text-[10px] font-extrabold h-7 inline-flex items-center gap-1"
              >
                <Plus size={11} /> Create Note
              </Button>
            </div>

            {/* Filters and Search Bar Container */}
            <Card className="p-3.5 border border-slate-100 bg-white shadow-sm space-y-3">
              {/* Search bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search title, content, or rule..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none transition-colors"
                />
              </div>

              {/* Type Filters bar */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Filter size={10} /> Filter Type
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    "All",
                    "Daily Lesson",
                    "User Import",
                    "Saved Sentence",
                    "Writing",
                    "Speaking",
                    "Correction",
                    "Mock AI Tip",
                  ].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedType(filter)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition-colors ${selectedType === filter
                        ? "bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-sm"
                        : "bg-white border-slate-150 text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting options */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-[10px] text-slate-400 font-bold">
                <span className="flex items-center gap-1">
                  <ArrowUpDown size={11} /> Sort by
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-slate-600 outline-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title-az">Title (A-Z)</option>
                </select>
              </div>
            </Card>

            {/* Unified Cards list */}
            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {filteredAndSortedItems.length === 0 ? (
                <div className="py-12 px-4 text-center text-xs font-semibold text-slate-400 bg-slate-50 rounded-2xl border border-slate-200/40 space-y-3">
                  <p>No learning items matched search or filter.</p>
                  {unifiedItems.length === 0 && (
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <p className="text-[11px] text-slate-400">Your Personal Notebook is currently empty. Get started by studying the English Course or importing custom text.</p>
                      <div className="flex gap-2">
                        <Link to="/modules/english-course">
                          <Button size="sm" className="text-[10px] font-bold py-1 px-3">Open English Course</Button>
                        </Link>
                        <Link to="/personal-import">
                          <Button size="sm" variant="outline" className="text-[10px] font-bold py-1 px-3 border-slate-200 text-slate-600 bg-white">Import Text</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                filteredAndSortedItems.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  const cleanContent =
                    item.originalContent.slice(0, 90) + (item.originalContent.length > 90 ? "..." : "");

                  return (
                    <Card
                      key={item.id}
                      onClick={() => handleSelectItem(item.id, item.type, item.payload)}
                      className={`p-3.5 border cursor-pointer text-left transition-all duration-200 ${isSelected
                        ? "border-indigo-600 bg-indigo-50/15 shadow-sm"
                        : "border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm"
                        }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-extrabold text-slate-800 text-xs line-clamp-1 leading-snug">
                          {item.title}
                        </h4>
                        <Badge
                          tone={getTypeBadgeTone(item.sourceType)}
                          className="text-[8px] font-extrabold py-0.5 px-1.5 shrink-0 uppercase tracking-wider"
                        >
                          {item.sourceType}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-slate-500 font-medium mt-1 line-clamp-2 leading-relaxed italic">
                        "{cleanContent}"
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-50 pt-2 text-[9px] font-semibold text-slate-400">
                        <span className="flex items-center gap-1">
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                          {item.reviewedAt && (
                            <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                              ✓ Reviewed
                            </span>
                          )}
                        </span>

                        <div className="flex gap-1">
                          {item.tags.slice(0, 2).map((t) => (
                            <span key={t} className="bg-slate-100 px-1 py-0.5 rounded text-[8px] uppercase">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Selected Item Workspace / Editor / Practice */}
          <div className="lg:col-span-7">
            {isCreatingNote ? (
              <NotebookEditor
                selectedNote={null}
                onNoteCreated={handleNoteCreated}
                onNoteUpdated={handleNoteUpdated}
                onNoteDeleted={handleNoteDeleted}
              />
            ) : isEditingNote && selectedItem?.type === "note" ? (
              <NotebookEditor
                selectedNote={selectedItem.payload}
                onNoteCreated={handleNoteCreated}
                onNoteUpdated={handleNoteUpdated}
                onNoteDeleted={handleNoteDeleted}
              />
            ) : selectedItem ? (
              <div className="space-y-4">
                {/* Note Details View */}
                <Card className="p-5 border border-slate-100 bg-white shadow-sm space-y-4">
                  <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          tone={getTypeBadgeTone(selectedItem.payload.sourceType || selectedItem.payload.source)}
                          className="text-[8px] font-black uppercase"
                        >
                          {selectedItem.payload.sourceType || selectedItem.payload.source || selectedItem.type}
                        </Badge>
                        {selectedItem.payload.reviewedAt && (
                          <Badge tone="emerald" className="text-[8px] font-black uppercase">
                            Reviewed
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-extrabold text-slate-800 text-base mt-1.5 tracking-tight">
                        {selectedItem.type === "note"
                          ? selectedItem.payload.title
                          : selectedItem.type === "sentence"
                            ? `Saved Sentence from ${selectedItem.payload.source}`
                            : `Mistake Correction: ${selectedItem.payload.sourceTitle}`}
                      </h3>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleMarkReviewed}
                        className="text-[9px] font-black h-8 px-2.5 inline-flex items-center gap-1 border-indigo-100 text-indigo-700"
                        title="Mark as reviewed today"
                      >
                        <CheckCircle size={13} /> Reviewed
                      </Button>

                      {selectedItem.type === "note" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingNote(true)}
                          className="p-2 h-8 w-8 inline-flex items-center justify-center"
                          title="Edit note properties"
                        >
                          <Edit3 size={13} />
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDeleteItem}
                        className="p-2 h-8 w-8 inline-flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:border-rose-100"
                        title="Remove item"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        Saved Target Content
                      </span>
                      <div className="mt-1 text-xs font-semibold text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/40 whitespace-pre-wrap">
                        "{selectedItem.payload.originalContent || selectedItem.payload.sentence || selectedItem.payload.wrongSentence}"
                      </div>
                    </div>

                    {/* Explanatory Meaning or corrected mistake */}
                    {(selectedItem.payload.note || selectedItem.payload.meaning || selectedItem.payload.correctSentence) && (
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                          {selectedItem.type === "mistake" ? "Corrected Sentence" : "Notes / Meaning"}
                        </span>
                        <div className="mt-1 text-xs font-bold text-indigo-700 leading-relaxed bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/10">
                          {selectedItem.payload.note || selectedItem.payload.meaning || selectedItem.payload.correctSentence}
                        </div>
                      </div>
                    )}

                    {selectedItem.payload.simpleRule && (
                      <div className="p-2.5 bg-amber-50/60 border border-amber-100 rounded-xl text-[10px] text-amber-800 font-semibold leading-relaxed">
                        💡 <b>Grammar Rule:</b> {selectedItem.payload.simpleRule}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-400 font-bold pt-3 border-t border-slate-55 mt-4">
                    <span>
                      Added: {new Date(selectedItem.payload.createdAt).toLocaleDateString()}
                      {selectedItem.payload.reviewedAt && (
                        <span className="text-slate-400 ml-2">
                          · Reviewed: {new Date(selectedItem.payload.reviewedAt).toLocaleDateString()}
                        </span>
                      )}
                    </span>

                    {selectedItem.payload.routePath && (
                      <Link
                        to={selectedItem.payload.routePath}
                        className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink size={10} /> Open Original Lesson
                      </Link>
                    )}
                  </div>
                </Card>

                {/* Mock AI Learning Workspace */}
                {selectedItem && selectedItem.type === "note" && (
                  <Card className="border border-purple-100 bg-purple-50/5 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-purple-100/40 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={16} className="text-purple-600 animate-pulse" />
                        <h4 className="font-extrabold text-slate-800 tracking-tight text-xs">
                          Mock AI Learning Workspace
                        </h4>
                      </div>
                      <Badge tone={isRealAIWorkspace ? "emerald" : "violet"} className="text-[8px] font-black uppercase">
                        {isRealAIWorkspace ? "Real AI Mode" : "Mock AI Fallback"}
                      </Badge>
                    </div>

                    {/* Tab Headers */}
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                      <button
                        onClick={() => setWorkspaceTab("summary")}
                        className={`px-3 py-1 rounded-lg border transition-all ${workspaceTab === "summary" ? "bg-purple-600 border-purple-600 text-white font-extrabold" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                      >
                        3-Bullet Summary
                      </button>
                      <button
                        onClick={() => setWorkspaceTab("detector")}
                        className={`px-3 py-1 rounded-lg border transition-all ${workspaceTab === "detector" ? "bg-purple-600 border-purple-600 text-white font-extrabold" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                      >
                        Sentence Detector
                      </button>
                      <button
                        onClick={() => setWorkspaceTab("vocab")}
                        className={`px-3 py-1 rounded-lg border transition-all ${workspaceTab === "vocab" ? "bg-purple-600 border-purple-600 text-white font-extrabold" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                      >
                        Vocab Extractor
                      </button>
                      <button
                        onClick={() => setWorkspaceTab("questions")}
                        className={`px-3 py-1 rounded-lg border transition-all ${workspaceTab === "questions" ? "bg-purple-600 border-purple-600 text-white font-extrabold" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                      >
                        Questions
                      </button>
                      <button
                        onClick={() => setWorkspaceTab("review")}
                        className={`px-3 py-1 rounded-lg border transition-all ${workspaceTab === "review" ? "bg-purple-600 border-purple-600 text-white font-extrabold" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                      >
                        Smart Review
                      </button>
                    </div>

                    <div className="bg-white border border-purple-100/40 rounded-xl p-3.5 space-y-3 min-h-[100px]">
                      {isAiLoading ? (
                        <div className="py-6 text-center text-[10px] font-semibold text-slate-400">
                          Loading AI Workspace insights...
                        </div>
                      ) : (
                        <>
                          {/* 3-Bullet Summary */}
                          {workspaceTab === "summary" && (
                            <div className="space-y-2 text-xs font-semibold text-slate-600">
                              <span className="text-[9px] uppercase font-bold text-purple-600 tracking-wider block">AI 3-Bullet Summary</span>
                              <ul className="list-disc list-inside space-y-1">
                                {aiSummary.map((bullet, idx) => (
                                  <li key={idx}>{bullet}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Important Sentence Detector */}
                          {workspaceTab === "detector" && (
                            <div className="space-y-2 text-xs font-semibold text-slate-600">
                              <span className="text-[9px] uppercase font-bold text-purple-600 tracking-wider block">Detected Key Sentences</span>
                              {(() => {
                                const content = selectedItem.payload.originalContent || "";
                                const keySentences = content.split(/[.?!]/)
                                  .map((l: string) => l.trim())
                                  .filter((l: string) => {
                                    const lower = l.toLowerCase();
                                    return lower.includes("should") || lower.includes("must") || lower.includes("always") || lower.includes("rule") || lower.includes("have to");
                                  });

                                if (keySentences.length === 0) {
                                  return <p className="text-[10px] text-slate-400 italic">No key sentence containing 'should/must/always/rule' found in this note. Add one to see it here!</p>;
                                }

                                return (
                                  <div className="space-y-1">
                                    {keySentences.map((s: string, idx: number) => (
                                      <div key={idx} className="p-2 bg-indigo-50/20 border border-indigo-100/50 rounded-lg text-slate-700">
                                        💡 "{s}."
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* Vocabulary Extractor */}
                          {workspaceTab === "vocab" && (
                            <div className="space-y-2 text-xs font-semibold text-slate-600">
                              <span className="text-[9px] uppercase font-bold text-purple-600 tracking-wider block">Extracted Vocabulary Words</span>
                              {aiVocabulary.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic">No complex vocabulary terms extracted from this short content.</p>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-1.5">
                                    {aiVocabulary.map((v, idx) => (
                                      <span key={idx} className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-lg font-bold" title={v.meaning}>
                                        {v.word}
                                      </span>
                                    ))}
                                  </div>
                                  <div className="text-[10px] border-t border-slate-50 pt-2 space-y-1.5">
                                    {aiVocabulary.slice(0, 2).map((v, idx) => (
                                      <div key={idx}>
                                        <span className="font-extrabold text-slate-700">{v.word}</span>: <span className="text-slate-500 font-medium">{v.meaning}</span>
                                        {v.example && <div className="text-indigo-600 font-semibold italic mt-0.5">"{v.example}"</div>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Question Generator */}
                          {workspaceTab === "questions" && (
                            <div className="space-y-2 text-xs font-semibold text-slate-600">
                              <span className="text-[9px] uppercase font-bold text-purple-600 tracking-wider block">AI Generated Questions</span>
                              {aiQuestions.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic">No generated questions available.</p>
                              ) : (
                                <div className="space-y-2">
                                  {aiQuestions.map((q, idx) => (
                                    <div key={q.id || idx} className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                                      <span className="text-[8px] font-black text-indigo-500 uppercase block">Question {idx + 1} ({q.type})</span>
                                      <p className="font-extrabold text-slate-700 mt-0.5">{q.questionText}</p>
                                      <span className="text-[8px] text-emerald-600 font-bold block mt-1">Expected Answer: {q.expectedAnswer}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Smart Review */}
                          {workspaceTab === "review" && (
                            <div className="space-y-2 text-xs font-semibold text-slate-600">
                              <span className="text-[9px] uppercase font-bold text-purple-600 tracking-wider block">Spaced Repetition Schedule</span>
                              <p className="text-slate-600">
                                Spaced repetition recommended intervals:
                              </p>
                              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                                  <div>Review 1</div>
                                  <div className="font-black mt-1">Tomorrow</div>
                                </div>
                                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                                  <div>Review 2</div>
                                  <div className="font-black mt-1">In 3 Days</div>
                                </div>
                                <div className="p-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
                                  <div>Review 3</div>
                                  <div className="font-black mt-1">In 7 Days</div>
                                </div>
                              </div>

                              {/* Linked mistakes */}
                              {(() => {
                                const noteWords = (selectedItem.payload.title + " " + selectedItem.payload.originalContent).toLowerCase();
                                const linked = mistakesList.filter(m => {
                                  const wrong = (m.wrongSentence || "").toLowerCase();
                                  const correct = (m.correctSentence || "").toLowerCase();
                                  return wrong.split(" ").some(w => w.length > 4 && noteWords.includes(w)) ||
                                    correct.split(" ").some(w => w.length > 4 && noteWords.includes(w));
                                });

                                if (linked.length > 0) {
                                  return (
                                    <div className="mt-4 border-t border-purple-100/40 pt-3">
                                      <span className="text-[9px] uppercase font-bold text-indigo-600 tracking-wider block">Linked Personal Mistakes</span>
                                      <div className="space-y-1.5 mt-2">
                                        {linked.slice(0, 2).map((m: any) => (
                                          <div key={m.id} className="text-[10px] text-slate-600 bg-indigo-50/10 p-2 rounded-lg border border-indigo-100/40 flex items-center justify-between">
                                            <span className="truncate">"{m.wrongSentence}" → "{m.correctSentence}"</span>
                                            <Link to="/mistakes" className="text-indigo-600 font-extrabold text-[8px] uppercase whitespace-nowrap ml-2">Fix Again</Link>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </Card>
                )}

                {/* Mock AI Practice Panel */}
                <Card className="border border-slate-100 bg-white shadow-sm flex flex-col">
                  {/* Practice tab headers */}
                  <div className="p-3 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl flex items-center justify-between gap-3">
                    <h3 className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles size={13} className="text-indigo-600 animate-pulse" /> Mock AI Practice Hub
                    </h3>
                    <div className="flex gap-1 text-[10px] font-bold">
                      <button
                        onClick={() => setPracticeTab("writing")}
                        className={`px-3 py-1 rounded-lg transition-all ${practiceTab === "writing"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-500 hover:bg-slate-150"
                          }`}
                      >
                        Practice Writing
                      </button>
                      <button
                        onClick={() => setPracticeTab("speaking")}
                        className={`px-3 py-1 rounded-lg transition-all ${practiceTab === "speaking"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-500 hover:bg-slate-150"
                          }`}
                      >
                        Practice Speaking
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    {/* PRACTICE WRITING VIEW */}
                    {practiceTab === "writing" && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-800">Writing Draft Review</h4>
                          <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                            Rewrite the sentence or construct a response based on the note above to verify accuracy.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <textarea
                            rows={3}
                            className="w-full p-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none focus:bg-white transition-all leading-relaxed"
                            value={practiceWritingInput}
                            onChange={(e) => setPracticeWritingInput(e.target.value)}
                            placeholder="Type the target English sentence or write your review answer..."
                          />
                        </div>

                        <Button
                          onClick={handleCheckWriting}
                          disabled={!practiceWritingInput.trim()}
                          className="w-full text-xs font-black h-9"
                        >
                          Verify Writing & Grammar
                        </Button>

                        {writingResult && (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-fade-in">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                              <span>Match Score</span>
                              <div className="flex items-center gap-1.5">
                                {writingResult.isRealAI !== undefined && (
                                  <Badge tone={writingResult.isRealAI ? "emerald" : "violet"} className="text-[7px] font-black uppercase">
                                    {writingResult.isRealAI ? "Real AI" : "Mock AI"}
                                  </Badge>
                                )}
                                <span className={writingResult.score >= 85 ? "text-emerald-600" : "text-amber-600"}>
                                  {writingResult.score}%
                                </span>
                              </div>
                            </div>

                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${writingResult.score >= 85 ? "bg-emerald-500" : "bg-amber-500"
                                  }`}
                                style={{ width: `${writingResult.score}%` }}
                              />
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-slate-100">
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">
                                Suggested Output
                              </span>
                              <p className="text-xs font-extrabold text-indigo-700 mt-1 leading-relaxed">
                                "{writingResult.betterSentence}"
                              </p>
                            </div>

                            {writingResult.hints.length > 0 ? (
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 block">
                                  Mock AI Suggestions:
                                </span>
                                <ul className="list-disc list-inside text-[10px] text-slate-400 font-semibold space-y-0.5">
                                  {writingResult.hints.map((hint, idx) => (
                                    <li key={idx}>{hint}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg">
                                <CheckCircle size={14} /> Great job! Capitalization, keywords, and punctuation look perfect.
                              </div>
                            )}

                            {writingResult.score < 85 && (
                              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[9px] text-rose-700 font-bold flex items-center gap-1.5">
                                <AlertTriangle size={12} className="shrink-0" />
                                Saved to mistakes list. Keep practicing to improve accuracy!
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* PRACTICE SPEAKING VIEW */}
                    {practiceTab === "speaking" && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-800">Spoken English Practice</h4>
                          <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                            Practice speaking the target phrase aloud. Use the mic button to record if supported, or type what you said below.
                          </p>
                        </div>

                        {speakingAiService.isSpeechRecognitionSupported() ? (
                          <div className="flex justify-center py-2">
                            <button
                              onClick={isRecording ? () => setIsRecording(false) : handleStartSpeechRecognition}
                              className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${isRecording
                                ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-200"
                                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 hover:scale-105"
                                }`}
                              title={isRecording ? "Stop Recording" : "Start Microphone Recording"}
                            >
                              <Mic size={18} className={isRecording ? "animate-bounce" : ""} />
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-amber-600 font-semibold bg-amber-50 p-2 rounded-lg text-center">
                            Note: Voice recording not fully supported in this browser. Please type your response.
                          </div>
                        )}

                        <div className="space-y-2">
                          <textarea
                            rows={3}
                            className="w-full p-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none focus:bg-white transition-all leading-relaxed"
                            value={practiceSpeakingInput}
                            onChange={(e) => setPracticeSpeakingInput(e.target.value)}
                            placeholder={isRecording ? "Listening to your voice..." : "Type exactly what you pronounced to verify matching..."}
                          />
                        </div>

                        <Button
                          onClick={handleCheckSpeaking}
                          disabled={!practiceSpeakingInput.trim()}
                          className="w-full text-xs font-black h-9 inline-flex items-center justify-center gap-1.5"
                        >
                          <Mic size={13} /> Verify Speaking Match
                        </Button>

                        {speakingResult && (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-fade-in">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                              <span>Pronunciation Accuracy</span>
                              <div className="flex items-center gap-1.5">
                                {speakingResult.isRealAI !== undefined && (
                                  <Badge tone={speakingResult.isRealAI ? "emerald" : "violet"} className="text-[7px] font-black uppercase">
                                    {speakingResult.isRealAI ? "Real AI" : "Mock AI"}
                                  </Badge>
                                )}
                                <span className={speakingResult.score >= 85 ? "text-emerald-600" : "text-rose-500"}>
                                  {speakingResult.score}%
                                </span>
                              </div>
                            </div>

                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${speakingResult.score >= 85 ? "bg-emerald-500" : "bg-rose-500"
                                  }`}
                                style={{ width: `${speakingResult.score}%` }}
                              />
                            </div>

                            {speakingResult.correctedAnswer && (
                              <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                                <div>
                                  <span className="text-[8px] font-bold text-slate-450 uppercase block">Corrected Transcript</span>
                                  <p className="text-xs font-extrabold text-slate-700 mt-0.5">"{speakingResult.correctedAnswer}"</p>
                                </div>
                                <button
                                  onClick={() => speakingAiService.speakAloud(speakingResult.correctedAnswer || "")}
                                  className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg"
                                  title="Listen corrected answer"
                                >
                                  <Volume2 size={12} />
                                </button>
                              </div>
                            )}

                            {speakingResult.betterAnswer && (
                              <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                                <div>
                                  <span className="text-[8px] font-bold text-slate-450 uppercase block">Better spoken suggestion</span>
                                  <p className="text-xs font-extrabold text-indigo-600 mt-0.5">"{speakingResult.betterAnswer}"</p>
                                </div>
                                <button
                                  onClick={() => speakingAiService.speakAloud(speakingResult.betterAnswer || "")}
                                  className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg"
                                  title="Listen suggestion"
                                >
                                  <Volume2 size={12} />
                                </button>
                              </div>
                            )}

                            {speakingResult.grammarMistakes && speakingResult.grammarMistakes.length > 0 && (
                              <div className="text-[10px] leading-normal text-slate-500 border-t border-slate-200/50 pt-2">
                                <span className="font-bold text-rose-500 block">Grammar Corrections:</span>
                                <ul className="list-disc list-inside text-rose-700 font-semibold space-y-0.5">
                                  {speakingResult.grammarMistakes.map((m, idx) => (
                                    <li key={idx}>{m}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {speakingResult.pronunciationHints && speakingResult.pronunciationHints.length > 0 && (
                              <div className="text-[10px] leading-normal text-slate-500">
                                <span className="font-bold text-indigo-500 block">Pronunciation Hints:</span>
                                <ul className="list-disc list-inside text-slate-650 font-semibold space-y-0.5">
                                  {speakingResult.pronunciationHints.map((h, idx) => (
                                    <li key={idx}>{h}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {speakingResult.missing && speakingResult.missing.length > 0 && (
                              <div className="text-[10px] leading-normal text-slate-500">
                                <span className="font-bold text-amber-500 block">Words to Repeat:</span>
                                <span>{speakingResult.missing.join(", ")}</span>
                              </div>
                            )}

                            {speakingResult.score >= 90 && (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg">
                                <CheckCircle size={14} /> Excellent pronunciation! Match matches template structure.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-10 border border-slate-100 bg-white text-center flex flex-col items-center justify-center min-h-[350px] text-slate-400">
                <Sparkles className="h-10 w-10 text-slate-300 stroke-1 mb-3 animate-pulse" />
                <h4 className="font-extrabold text-slate-700 text-xs tracking-tight">
                  Selected Item Workspace
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-1 max-w-xs leading-normal">
                  Select any notebook item, saved sentence, or correction from the list to practice, edit, or mark reviewed.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
