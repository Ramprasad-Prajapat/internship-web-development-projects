import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Dumbbell } from "lucide-react";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingState from "../components/common/LoadingState";
import PracticeRunner from "../components/practice/PracticeRunner";
import prepositionService from "../services/prepositionService";
import aiPracticeService from "../services/aiPracticeService";
import type { Question } from "../types/ai.types";

export default function PrepositionPractice() {
  const { type } = useParams<{ type: string }>();
  const [name, setName] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoaded(false);
    setNotFound(false);
    (async () => {
      if (!type) {
        if (active) {
          setNotFound(true);
          setLoaded(true);
        }
        return;
      }
      const content = await prepositionService.getPreposition(type);
      if (!content) {
        if (active) {
          setNotFound(true);
          setLoaded(true);
        }
        return;
      }
      const qs = await aiPracticeService.generatePrepositionQuestions(type);
      if (!active) return;
      setName(content.name);
      setQuestions(qs);
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [type]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        to="/prepositions"
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 bg-white hover:bg-indigo-50/30 px-2.5 py-1 rounded-lg transition-colors shadow-sm/30"
      >
        <ArrowLeft size={12} /> Back to Prepositions
      </Link>

      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-violet-100 p-2 text-violet-700">
          <Dumbbell size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Preposition practice</h1>
          {name && <p className="text-sm text-slate-500">Using “{name}”</p>}
        </div>
      </div>

      {!loaded ? (
        <LoadingState message="Preparing your practice questions…" />
      ) : notFound ? (
        <Card>
          <EmptyState
            title="Preposition not found"
            message="Pick a preposition from the list to practice."
            action={
              <Link
                to="/prepositions"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                Back to Prepositions
              </Link>
            }
          />
        </Card>
      ) : questions.length === 0 ? (
        <Card>
          <EmptyState
            title="No questions to practice"
            message="We couldn't build questions for this preposition."
          />
        </Card>
      ) : (
        <PracticeRunner
          sourceType="PREPOSITION"
          sourceId={type!}
          sourceTitle={`Preposition ${name}`}
          questions={questions}
          practicedEvent="PREPOSITION_PRACTICED"
        />
      )}
    </div>
  );
}
