import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Download,
  History as HistoryIcon,
  Search,
  Trash2,
  FileSpreadsheet,
  Clock,
  Filter,
  RefreshCw,
  BookOpen,
  Sparkles,
  Bookmark,
  ShieldCheck,
  PenTool,
} from "lucide-react";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";
import type { BadgeTone } from "../components/common/Badge";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import { usePolling } from "../hooks/usePolling";
import historyService from "../services/historyService";
import {
  HISTORY_EVENT_TYPES,
  type HistoryEntry,
  type HistoryEventType,
} from "../types/history.types";

const EVENT_LABELS: Record<HistoryEventType, string> = {
  IMPORT_DRAFT_SAVED: "Draft saved",
  IMPORT_PREVIEW_CREATED: "Preview created",
  IMPORT_FINAL_SAVED: "Import finished",
  LESSON_SAVED: "Lesson saved",
  DAILY_LESSON_SAVED: "Daily lesson",
  PREPOSITION_NOTE_SAVED: "Preposition note",
  LESSON_VIEWED: "Lesson viewed",
  DAILY_LESSON_VIEWED: "Daily lesson viewed",
  PREPOSITION_VIEWED: "Preposition viewed",
  QUESTIONS_GENERATED: "Practice started",
  ANSWER_CHECKED: "Answer checked",
  MISTAKE_SAVED: "Mistake saved",
  DAILY_LESSON_PRACTICED: "Daily lesson practiced",
  PREPOSITION_PRACTICED: "Preposition practiced",
  MISTAKE_REVIEWED: "Mistake reviewed",
  EXTENSION_CONTENT_IMPORTED: "Content imported",
  EXTENSION_CONTENT_CONVERTED: "Content converted",
  EXTENSION_INBOX_ITEM_DELETED: "Clip deleted",
  PROFILE_UPDATED: "Profile updated",
  NOTEBOOK_ITEM_CREATED: "Notebook item created",
  NOTEBOOK_ITEM_UPDATED: "Notebook item updated",
  NOTEBOOK_VOCABULARY_PRACTICED: "Vocabulary studied",
  NOTEBOOK_SPEAKING_PRACTICED: "Speaking practice",
  NOTEBOOK_LISTENING_PRACTICED: "Listening practice",
  NOTEBOOK_WRITING_CHECKED: "Writing draft checked",
  NOTEBOOK_READING_CHECKED: "Reading draft checked",
  NOTEBOOK_QUESTIONS_GENERATED: "Quiz generated",
  NOTEBOOK_ANSWERS_CHECKED: "Quiz answers checked",
  NOTEBOOK_MISTAKE_SAVED: "Notebook mistake saved",
  SECTION_NOTEBOOK_SAVED: "Section note saved",
  SECTION_WRITING_CHECKED: "Section writing analyzed",
  SECTION_SPEAKING_CHECKED: "Section speech analyzed",
  SECTION_AI_RECOMMENDATION_VIEWED: "Recommendations loaded",
  SECTION_MISTAKE_FOUND: "Mistake detected",
  LESSON_SECTION_VIEWED: "Section studied",
  SECTION_SAVED_TO_NOTEBOOK: "Section saved to notebook",
  SECTION_VIEWED: "Section detail viewed",
  SECTION_LISTENED: "Section audio listened",
  SECTION_NOTE_SAVED: "Section note synced",
  SECTION_COMPLETED: "Section completed",
  AI_COACH_TIP_SAVED: "Coach tip saved",
  REVISION_PLAN_GENERATED: "Revision plan generated",
  REVISION_TASK_COMPLETED: "Revision task completed",
  REVISION_PRACTICE_CHECKED: "Revision checked",
  WEAK_AREA_REVIEWED: "Weak area reviewed",
  USER_TEXT_IMPORTED: "Personal text imported",
  USER_SENTENCE_SAVED: "Personal sentence saved",
  USER_IMPORT_WRITING_CHECKED: "Personal writing checked",
  USER_IMPORT_SPEAKING_CHECKED: "Personal speaking checked",
  PRACTICE_CENTER_QUIZ_COMPLETED: "Practice quiz completed",
  PRACTICE_CENTER_WRITING_CHECKED: "Practice writing checked",
  PRACTICE_CENTER_SPEAKING_PRACTICED: "Practice speaking completed",
  PRACTICE_CENTER_MISTAKE_REVIEWED: "Practice mistake reviewed",
};

