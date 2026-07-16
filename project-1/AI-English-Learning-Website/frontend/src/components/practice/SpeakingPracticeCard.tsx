import { Link } from "react-router-dom";
import { Mic } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";

/** Promo / entry card for the Speaking page. */
export function SpeakingPracticeCard() {
  return (
    <Card className="flex flex-col">
      <div className="mb-3 inline-flex w-fit rounded-xl bg-indigo-100 p-2.5 text-indigo-600">
        <Mic size={22} />
      </div>
      <h3 className="font-semibold text-slate-800">Speaking</h3>
      <p className="mt-1 flex-1 text-sm text-slate-500">
        Answer simple questions out loud and build confidence.
      </p>
      <Link to="/speaking" className="mt-4">
        <Button size="sm" fullWidth>
          Practice speaking
        </Button>
      </Link>
    </Card>
  );
}

export default SpeakingPracticeCard;
