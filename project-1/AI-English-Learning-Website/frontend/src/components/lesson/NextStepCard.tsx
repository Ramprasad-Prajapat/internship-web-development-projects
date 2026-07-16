import React, { useEffect, useState } from "react";
import { ArrowRight, Award } from "lucide-react";
import { Link } from "react-router-dom";
import sectionProgressService from "../../services/sectionProgressService";
import type { SectionProgress } from "../../types/sectionProgress.types";

interface NextStepCardProps {
  sourceId: string; // e.g. "5" or "in"
  sourceType: "DAILY_LESSON" | "PREPOSITION";
  sections: Array<{ heading: string; body: string }>;
}

export default function NextStepCard({ sourceId, sourceType, sections }: NextStepCardProps) {
  const [progresses, setProgresses] = useState<SectionProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgresses() {
      try {
        const list: SectionProgress[] = [];
        for (const sec of sections) {
          const secId = `${sourceId}_${sec.heading.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
          const p = await sectionProgressService.getProgress(secId, sourceType);
          list.push(p);
        }
        setProgresses(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadProgresses();
  }, [sourceId, sourceType, sections]);

  if (loading || sections.length === 0) return null;

  const completedCount = progresses.filter(p => p.completed).length;
  const totalCount = sections.length;
  const isAllCompleted = completedCount === totalCount;

  // Find the first uncompleted section
  const nextIndex = progresses.findIndex(p => !p.completed);
  const nextSection = nextIndex >= 0 ? sections[nextIndex] : null;

  const getSuggestedAction = (heading: string) => {
    const h = heading.toLowerCase();
    if (h.includes("vocab") || h.includes("word")) {
      return "Read section words and save at least 3 words/phrases to AI Notebook.";
    }
    if (h.includes("grammar") || h.includes("rule") || h.includes("prep")) {
      return "Study grammar rules and write 3 examples using Write Mode.";
    }
    if (h.includes("speaking") || h.includes("drill") || h.includes("pronun")) {
      return "Practice pronunciation using Speak Mode and save attempt.";
    }
    if (h.includes("mistake")) {
      return "Review wrong sentences and note corrections in Notebook.";
    }
    if (h.includes("quiz")) {
      return "Complete practice quiz and review results.";
    }
    return "Read content and practice in Write Mode or Speak Mode.";
  };

  const getTargetUrl = (secHeading: string) => {
    const sectionSlug = secHeading.toLowerCase().replace(/[^a-z0-9]/g, "-");
    if (sourceType === "DAILY_LESSON") {
      return `/daily-lessons/day/${sourceId}/section/${sectionSlug}`;
    }
    return `/prepositions/${sourceId}/section/${sectionSlug}`;
  };

  if (isAllCompleted) {
    return (
      <div className="bg-gradient-to-tr from-emerald-500 to-teal-600 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-full">
            <Award size={28} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Congratulations! 🎉</h3>
            <p className="text-sm text-emerald-50 font-medium">
              You completed all {totalCount} sections for this topic.
            </p>
          </div>
        </div>
        <div className="text-xs bg-white text-emerald-700 font-bold px-4 py-2 rounded-xl">
          Completed ✓
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Today’s Next Step</h3>
          <p className="text-xs text-slate-400">
            Progress: {completedCount} of {totalCount} sections completed
          </p>
        </div>
        <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {nextSection && (
        <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">
                Recommended Section
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              <span className="text-xs font-semibold text-slate-700">
                {nextSection.heading}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {getSuggestedAction(nextSection.heading)}
            </p>
          </div>
          <Link
            to={getTargetUrl(nextSection.heading)}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm shrink-0"
          >
            Start Section <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
