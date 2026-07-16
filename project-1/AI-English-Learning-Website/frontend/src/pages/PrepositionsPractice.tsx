import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Shapes,
  Dumbbell,
  ArrowRight,
  History,
  FileSpreadsheet,
} from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import PracticeRunner from "../components/practice/PracticeRunner";
import prepositionService from "../services/prepositionService";
import aiPracticeService from "../services/aiPracticeService";
import type { PrepositionContent } from "../types/preposition.types";
import type { PracticeSession, Question } from "../types/ai.types";

export default function PrepositionsPractice() {
  const [preps, setPreps] = useState<PrepositionContent[]>([]);
  const [latestSession, setLatestSession] = useState<PracticeSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<PracticeSession[]>([]);

  // Inline practice states
  const [selectedPrep, setSelectedPrep] = useState<PrepositionContent | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const loadDashboard = () => {
    Promise.all([
      prepositionService.listPrepositions(),
      aiPracticeService.getLatestSession("PREPOSITION"),
      aiPracticeService.listSessions(),
    ])
      .then(([p, latest, allSessions]) => {
        setPreps(p);
        setLatestSession(latest);
        setRecentSessions(allSessions.filter((s) => s.sourceType === "PREPOSITION").slice(0, 5));
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleStartPractice = async (prep: PrepositionContent) => {
    setLoadingQuestions(true);
    setSelectedPrep(prep);
    try {
      const qs = await aiPracticeService.generatePrepositionQuestions(prep.type);
      setQuestions(qs);
    } catch (e) {
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleStopPractice = () => {
    setSelectedPrep(null);
    setQuestions([]);
    loadDashboard(); // Refresh stats/recent sessions
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* 1. Header & Back Navigation Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {selectedPrep ? (
          <button
            onClick={handleStopPractice}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 bg-white hover:bg-indigo-50/30 px-2.5 py-1 rounded-lg transition-colors shadow-sm/30"
          >
            ← Change Topic
          </button>
        ) : (
          <Link
            to="/prepositions"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 bg-white hover:bg-indigo-50/30 px-2.5 py-1 rounded-lg transition-colors shadow-sm/30"
          >
            ← Back to Prepositions
          </Link>
        )}
        <Link
          to="/prepositions/report"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-600 hover:text-violet-700 border border-violet-100 bg-violet-50/20 px-2.5 py-1 rounded-lg transition-colors"
        >
          <FileSpreadsheet size={12} /> View Prepositions Report
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
            {selectedPrep ? `Practice Preposition: ${selectedPrep.name}` : "Prepositions Practice"}
          </h1>
          <Badge tone="violet" className="text-[9px] font-bold">
            Mock AI practice
          </Badge>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
          {selectedPrep
            ? "Submit answers below to get instant corrections under frontend practice mode."
            : "Select an English preposition (in, on, at, by) to start targeted quizzes and check your sentence accuracy."}
        </p>
      </div>

      {selectedPrep ? (
        <div className="space-y-4">
          {loadingQuestions ? (
            <Card className="p-8 text-center text-sm font-semibold text-slate-400">
              Generating questions in Frontend practice mode…
            </Card>
          ) : questions.length === 0 ? (
            <Card className="p-8 text-center text-sm font-semibold text-slate-400">
              Could not generate questions. Please pick another topic.
            </Card>
          ) : (
            <PracticeRunner
              sourceType="PREPOSITION"
              sourceId={selectedPrep.type}
              sourceTitle={`Preposition ${selectedPrep.name}`}
              questions={questions}
              practicedEvent="PREPOSITION_PRACTICED"
            />
          )}
        </div>
      ) : (
        <>
          {/* Resume latest preposition practice */}
          {latestSession ? (
            <Card className="border-violet-100 bg-violet-50/20 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <span className="rounded-xl bg-violet-600 p-2.5 text-white shadow-md shadow-violet-600/10">
                  <Dumbbell size={20} />
                </span>
                <div>
                  <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-2 py-0.5 rounded border border-violet-100">
                    Continue Practice
                  </span>
                  <h4 className="font-extrabold text-slate-800 mt-1 tracking-tight">
                    {latestSession.sourceTitle}
                  </h4>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                    Answered: {latestSession.answered} · Last Score: {latestSession.lastScore}%
                  </p>
                </div>
              </div>
              <Button
                onClick={() =>
                  handleStartPractice({
                    type: latestSession.sourceId,
                    name: latestSession.sourceTitle.replace("Preposition ", ""),
                  } as PrepositionContent)
                }
                className="bg-violet-600 hover:bg-violet-700 text-white inline-flex items-center gap-1"
              >
                Resume Practice <ArrowRight size={14} />
              </Button>
            </Card>
          ) : preps.length > 0 ? (
            <Card className="border-violet-100 bg-violet-50/20 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <span className="rounded-xl bg-violet-600 p-2.5 text-white shadow-md shadow-violet-600/10">
                  <Dumbbell size={20} />
                </span>
                <div>
                  <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-2 py-0.5 rounded border border-violet-100">
                    First Steps
                  </span>
                  <h4 className="font-extrabold text-slate-800 mt-1 tracking-tight">
                    Preposition IN
                  </h4>
                </div>
              </div>
              <Button
                onClick={() => handleStartPractice(preps.find((p) => p.type === "in") || preps[0])}
                className="bg-violet-600 hover:bg-violet-700 text-white inline-flex items-center gap-1"
              >
                Start IN Practice <ArrowRight size={14} />
              </Button>
            </Card>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            {/* Choose a Preposition */}
            <Card className="p-5 border border-slate-100/80 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
                Select a Word to Practice
              </h3>
              <div className="grid grid-cols-2 gap-2 max-h-[350px] overflow-y-auto pr-1">
                {preps.map((p) => (
                  <div
                    key={p.type}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/10 p-3 hover:bg-violet-50/5 hover:border-violet-100/50 transition-all duration-200"
                  >
                    <span className="text-xs font-bold text-slate-700">
                      {p.name}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartPractice(p)}
                      className="text-[10px] font-bold h-7 px-2 border-violet-100 text-violet-600 hover:bg-violet-50/50"
                    >
                      Practice
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Preposition Practice Sessions */}
            <Card className="p-5 border border-slate-100/80 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
                Recent Practice Sessions
              </h3>
              {recentSessions.length === 0 ? (
                <div className="py-8 text-center text-xs font-semibold text-slate-400">
                  No recent preposition practice sessions found. Start a preposition quiz to view logs here!
                </div>
              ) : (
                <ul className="space-y-3">
                  {recentSessions.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/20 p-3"
                    >
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-700 truncate">
                          {s.sourceTitle}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                          {s.answered} items · score {s.lastScore}%
                        </span>
                      </div>
                      <Badge tone={s.lastScore >= 80 ? "emerald" : "indigo"} className="text-[9px] font-bold shrink-0">
                        {s.lastScore >= 80 ? "Pass" : "Review"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
