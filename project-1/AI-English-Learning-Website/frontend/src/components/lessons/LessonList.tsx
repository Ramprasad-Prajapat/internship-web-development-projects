import LessonCard from "./LessonCard";
import type { Lesson } from "../../types/lesson.types";

interface LessonListProps {
  lessons: Lesson[];
  onDelete?: (id: string) => void;
}

/** Responsive grid of lesson cards (presentational). */
export function LessonList({ lessons, onDelete }: LessonListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {lessons.map((lesson) => (
        <LessonCard key={lesson.id} lesson={lesson} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default LessonList;
