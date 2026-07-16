import { Link } from "react-router-dom";
import { PenLine } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";

/** Promo / entry card for the Writing page. */
export function WritingPracticeCard() {
  return (
    <Card className="flex flex-col">
      <div className="mb-3 inline-flex w-fit rounded-xl bg-violet-100 p-2.5 text-violet-600">
        <PenLine size={22} />
      </div>
      <h3 className="font-semibold text-slate-800">Writing</h3>
      <p className="mt-1 flex-1 text-sm text-slate-500">
        Write sentences and get a simple, beginner-friendly correction.
      </p>
      <Link to="/writing" className="mt-4">
        <Button size="sm" variant="secondary" fullWidth>
          Practice writing
        </Button>
      </Link>
    </Card>
  );
}

export default WritingPracticeCard;
