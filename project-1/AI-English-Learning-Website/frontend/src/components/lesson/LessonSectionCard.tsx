import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Volume2,
  VolumeX,
  BookmarkPlus,
  BookOpen,
  HelpCircle,
  Clock,
  CheckSquare,
  AlertTriangle,
  Flame,
  Bookmark,
  ExternalLink,
  Check
} from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import type { NotebookSourceType } from "../../types/aiNotebook.types";
import aiNotebookService from "../../services/aiNotebookService";
import historyService from "../../services/historyService";

interface LessonSectionCardProps {
  heading: string;
  body: string;
  sourceType: NotebookSourceType;
  moduleKey: string;
  dayNumber: number | null;
  sourceTitle: string;
}

export default function LessonSectionCard({
  heading,
  body,
  sourceType,
  moduleKey,
  dayNumber,
  sourceTitle
}: LessonSectionCardProps) {
  const navigate = useNavigate();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Generate a clean sectionId from heading
  const sectionId = heading.toLowerCase().replace(/[^a-z0-9]/g, "-");

  // Check if already saved in notebook
  useEffect(() => {
    async function checkSavedStatus() {
      try {
        const allNotes = await aiNotebookService.listNotes();
        const found = allNotes.some((n) => {
          const hasSourceType = n.sourceType === sourceType;
          const hasModuleKey = n.tags?.includes(moduleKey);
          const hasSectionId = n.tags?.includes(`section-${sectionId}`);
          const hasDay = dayNumber ? n.tags?.includes(`day-${dayNumber}`) : true;
          return hasSourceType && hasModuleKey && hasSectionId && hasDay;
        });
        setIsSaved(found);
      } catch (err) {
        console.error(err);
      }
    }
    checkSavedStatus();
  }, [heading, sourceType, moduleKey, dayNumber, sectionId]);

  // Premium themes based on heading type
  const getSectionTheme = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("vocab")) {
      return {
        badgeTone: "sky" as const,
        icon: <BookOpen size={16} className="text-sky-600" />,
        bgColor: "hover:bg-sky-50/20",
        borderColor: "border-sky-100",
        badgeText: "Vocabulary"
      };
    }
    if (t.includes("grammar") || t.includes("rule")) {
      return {
        badgeTone: "rose" as const,
        icon: <Bookmark size={16} className="text-rose-600" />,
        bgColor: "hover:bg-rose-50/20",
        borderColor: "border-rose-100",
        badgeText: "Grammar"
      };
    }
    if (t.includes("prep")) {
      return {
        badgeTone: "violet" as const,
        icon: <Bookmark size={16} className="text-violet-600" />,
        bgColor: "hover:bg-violet-50/20",
        borderColor: "border-violet-100",
        badgeText: "Prepositions"
      };
    }
    if (t.includes("speaking") || t.includes("drill") || t.includes("pronun")) {
      return {
        badgeTone: "emerald" as const,
        icon: <Flame size={16} className="text-emerald-600" />,
        bgColor: "hover:bg-emerald-50/20",
        borderColor: "border-emerald-100",
        badgeText: "Speaking"
      };
    }
    if (t.includes("question") || t.includes("q&a") || t.includes("conversation")) {
      return {
        badgeTone: "amber" as const,
        icon: <HelpCircle size={16} className="text-amber-600" />,
        bgColor: "hover:bg-amber-50/20",
        borderColor: "border-amber-100",
        badgeText: "Practice Qs"
      };
    }
    if (t.includes("mistake")) {
      return {
        badgeTone: "rose" as const,
        icon: <AlertTriangle size={16} className="text-rose-600" />,
        bgColor: "hover:bg-rose-50/20",
        borderColor: "border-rose-100",
        badgeText: "Common Mistakes"
      };
    }
    if (t.includes("time table") || t.includes("schedule")) {
      return {
        badgeTone: "indigo" as const,
        icon: <Clock size={16} className="text-indigo-600" />,
        bgColor: "hover:bg-indigo-50/20",
        borderColor: "border-indigo-100",
        badgeText: "Time Table"
      };
    }
    if (t.includes("homework") || t.includes("check")) {
      return {
        badgeTone: "indigo" as const,
        icon: <CheckSquare size={16} className="text-indigo-600" />,
        bgColor: "hover:bg-indigo-50/20",
        borderColor: "border-indigo-100",
        badgeText: "Task"
      };
    }

    return {
      badgeTone: "slate" as const,
      icon: <BookOpen size={16} className="text-slate-600" />,
      bgColor: "hover:bg-slate-50/20",
      borderColor: "border-slate-100",
      badgeText: "Lesson Section"
    };
  };

  const theme = getSectionTheme(heading);

  // Navigate to section detail page
  const handleNavigate = () => {
    if (dayNumber != null) {
      navigate(`/daily-lessons/day/${dayNumber}/section/${sectionId}`);
    } else if (sourceType === "Preposition") {
      const prepName = sourceTitle.replace("Preposition ", "").toLowerCase();
      navigate(`/prepositions/${prepName}/section/${sectionId}`);
    } else {
      navigate(`/daily-lessons/day/5/section/${sectionId}`);
    }
  };

  // Quick Speak
  const handleSpeakQuick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${heading}. ${body}`);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Quick Save to AI Notebook
  const handleSaveQuick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved || isSaving) return;
    setIsSaving(true);

    try {
      await new Promise((r) => setTimeout(r, 450));
      const title = dayNumber
        ? `Day ${dayNumber} — ${heading}`
        : `${sourceTitle} — ${heading}`;

      await aiNotebookService.createNote({
        title,
        sourceType,
        originalContent: `Reference content:\n\n${body}`,
        tags: ["quick-saved", moduleKey, dayNumber ? `day-${dayNumber}` : "", `section-${sectionId}`].filter(Boolean)
      });

      setIsSaved(true);

      // Log history
      const practiceType = sourceType === "Daily Lesson" ? "DAILY_LESSON" : "PREPOSITION";
      const sourceIdVal = dayNumber ? `${dayNumber}_${sectionId}` : `${sourceTitle.replace("Preposition ", "").toLowerCase()}_${sectionId}`;
      await historyService.addEntry({
        type: "SECTION_SAVED_TO_NOTEBOOK",
        title: `Quick Saved ${heading}`,
        description: `Quick saved "${heading}" section reference content to the AI Notebook.`,
        sourceType: practiceType,
        sourceId: sourceIdVal,
      });
    } catch (err) {
      console.error("Error in quick save:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Stop speechSynthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Truncated preview text
  const previewText = body ? (body.length > 95 ? `${body.slice(0, 95)}...` : body) : "";

  return (
    <Card
      className={`transition-all duration-300 border ${theme.borderColor} ${theme.bgColor} overflow-hidden shadow-sm/30 cursor-pointer hover:shadow-md/50 hover:-translate-y-[1px]`}
      onClick={handleNavigate}
    >
      <div className="flex items-center justify-between gap-4 p-4 select-none">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100/50">
            {theme.icon}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base leading-snug">
              {heading}
            </h3>
            {previewText && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-1 max-w-[280px] sm:max-w-[450px]">
                {previewText}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Start button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate();
            }}
            aria-label="Start Section"
            className="p-2 px-3 md:px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold border border-indigo-600 transition-all flex items-center gap-1.5 text-xs shadow-sm"
          >
            <ExternalLink size={13} />
            <span>Start</span>
          </button>
        </div>
      </div>
    </Card>
  );
}
