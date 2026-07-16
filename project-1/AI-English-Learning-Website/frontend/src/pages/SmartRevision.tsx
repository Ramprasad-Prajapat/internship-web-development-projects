import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, BookOpen, AlertTriangle, CheckCircle, Award, RefreshCw, BarChart2 } from "lucide-react";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import LoadingState from "../components/common/LoadingState";
import WeakAreaCard from "../components/revision/WeakAreaCard";
import RevisionPlanCard from "../components/revision/RevisionPlanCard";
import RevisionPracticeCard from "../components/revision/RevisionPracticeCard";
import revisionService from "../services/revisionService";
import type { WeakArea, RevisionTask, RevisionPracticeQuestion, WeakAreaKey } from "../types/revision.types";

export default function SmartRevision() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    weakAreasCount: number;
    mistakesCount: number;
    tasksCount: number;
    completedToday: number;
    accuracy: number;
  } | null>(null);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [tasks, setTasks] = useState<RevisionTask[]>([]);
  const [activePracticeQuestions, setActivePracticeQuestions] = useState<RevisionPracticeQuestion[] | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const s = await revisionService.getRevisionStats();
      const w = await revisionService.detectWeakAreas();
      const t = revisionService.getRevisionTasks();
      setStats(s);
      setWeakAreas(w);
      setTasks(t);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const t = await revisionService.generateRevisionPlan();
      setTasks(t);
      const s = await revisionService.getRevisionStats();
      setStats(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (id: string) => {
    const nextTasks = await revisionService.markTaskCompleted(id);
    setTasks(nextTasks);
    const s = await revisionService.getRevisionStats();
    setStats(s);
  };

  const handleSkipTask = (id: string) => {
    const nextTasks = revisionService.skipTask(id);
    setTasks(nextTasks);
  };

  const handleStartTask = (task: RevisionTask) => {
    // If the task maps to a known practice module/weak area key, launch inline. Otherwise, redirect.
    let areaKey: WeakAreaKey | null = null;
    if (task.id === "rev_t_mistakes") areaKey = "grammar";
    if (task.id === "rev_t_preposition") areaKey = "prepositions";
    if (task.id === "rev_t_speaking") areaKey = "speaking";
    if (task.id === "rev_t_writing") areaKey = "writing";
    if (task.id === "rev_t_notebook") areaKey = "questions";

    if (areaKey) {
      handleLaunchPractice(areaKey);
    } else {
      navigate(task.route);
    }
  };

  const handleLaunchPractice = async (key: WeakAreaKey) => {
    setLoading(true);
    try {
      const questions = await revisionService.getPracticeQuestions(key);
      setActivePracticeQuestions(questions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeFinished = async () => {
    setActivePracticeQuestions(null);
    await loadData();
  };

  if (loading && !stats) {
    return <LoadingState message="Analyzing weak areas & loading revision workspace..." />;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      {/* Back button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/modules"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Modules
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Smart Revision
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-800 uppercase tracking-widest flex items-center gap-0.5">
              <Sparkles size={10} className="animate-pulse" /> Mock AI Revision
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            Review weak areas, repeat mistakes, and improve with Mock AI revision practice.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
            title="Refresh analysis"
          >
            <RefreshCw size={14} className="text-slate-600" />
          </button>
          {!activePracticeQuestions && (
            <Button
              onClick={handleGeneratePlan}
              className="flex items-center gap-1 text-xs py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm hover:shadow"
            >
              <Sparkles size={12} /> Generate Mock AI Plan
            </Button>
          )}
        </div>
      </div>

      {/* PAUSED WARNING */}
      <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3 px-4 text-xs font-semibold flex items-center gap-2">
        <span className="h-2 w-2 bg-amber-500 rounded-full animate-ping" />
        <span>Frontend preview active. Real AI / backend integration is paused.</span>
      </div>

      {/* Practice Launcher overlay */}
      {activePracticeQuestions && (
        <div className="bg-slate-50/90 border border-slate-100 rounded-3xl p-4 sm:p-6 shadow-inner">
          <div className="flex items-center justify-between mb-4 max-w-2xl mx-auto">
            <h2 className="text-sm font-extrabold text-slate-800">
              Interactive Practice Session
            </h2>
            <Button
              onClick={() => setActivePracticeQuestions(null)}
              variant="ghost"
              className="text-xs text-slate-500 hover:text-slate-700 py-1 px-3 border border-slate-200 rounded-lg bg-white"
            >
              Cancel Practice
            </Button>
          </div>
          <RevisionPracticeCard
            questions={activePracticeQuestions}
            onFinished={handlePracticeFinished}
          />
        </div>
      )}

      {!activePracticeQuestions && stats && (
        <>
          {/* Top Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <Card className="p-4 border-slate-100 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Weak Areas
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-800">{stats.weakAreasCount}</span>
                <span className="text-xs text-slate-400 font-semibold">detected</span>
              </div>
            </Card>

            <Card className="p-4 border-slate-100 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Mistakes to Review
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-rose-600">{stats.mistakesCount}</span>
                <span className="text-xs text-slate-400 font-semibold">pending</span>
              </div>
            </Card>

            <Card className="p-4 border-slate-100 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Revision Tasks
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-indigo-600">{stats.tasksCount}</span>
                <span className="text-xs text-slate-400 font-semibold">today</span>
              </div>
            </Card>

            <Card className="p-4 border-slate-100 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Completed Today
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-emerald-600">{stats.completedToday}</span>
                <span className="text-xs text-slate-400 font-semibold">done</span>
              </div>
            </Card>

            <Card className="col-span-2 sm:col-span-1 p-4 border-slate-100 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Practice Accuracy
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-800">{stats.accuracy}%</span>
                <span className="text-xs text-slate-400 font-semibold">correct</span>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weak Areas block */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <BookOpen size={16} className="text-slate-600" />
                Detected Weak Areas
              </h2>

              {weakAreas.length === 0 ? (
                <Card className="p-8 text-center bg-slate-50/50 border-slate-150">
                  <CheckCircle size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-500">
                    No weak areas yet. Practice more to generate revision suggestions.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {weakAreas.map((area) => (
                    <WeakAreaCard
                      key={area.key}
                      weakArea={area}
                      onPractice={handleLaunchPractice}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Revision Plan Block */}
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <BarChart2 size={16} className="text-slate-600" />
                Revision Plan
              </h2>

              {tasks.length === 0 ? (
                <Card className="p-6 text-center bg-slate-50/50 border-slate-150 space-y-3">
                  <AlertTriangle size={24} className="mx-auto text-slate-400 animate-pulse" />
                  <p className="text-xs font-semibold text-slate-500">
                    No active revision plan generated for today.
                  </p>
                  <Button
                    onClick={handleGeneratePlan}
                    className="w-full flex items-center justify-center gap-1 text-xs py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                  >
                    <Sparkles size={12} /> Generate Plan
                  </Button>
                </Card>
              ) : (
                <RevisionPlanCard
                  tasks={tasks}
                  onStart={handleStartTask}
                  onComplete={handleCompleteTask}
                  onSkip={handleSkipTask}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
