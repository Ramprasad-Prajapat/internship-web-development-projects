import { useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import learningService from "../services/mockLearningService";

const TOPICS = [
  {
    title: "am / is / are + verb-ing",
    examples: ["I am going.", "You are going.", "He is going."],
  },
  {
    title: "do / does (present simple)",
    examples: ["I do my work.", "She does her work.", "Do you like tea?"],
  },
  {
    title: "a / an / the (articles)",
    examples: ["a book", "an apple", "the market"],
  },
];

interface Quiz {
  question: string;
  options: string[];
  answer: number;
}

const QUIZ: Quiz[] = [
  {
    question: "I ___ going to school.",
    options: ["am", "is", "are"],
    answer: 0,
  },
  {
    question: "She ___ a doctor.",
    options: ["am", "is", "are"],
    answer: 1,
  },
  {
    question: "I want to eat ___ apple.",
    options: ["a", "an", "the"],
    answer: 1,
  },
];

export default function Grammar() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = QUIZ.reduce(
    (sum, q, i) => sum + (answers[i] === q.answer ? 1 : 0),
    0,
  );

  const submit = async () => {
    setSubmitted(true);
    await learningService.incrementCount("grammar");
  };

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Grammar practice</h1>
        <p className="mt-1 text-slate-500">
          Learn one small topic, then try the quick quiz.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((t) => (
          <Card key={t.title}>
            <h3 className="font-semibold text-slate-800">{t.title}</h3>
            <ul className="mt-2 space-y-1">
              {t.examples.map((ex) => (
                <li
                  key={ex}
                  className="rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-600"
                >
                  {ex}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Quick quiz</h3>
          {submitted && (
            <Badge tone={score === QUIZ.length ? "emerald" : "amber"}>
              Score: {score}/{QUIZ.length}
            </Badge>
          )}
        </div>

        <div className="space-y-5">
          {QUIZ.map((q, qi) => (
            <div key={q.question}>
              <p className="mb-2 font-medium text-slate-700">
                {qi + 1}. {q.question}
              </p>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt, oi) => {
                  const chosen = answers[qi] === oi;
                  const correct = submitted && oi === q.answer;
                  const wrong = submitted && chosen && oi !== q.answer;
                  return (
                    <button
                      key={opt}
                      disabled={submitted}
                      onClick={() => setAnswers({ ...answers, [qi]: oi })}
                      className={[
                        "inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm transition-colors",
                        correct
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : wrong
                            ? "border-rose-300 bg-rose-50 text-rose-700"
                            : chosen
                              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {correct && <CheckCircle2 size={14} />}
                      {wrong && <XCircle size={14} />}
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          {!submitted ? (
            <Button
              onClick={submit}
              disabled={Object.keys(answers).length < QUIZ.length}
            >
              Check answers
            </Button>
          ) : (
            <Button variant="outline" onClick={reset}>
              <RotateCcw size={16} /> Try again
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
