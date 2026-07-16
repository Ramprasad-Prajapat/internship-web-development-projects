import { useState } from "react";
import { BookOpen, CheckCircle2, Volume2 } from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import learningService from "../services/mockLearningService";

const PARAGRAPH = {
  title: "My Morning",
  text: "I wake up early in the morning. I brush my teeth and drink a glass of water. Then I go for a short walk in the park. After the walk, I feel fresh and ready for the day.",
  hardWords: [
    { word: "early", meaning: "before the usual time — jaldi" },
    { word: "brush", meaning: "to clean with a brush — saaf karna" },
    { word: "fresh", meaning: "full of energy — taroataaza" },
  ],
  questions: [
    "When does the writer wake up?",
    "What does the writer do in the park?",
    "How does the writer feel after the walk?",
  ],
};

function speak(text: string) {
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export default function Reading() {
  const [done, setDone] = useState(false);

  const finish = async () => {
    await learningService.saveReading({ title: PARAGRAPH.title, accuracy: 90 });
    setDone(true);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reading practice</h1>
        <p className="mt-1 text-slate-500">
          Read the paragraph aloud slowly and clearly.
        </p>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-slate-800">
            <BookOpen size={18} className="text-emerald-500" />
            {PARAGRAPH.title}
          </h3>
          <button
            onClick={() => speak(PARAGRAPH.text)}
            title="Listen to the paragraph"
            className="rounded-full p-2 text-indigo-500 hover:bg-indigo-50"
          >
            <Volume2 size={18} />
          </button>
        </div>
        <p className="text-lg leading-relaxed text-slate-700">
          {PARAGRAPH.text}
        </p>
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold text-slate-800">Hard words</h3>
        <ul className="space-y-2">
          {PARAGRAPH.hardWords.map((w) => (
            <li key={w.word} className="flex items-center gap-3">
              <Badge tone="sky">{w.word}</Badge>
              <span className="text-sm text-slate-600">{w.meaning}</span>
              <button
                onClick={() => speak(w.word)}
                className="ml-auto rounded-full p-1 text-indigo-500 hover:bg-indigo-50"
              >
                <Volume2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold text-slate-800">Simple questions</h3>
        <ol className="list-decimal space-y-2 pl-5 text-slate-700">
          {PARAGRAPH.questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-slate-400">
          Try to answer these out loud after reading.
        </p>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={finish} disabled={done}>
          <CheckCircle2 size={16} />
          {done ? "Saved" : "Save reading session"}
        </Button>
        {done && (
          <span className="text-sm font-medium text-emerald-600">
            Great reading! Session saved. 🎉
          </span>
        )}
      </div>
    </div>
  );
}
