import { useEffect, useRef, useState } from "react";
import {
  Info,
  Mic,
  RefreshCw,
  Save,
  Square,
  Volume2,
} from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import learningService from "../services/mockLearningService";

const QUESTIONS = [
  "Tell me about yourself.",
  "What did you do today?",
  "Describe your daily routine.",
  "Tell me about your family.",
  "What is your favourite food and why?",
  "What are your future goals?",
];

interface Feedback {
  text: string;
  score: number;
}

// Browser SpeechRecognition is not in TS DOM types by default — use a loose type.
function createRecognition(): any {
  const w = window as unknown as {
    SpeechRecognition?: new () => unknown;
    webkitSpeechRecognition?: new () => unknown;
  };
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR() as any;
  r.lang = "en-US";
  r.interimResults = true;
  r.continuous = false;
  return r;
}

function speak(text: string) {
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export default function Speaking() {
  const [qIndex, setQIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [saved, setSaved] = useState(false);
  const recognitionRef = useRef<any>(null);

  const supported =
    typeof window !== "undefined" &&
    !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );

  const question = QUESTIONS[qIndex];

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const startListening = () => {
    const r = createRecognition();
    if (!r) return;
    recognitionRef.current = r;
    setFeedback(null);
    setSaved(false);
    r.onresult = (event: any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
    setListening(true);
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {
      /* ignore */
    }
    setListening(false);
  };

  const analyze = () => {
    const words = transcript.trim().split(/\s+/).filter(Boolean).length;
    const score = Math.max(40, Math.min(95, 45 + words * 6));
    const text =
      words < 5
        ? "Good start! Try to speak two or three more sentences next time."
        : "Nice! You spoke clearly. Keep practicing to make it smoother.";
    setFeedback({ text, score });
  };

  const save = async () => {
    if (!transcript.trim()) return;
    await learningService.saveSpeaking({
      question,
      transcript: transcript.trim(),
      feedback: feedback?.text ?? "",
      score: feedback?.score ?? 0,
    });
    setSaved(true);
  };

  const nextQuestion = () => {
    setQIndex((i) => (i + 1) % QUESTIONS.length);
    setTranscript("");
    setFeedback(null);
    setSaved(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Speaking practice</h1>
        <p className="mt-1 text-slate-500">
          Read the question, then speak your answer out loud.
        </p>
      </div>

      {/* Question */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase text-indigo-500">
              Question {qIndex + 1} of {QUESTIONS.length}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-800">
              {question}
            </p>
          </div>
          <button
            onClick={() => speak(question)}
            title="Listen to the question"
            className="rounded-full p-2 text-indigo-500 hover:bg-indigo-50"
          >
            <Volume2 size={18} />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {supported ? (
            listening ? (
              <Button variant="danger" onClick={stopListening}>
                <Square size={16} /> Stop
              </Button>
            ) : (
              <Button onClick={startListening}>
                <Mic size={16} /> Start speaking
              </Button>
            )
          ) : null}
          <Button variant="outline" onClick={nextQuestion}>
            <RefreshCw size={16} /> Next question
          </Button>
        </div>

        {!supported && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <Info size={16} className="mt-0.5 shrink-0" />
            Voice input is not supported in this browser. Please use Chrome, or
            just type your answer below.
          </p>
        )}
      </Card>

      {/* Transcript / typing fallback */}
      <Card>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Your answer {supported && "(speak or type)"}
        </label>
        <textarea
          value={transcript}
          onChange={(e) => {
            setTranscript(e.target.value);
            setSaved(false);
          }}
          rows={4}
          placeholder="Your spoken words will appear here. You can also type."
          className="input-base resize-none"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={analyze}
            disabled={!transcript.trim()}
          >
            Get feedback
          </Button>
          <Button onClick={save} disabled={!transcript.trim() || saved}>
            <Save size={16} /> {saved ? "Saved" : "Save practice"}
          </Button>
        </div>
      </Card>

      {/* Feedback */}
      {feedback && (
        <Card className="border-emerald-100 bg-emerald-50/50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Feedback</h3>
            <Badge tone="emerald">Score: {feedback.score}/100</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-600">{feedback.text}</p>
          <button
            onClick={() => speak(transcript)}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
          >
            <Volume2 size={15} /> Hear your answer
          </button>
        </Card>
      )}
    </div>
  );
}
