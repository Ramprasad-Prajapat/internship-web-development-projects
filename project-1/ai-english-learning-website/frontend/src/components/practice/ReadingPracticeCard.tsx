import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";

/** Promo / entry card for the Reading page. */
export function ReadingPracticeCard() {
  return (
    <Card className="flex flex-col">
      <div className="mb-3 inline-flex w-fit rounded-xl bg-emerald-100 p-2.5 text-emerald-600">
        <BookOpen size={22} />
      </div>
      <h3 className="font-semibold text-slate-800">Reading</h3>
      <p className="mt-1 flex-1 text-sm text-slate-500">
        Read a short paragraph aloud and learn new words.
      </p>
      <Link to="/reading" className="mt-4">
        <Button size="sm" variant="outline" fullWidth>
          Practice reading
        </Button>
      </Link>
    </Card>
  );
}

export default ReadingPracticeCard;