const EVENT_TONES: Record<HistoryEventType, BadgeTone> = {
  IMPORT_DRAFT_SAVED: "slate",
  IMPORT_PREVIEW_CREATED: "sky",
  IMPORT_FINAL_SAVED: "indigo",
  LESSON_SAVED: "emerald",
  DAILY_LESSON_SAVED: "indigo",
  PREPOSITION_NOTE_SAVED: "violet",
  LESSON_VIEWED: "amber",
  DAILY_LESSON_VIEWED: "sky",
  PREPOSITION_VIEWED: "violet",
  QUESTIONS_GENERATED: "sky",
  ANSWER_CHECKED: "indigo",
  MISTAKE_SAVED: "rose",
  DAILY_LESSON_PRACTICED: "emerald",
  PREPOSITION_PRACTICED: "violet",
  MISTAKE_REVIEWED: "amber",
  EXTENSION_CONTENT_IMPORTED: "indigo",
  EXTENSION_CONTENT_CONVERTED: "emerald",
  EXTENSION_INBOX_ITEM_DELETED: "slate",
  PROFILE_UPDATED: "sky",
  NOTEBOOK_ITEM_CREATED: "indigo",
  NOTEBOOK_ITEM_UPDATED: "sky",
  NOTEBOOK_VOCABULARY_PRACTICED: "emerald",
  NOTEBOOK_SPEAKING_PRACTICED: "violet",
  NOTEBOOK_LISTENING_PRACTICED: "amber",
  NOTEBOOK_WRITING_CHECKED: "sky",
  NOTEBOOK_READING_CHECKED: "indigo",
  NOTEBOOK_QUESTIONS_GENERATED: "violet",
  NOTEBOOK_ANSWERS_CHECKED: "emerald",
  NOTEBOOK_MISTAKE_SAVED: "rose",
  SECTION_NOTEBOOK_SAVED: "indigo",
  SECTION_WRITING_CHECKED: "sky",
  SECTION_SPEAKING_CHECKED: "violet",
  SECTION_AI_RECOMMENDATION_VIEWED: "amber",
  SECTION_MISTAKE_FOUND: "rose",
  LESSON_SECTION_VIEWED: "sky",
  SECTION_SAVED_TO_NOTEBOOK: "indigo",
  SECTION_VIEWED: "sky",
  SECTION_LISTENED: "amber",
  SECTION_NOTE_SAVED: "emerald",
  SECTION_COMPLETED: "emerald",
  AI_COACH_TIP_SAVED: "indigo",
  REVISION_PLAN_GENERATED: "indigo",
  REVISION_TASK_COMPLETED: "emerald",
  REVISION_PRACTICE_CHECKED: "sky",
  WEAK_AREA_REVIEWED: "violet",
  USER_TEXT_IMPORTED: "indigo",
  USER_SENTENCE_SAVED: "emerald",
  USER_IMPORT_WRITING_CHECKED: "sky",
  USER_IMPORT_SPEAKING_CHECKED: "amber",
  PRACTICE_CENTER_QUIZ_COMPLETED: "emerald",
  PRACTICE_CENTER_WRITING_CHECKED: "indigo",
  PRACTICE_CENTER_SPEAKING_PRACTICED: "violet",
  PRACTICE_CENTER_MISTAKE_REVIEWED: "amber",
};

