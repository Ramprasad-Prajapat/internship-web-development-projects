import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Plus } from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import learningService from "../services/mockLearningService";
import type { HomeworkTask } from "../types/learning.types";

export default function Homework() {
  const [tasks, setTasks] = useState<HomeworkTask[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    learningService.listHomework().then(setTasks);
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setTasks(await learningService.addHomework(title));
    setTitle("");
  };

  const toggle = async (id: string) =>
    setTasks(await learningService.toggleHomework(id));

  const done = tasks.filter((t) => t.done).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Homework</h1>
        <p className="mt-1 text-slate-500">
          Finish today's tasks to keep your streak going.
        </p>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Today's homework</h3>
          <Badge tone={done === tasks.length && tasks.length > 0 ? "emerald" : "slate"}>
            {done}/{tasks.length} done
          </Badge>
        </div>

        <ul className="space-y-1.5">
          {tasks.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => toggle(t.id)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-50"
              >
                {t.done ? (
                  <CheckCircle2 className="shrink-0 text-emerald-500" size={20} />
                ) : (
                  <Circle className="shrink-0 text-slate-300" size={20} />
                )}
                <span
                  className={
                    t.done ? "text-slate-400 line-through" : "text-slate-700"
                  }
                >
                  {t.title}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={add} className="mt-4 flex gap-2">
          <input
            className="input-base"
            placeholder="Add a new task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button type="submit" disabled={!title.trim()}>
            <Plus size={16} /> Add
          </Button>
        </form>
      </Card>
    </div>
  );
}
