import { useCallback, useEffect, useRef, useState } from "react";
import QuestionPracticeCard from "./QuestionPracticeCard";
import PracticeSummaryCard from "./PracticeSummaryCard";
import aiPracticeService from "../../services/aiPracticeService";
import mistakeService from "../../services/mistakeService";
import historyService from "../../services/historyService";
import type {
  AnswerCheckResult,
  PracticeSourceType,
  PracticeSummary,
  Question,
} from "../../types/ai.types";
import type { HistoryEventType } from "../../types/history.types";

interface PracticeRunnerProps {
  sourceType: PracticeSourceType;
  sourceId: string;
  sourceTitle: string;
  questions: Question[];
  /** DAILY_LESSON_PRACTICED or PREPOSITION_PRACTICED. */
  practicedEvent: HistoryEventType;
}

/**
 * Shared practice engine for Daily Lessons and Prepositions. Owns per-question
 * answer/result/saved state, the running summary, and all history logging.
 *
 * History is added ONLY on user actions (check / save) plus a single
 * "questions generated" entry on mount — ref guards stop StrictMode and any
 * re-render from logging twice.
 */
export function PracticeRunner({
  sourceType,
  sourceId,
  sourceTitle,
  questions,
  practicedEvent,
}: PracticeRunnerProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, AnswerCheckResult>>({});
  const [savedMistakes, setSavedMistakes] = useState<Record<string, boolean>>({});
  const [checking, setChecking] = useState<Record<string, boolean>>({});
  const [summary, setSummary] = useState<PracticeSummary | null>(null);

  const lessonId = sourceType === "DAILY_LESSON" ? sourceId : null;

  const refreshSummary = useCallback(async () => {
    setSummary(await aiPracticeService.getPracticeSummary(sourceType, sourceId));
  }, [sourceType, sourceId]);

  // One "questions generated" history entry per practice open (ref-guarded).
  const genLoggedRef = useRef<string | null>(null);
  useEffect(() => {
    void refreshSummary();
    if (questions.length === 0) return;
    if (genLoggedRef.current === sourceId) return;
    genLoggedRef.current = sourceId;
    void historyService.addEntry({
      type: "QUESTIONS_GENERATED",
      title: `Started practice: ${sourceTitle}`,
      description: `${questions.length} practice questions generated`,
      sourceType,
      sourceId,
      lessonId,
    });
  }, [questions.length, sourceId, sourceType, sourceTitle, lessonId, refreshSummary]);

  // One "practiced" entry per session, on the first checked answer.
  const practicedLoggedRef = useRef<string | null>(null);
  const logPracticedOnce = () => {
    if (practicedLoggedRef.current === sourceId) return;
    practicedLoggedRef.current = sourceId;
    void historyService.addEntry({
      type: practicedEvent,
      title: `Practiced ${sourceTitle}`,
      description: "Answered a practice question",
      sourceType,
      sourceId,
      lessonId,
    });
  };

  const onCheck = async (question: Question) => {
    const userAnswer = answers[question.id] ?? "";
    if (!userAnswer.trim()) return;
    if (checking[question.id]) return; // ignore rapid double-clicks
    setChecking((c) => ({ ...c, [question.id]: true }));
    const result = await aiPracticeService.checkAnswer({
      sourceType,
      sourceId,
      questionText: question.questionText,
      sampleAnswer: question.sampleAnswer,
      userAnswer,
    });
    setResults((r) => ({ ...r, [question.id]: result }));
    setChecking((c) => ({ ...c, [question.id]: false }));

    await aiPracticeService.saveAnswer({
      questionId: question.id,
      sourceType,
      sourceId,
      sourceTitle,
      questionText: question.questionText,
      userAnswer,
      result,
    });

    void historyService.addEntry({
      type: "ANSWER_CHECKED",
      title: `Checked an answer`,
      description: question.questionText,
      sourceType,
      sourceId,
      lessonId,
    });
    logPracticedOnce();
    await refreshSummary();
  };

  const onSaveMistake = async (question: Question) => {
    const result = results[question.id];
    if (!result || result.isCorrect || !result.correctSentence) return;
    await mistakeService.saveMistake({
      sourceType,
      sourceId,
      sourceTitle,
      wrongSentence: result.wrongSentence || (answers[question.id] ?? ""),
      correctSentence: result.correctSentence,
      simpleRule: result.simpleRule,
      mistakeType: "grammar",
    });
    setSavedMistakes((s) => ({ ...s, [question.id]: true }));
    void historyService.addEntry({
      type: "MISTAKE_SAVED",
      title: `Saved a mistake`,
      description: result.correctSentence,
      sourceType,
      sourceId,
      lessonId,
    });
    await refreshSummary();
  };

  return (
    <div className="space-y-4">
      {summary && <PracticeSummaryCard summary={summary} />}
      {questions.map((question, i) => (
        <QuestionPracticeCard
          key={question.id}
          question={question}
          number={i + 1}
          total={questions.length}
          value={answers[question.id] ?? ""}
          onChange={(value) =>
            setAnswers((a) => ({ ...a, [question.id]: value }))
          }
          onCheck={() => onCheck(question)}
          checking={checking[question.id]}
          result={results[question.id] ?? null}
          onSaveMistake={() => onSaveMistake(question)}
          mistakeSaved={savedMistakes[question.id]}
        />
      ))}
    </div>
  );
}

export default PracticeRunner;
