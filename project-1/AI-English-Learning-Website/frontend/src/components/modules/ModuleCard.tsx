import { Link } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import type { LearningModule } from "../../constants/learningModules";

interface ModuleCardProps {
  module: LearningModule;
  progressCount?: number;
  lastActivity?: string;
  extraStats?: {
    lessonsViewed: number;
    lessonsPracticed: number;
  };
}

export function ModuleCard({ module, progressCount, lastActivity, extraStats }: ModuleCardProps) {
  const Icon = module.icon;
  const isEnglishCourse = module.moduleKey === "english-course";

  if (module.status === "coming-soon") {
    return (
      <Card className="p-5 border border-slate-100/70 bg-slate-50/40 select-none opacity-75">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-100 p-2.5 text-slate-400">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-500 tracking-tight">{module.title}</h3>
            <span className="inline-flex items-center gap-1 rounded bg-slate-200/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-1">
              <Lock size={9} /> Coming Soon
            </span>
          </div>
        </div>
        <p className="mt-3.5 text-xs font-medium text-slate-400 leading-relaxed">
          {module.description}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5 border border-slate-100/80 bg-white shadow-sm hover:shadow-card hover:-translate-y-0.5 hover:border-indigo-100 transition-all duration-200">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 border border-indigo-100/30">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 tracking-tight">{module.title}</h3>
            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 mt-1 border border-emerald-100">
              Active Module
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3.5 text-xs font-medium text-slate-500 leading-relaxed min-h-[32px]">
        {module.description}
      </p>

      {/* Course Sub-Modules Grid for English Course */}
      {module.subModules && module.subModules.length > 0 && (
        <div className="mt-4 border-t border-slate-50 pt-3 space-y-2">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Course Sub-Modules
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {module.subModules.map((sub) => {
              const SubIcon = sub.icon;
              if (sub.status === "active" && sub.route) {
                return (
                  <Link
                    key={sub.key}
                    to={sub.route}
                    className="flex items-center gap-1.5 p-1.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-100/50 transition-colors text-left"
                  >
                    <SubIcon size={11} className="text-indigo-600 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-700 truncate">{sub.title}</span>
                  </Link>
                );
              }
              return (
                <div
                  key={sub.key}
                  className="flex items-center gap-1.5 p-1.5 rounded-lg border border-dashed border-slate-100 bg-slate-50/20 select-none opacity-60 text-left cursor-not-allowed"
                  title="Coming soon"
                >
                  <SubIcon size={11} className="text-slate-400 shrink-0" />
                  <span className="text-[10px] font-semibold text-slate-400 truncate">{sub.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {progressCount !== undefined && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3 text-[11px] font-semibold text-slate-400">
          <span>Progress Logged</span>
          <span className="text-slate-700 font-bold">{progressCount} sessions</span>
        </div>
      )}

      {extraStats && (
        <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span>Lessons (Viewed/Practiced)</span>
          <span className="text-slate-700 font-bold">
            {extraStats.lessonsViewed} / {extraStats.lessonsPracticed}
          </span>
        </div>
      )}

      {lastActivity && (
        <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span>Last Active</span>
          <span className="text-slate-600 truncate max-w-[120px]">{lastActivity}</span>
        </div>
      )}

      {/* Buttons */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        {isEnglishCourse ? (
          <>
            <Link to="/modules/english-course">
              <Button size="sm" variant="outline" className="w-full text-[11px] font-bold h-9">
                Overview
              </Button>
            </Link>
            <Link to="/english">
              <Button size="sm" className="w-full text-[11px] font-bold h-9 inline-flex items-center justify-center gap-1">
                Continue Course <ArrowRight size={12} />
              </Button>
            </Link>
          </>
        ) : (
          <>
            <Link to={module.mainRoute}>
              <Button size="sm" variant="outline" className="w-full text-[11px] font-bold h-9">
                Overview
              </Button>
            </Link>
            {module.practiceRoute && (
              <Link to={module.practiceRoute}>
                <Button size="sm" className="w-full text-[11px] font-bold h-9 inline-flex items-center justify-center gap-1">
                  Practice <ArrowRight size={12} />
                </Button>
              </Link>
            )}
          </>
        )}
      </div>

      {module.reportRoute && (
        <div className="mt-2">
          <Link to={module.reportRoute}>
            <Button size="sm" variant="ghost" className="w-full text-[11px] font-bold text-indigo-600 hover:bg-indigo-50/50 hover:text-indigo-700 h-8">
              View Analytics Report
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}

export default ModuleCard;
