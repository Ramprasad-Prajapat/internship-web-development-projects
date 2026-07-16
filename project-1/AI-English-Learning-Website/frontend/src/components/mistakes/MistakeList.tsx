import MistakeCard from "./MistakeCard";
import type { Mistake } from "../../types/mistake.types";

interface MistakeListProps {
  mistakes: Mistake[];
  onRepeat: (mistake: Mistake) => void;
  onDelete?: (id: string) => void;
}

/** Simple vertical list of mistake cards. Empty/loading states live in the page. */
export function MistakeList({ mistakes, onRepeat, onDelete }: MistakeListProps) {
  return (
    <div className="space-y-3">
      {mistakes.map((mistake) => (
        <MistakeCard
          key={mistake.id}
          mistake={mistake}
          onRepeat={onRepeat}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default MistakeList;
