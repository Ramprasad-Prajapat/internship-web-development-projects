import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Compass, Clock, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, BookMarked } from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import englishAssessmentService from "../services/englishAssessmentService";
import aiNotebookService from "../services/aiNotebookService";

export default function EnglishAssessmentResult() {
  const navigate = useNavigate();
  const result = englishAssessmentService.getAssessmentResult();
  const [savingNotebook, setSavingNotebook] = useState(false);
  const [notebookSaved, setNotebookSaved] = useState(false);

  if (!result) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-12">
        <AlertTriangle className="mx-auto text-rose-500" size={48} />
        <h2 className="text-lg font-bold text-slate-800">No Assessment Found</h2>
        <p className="text-xs text-slate-500 font-semibold">Please complete the English diagnostic assessment first.</p>
        <Button onClick={() => navigate("/english-assessment")} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-6 rounded-xl">
          Take Assessment
        </Button>
      </div>
    );
  }

  const handleSaveToNotebook = async () => {
    if (notebookSaved) return;
    try {
      setSavingNotebook(true);
      await aiNotebookService.createNote({
        title: `English Placement Assessment Summary`,
        sourceType: "Grammar",
        originalContent: `Diagnostic Assessment Completed on ${new Date(result.completedAt).toLocaleDateString()}.
Level Calibrated: ${result.overallLevel}
Scores:
- Grammar: ${result.scores.grammar}%
- Vocabulary: ${result.scores.vocabulary}%
- Writing: ${result.scores.writing}%
- Speaking: ${result.scores.speaking}%
- Listening: ${result.scores.listening}%

Identified Weak Areas: ${result.weakAreas.join(", ")}
Recommended Study Routine: Day ${result.recommendedStartDay} onward, ${result.recommendedDailyMinutes} minutes per day.`,
        note: result.mockAiExplanation,
        tags: ["assessment", "diagnostic", "roadmap", "mock-ai-tip"],
      });
      setNotebookSaved(true);
    } catch (e) {
      console.error(e);
      alert("Failed to save to notebook.");
    } finally {
      setSavingNotebook(false);
    }
  };

  const handleCreateRoadmap = () => {
    englishAssessmentService.saveAssessmentResult(result);
    navigate("/modules/english-course");
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-rose-600 bg-rose-50 border-rose-100";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 pt-4">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 p-6 text-white text-center shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 h-36 w-36 rounded-full bg-white/10 blur-xl animate-pulse" />
        <div className="relative z-10 space-y-3">
          <Badge tone="violet" className="bg-white/20 border border-white/20 text-white text-[9px] font-black uppercase">
            Frontend Preview • Assessment Result
          </Badge>
          <Award className="mx-auto text-amber-300 drop-shadow" size={48} />
          <h1 className="text-3xl font-black tracking-tight">Your English Level is</h1>
          <div className="inline-block bg-white text-indigo-700 font-black text-2xl px-6 py-2 rounded-2xl shadow-md uppercase tracking-wider">
            {result.overallLevel}
          </div>
          <p className="text-xs text-indigo-100 font-semibold max-w-sm mx-auto mt-2">
            We calibrated your baseline scores and engineered a customized roadmap.
          </p>
        </div>
      </div>

      {/* Grid of Scores */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(Object.keys(result.scores) as Array<keyof typeof result.scores>).map((key) => {
          const score = result.scores[key];
          return (
            <Card key={key} className={`p-4 border text-center rounded-2xl flex flex-col justify-between ${getScoreColor(score)}`}>
              <span className="text-[9px] font-extrabold uppercase tracking-wider opacity-85 block">{key}</span>
              <span className="text-2xl font-black block mt-2">{score}%</span>
              <span className="text-[8px] font-black uppercase mt-1 block">
                {score >= 80 ? "Pass" : score >= 50 ? "Basic" : "Weak"}
              </span>
            </Card>
          );
        })}
      </div>

      {/* Recommendations Details */}
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-5 border border-slate-100 bg-white shadow-sm space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Roadmap Settings</h3>
          <div className="space-y-3 pt-1 text-xs">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                <Compass size={18} />
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Recommended Start Day</span>
                <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">Day {result.recommendedStartDay} (Syllabus)</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
                <Clock size={18} />
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Recommended Daily time</span>
                <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{result.recommendedDailyMinutes} Minutes / Day</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-50 p-2.5 text-rose-500">
                <AlertTriangle size={18} />
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Identified Weak Areas</span>
                <span className="text-sm font-extrabold text-rose-600 mt-0.5 block">{result.weakAreas.join(", ")}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Coach Explanation */}
        <Card className="p-5 border border-purple-100 bg-purple-50/5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 border-b border-purple-100/40 pb-2">
              <Sparkles size={16} className="text-purple-600 animate-pulse" />
              <h3 className="font-extrabold text-slate-800 tracking-tight text-xs">
                Mock AI Calibration explanation
              </h3>
            </div>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed mt-3">
              {result.mockAiExplanation}
            </p>
          </div>

          <div className="space-y-2 pt-4">
            <Button
              onClick={handleSaveToNotebook}
              disabled={savingNotebook || notebookSaved}
              className={`w-full text-xs font-extrabold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors border ${
                notebookSaved
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <BookMarked size={13} className={notebookSaved ? "text-emerald-600" : "text-slate-500"} />
              {savingNotebook ? "Saving..." : notebookSaved ? "Saved to Notebook ✓" : "Save Assessment Summary to AI Notebook"}
            </Button>

            <Button
              onClick={handleCreateRoadmap}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
            >
              Generate Personalized Roadmap <ArrowRight size={13} />
            </Button>

            <Button
              onClick={() => {
                englishAssessmentService.saveAssessmentResult(result);
                navigate("/practice-center");
              }}
              className="w-full bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
            >
              Go to Skills Practice Hub <ArrowRight size={13} />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