type FilterType = "all" | "lessons" | "notebook" | "mistakes" | "writing" | "speaking" | "revision";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function History() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(() => {
    historyService.list().then(setEntries);
  }, []);
  usePolling(refresh, 3000);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const typeStr = String(e.type);
      const titleStr = (e.title || "").toLowerCase();

      // Filter logic mapping
      if (activeFilter !== "all") {
        if (activeFilter === "lessons") {
          const isLesson =
            typeStr.includes("LESSON") ||
            typeStr.includes("SECTION_VIEWED") ||
            typeStr.includes("SECTION_COMPLETED") ||
            titleStr.includes("lesson") ||
            titleStr.includes("day");
          if (!isLesson) return false;
        } else if (activeFilter === "notebook") {
          const isNotebook =
            typeStr.includes("NOTEBOOK") ||
            typeStr.includes("IMPORT") ||
            titleStr.includes("notebook") ||
            titleStr.includes("import");
          if (!isNotebook) return false;
        } else if (activeFilter === "mistakes") {
          const isMistake = typeStr.includes("MISTAKE") || titleStr.includes("mistake");
          if (!isMistake) return false;
        } else if (activeFilter === "writing") {
          const isWriting = typeStr.includes("WRITING") || titleStr.includes("writing");
          if (!isWriting) return false;
        } else if (activeFilter === "speaking") {
          const isSpeaking = typeStr.includes("SPEAKING") || titleStr.includes("speaking");
          if (!isSpeaking) return false;
        } else if (activeFilter === "revision") {
          const isRevision = typeStr.includes("REVISION") || titleStr.includes("revision");
          if (!isRevision) return false;
        }
      }

      // Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = e.title.toLowerCase().includes(q);
        const matchesDesc = (e.description || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [entries, activeFilter, search]);

  // Group filtered entries by day (or other key) and sort groups by latest activity
  const groupedEntries = useMemo(() => {
    const groups: Record<string, HistoryEntry[]> = {};
    filteredEntries.forEach((e) => {
      const key = e.dayNumber != null ? `Day ${e.dayNumber}` : e.title || "Other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    // Convert to array and sort entries within each group (newest first)
    const groupedArray = Object.entries(groups).map(([key, entries]) => ({
      key,
      entries: entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    }));
    // Sort groups by the newest entry in each group (newest first)
    groupedArray.sort((a, b) => new Date(b.entries[0].createdAt).getTime() - new Date(a.entries[0].createdAt).getTime());
    return groupedArray;
  }, [filteredEntries]);

  const onClear = async () => {
    if (!window.confirm("Clear all activity history? This cannot be undone.")) return;
    await historyService.clearHistory();
    setEntries([]);
  };

  const onExport = async () => {
    const json = await historyService.exportJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "english-app-history.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setToast("History exported as english-app-history.json");
    window.setTimeout(() => setToast(null), 3000);
  };

  const getSourceModuleLabel = (type: HistoryEventType) => {
    const typeStr = String(type);
    if (typeStr.includes("NOTEBOOK") || typeStr.includes("IMPORT")) return "AI Notebook";
    if (typeStr.includes("MISTAKE")) return "Mistakes Database";
    if (typeStr.includes("LESSON") || typeStr.includes("SECTION")) return "English Course";
    if (typeStr.includes("REVISION")) return "Smart Revision";
    return "Daily Practice";
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header & Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>

          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
              Activity History
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Your recent lessons, practice, and mistakes in one place.
          </p>
        </div>


      </div>

      {toast && (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
        >
          {toast}
        </div>
      )}

      {entries.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={<HistoryIcon size={24} className="text-slate-400" />}
            title="No activity yet"
            message="No learning activity yet. Start today’s English lesson."
            action={
              <Link
                to="/modules/english-course"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                Start English Lesson
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {/* Filters Panel */}
          <Card className="space-y-4 p-5 border border-slate-100 shadow-sm bg-white">
            {/* Search Input */}
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className="input-base pl-9 text-xs"
                placeholder="Search history by keyword or details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter categories */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Filters
                </span>
                {(activeFilter !== "all" || search.trim() !== "") && (
                  <button
                    onClick={() => {
                      setActiveFilter("all");
                      setSearch("");
                    }}
                    className="text-[10px] text-indigo-600 hover:underline font-bold"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                {([
                  { value: "all", label: "All " },
                  { value: "lessons", label: "Lessons" },
                  { value: "notebook", label: "AI Notebook" },
                  { value: "mistakes", label: "Mistakes" },
                  { value: "writing", label: "Writing Checks" },
                  { value: "speaking", label: "Speaking Practice" },
                  { value: "revision", label: "Revisions" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setActiveFilter(opt.value)}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all duration-150 ${activeFilter === opt.value
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Timeline Output */}
          {filteredEntries.length === 0 ? (
            <Card className="p-8">
              <EmptyState
                title="No learning activity found"
                message="No timeline logs match your current filter settings."
              />
            </Card>
          ) : (
            <>
              {/* Grouped Day Cards */}
              {groupedEntries.map((group) => (
                <Card key={group.key} className="mb-6 p-4 border border-slate-100 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-800">{group.key}</h3>
                    <span className="text-xs text-slate-500">
                      {group.entries.length} activity{group.entries.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mb-2">
                    Last activity: {formatDateTime(group.entries[0].createdAt)}
                  </p>

                  {group.entries.map((e) => {
                    const badgeLabel =
                      EVENT_LABELS[e.type] || String(e.type).replace(/_/g, " ").toLowerCase();
                    const badgeTone = EVENT_TONES[e.type] || "slate";
                    const sourceModule = getSourceModuleLabel(e.type);

                    return (
                      <div key={e.id} className="relative mb-4">
                        {/* Timeline Node Dot */}
                        <div className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-white bg-indigo-500 shadow-sm" />
                        <Card className="p-4 border border-slate-100 shadow-sm bg-white hover:border-slate-200/80 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Badge tone={badgeTone} className="capitalize">
                                  {badgeLabel}
                                </Badge>
                                <span className="text-[10px] font-extrabold text-indigo-600/85 uppercase tracking-wide">
                                  {sourceModule}
                                </span>
                              </div>

                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock size={10} /> {formatDateTime(e.createdAt)}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-slate-800">{e.title}</h4>

                            {e.description && (
                              <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">
                                {e.description}
                              </p>
                            )}

                            <div className="mt-3.5 pt-2 border-t border-slate-50 flex flex-wrap gap-3 text-xs font-bold">
                              {e.dayNumber != null && (
                                <Link
                                  to={`/daily-lessons/day/${e.dayNumber}`}
                                  className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-0.5"
                                >
                                  Study Day {e.dayNumber} <ArrowRight size={11} />
                                </Link>
                              )}

                              {e.lessonId && (
                                <Link
                                  to={`/lesson/${e.lessonId}`}
                                  className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-0.5"
                                >
                                  Open Lesson <ArrowRight size={11} />
                                </Link>
                              )}

                              {(String(e.type).includes("NOTEBOOK") ||
                                String(e.type).includes("IMPORT")) && (
                                <Link
                                  to="/ai-notebook"
                                  className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-0.5"
                                >
                                  Open AI Notebook <ArrowRight size={11} />
                                </Link>
                              )}

                              {String(e.type).includes("MISTAKE") && (
                                <Link
                                  to="/mistakes"
                                  className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-0.5"
                                >
                                  Review Mistakes <ArrowRight size={11} />
                                </Link>
                              )}

                              {String(e.type).includes("REVISION") && (
                                <Link
                                  to="/revision"
                                  className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-0.5"
                                >
                                  Practice Revision <ArrowRight size={11} />
                                </Link>
                              )}
                            </div>
                          </div>
                        </Card>
                      </div>
                    );
                  })}
                </Card>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
