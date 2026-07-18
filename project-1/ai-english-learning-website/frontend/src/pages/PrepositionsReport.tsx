import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  CalendarDays,
  Dumbbell,
  AlertTriangle,
  Printer,
  Copy,
  CheckCircle,
  Shapes,
} from "lucide-react";
import ReportPeriodFilter from "../components/reports/ReportPeriodFilter";
import ReportSummaryCard from "../components/reports/ReportSummaryCard";
import reportService, { type PrepositionsReport } from "../services/reportService";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";

export default function PrepositionsReportView() {
  const [period, setPeriod] = useState("all-time");
  const [report, setReport] = useState<PrepositionsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    reportService
      .getPrepositionsReport(period)
      .then((rep) => {
        setReport(rep);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [period]);

  const onCopy = () => {
    if (!report) return;
    const text = `Prepositions Learning Report
Period: ${period.toUpperCase()}
----------------------------------
Prepositions Viewed: ${report.prepositionsViewed}
Prepositions Practiced: ${report.prepositionsPracticed}
Questions Answered: ${report.questionsAnswered}
Mistakes Tracked: ${report.mistakesSaved}
Strong Prepositions: ${report.strongPrepositions.join(", ") || "None yet"}
Weak Prepositions: ${report.weakPrepositions.join(", ") || "None yet"}
Suggested Next Preposition: ${report.suggestedNextPreposition}
----------------------------------
Generated from English Daily Website.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/prepositions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={13} /> Back to Prepositions Module
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
            Prepositions Report
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onCopy}
            className="inline-flex items-center gap-1.5 text-xs h-9 font-bold"
          >
            {copied ? (
              <>
                <CheckCircle size={14} className="text-emerald-600" /> Copied!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy Report
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 text-xs h-9 font-bold"
          >
            <Printer size={14} /> Print
          </Button>
        </div>
      </div>

      {/* Filter and disclaimer */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <ReportPeriodFilter value={period} onChange={setPeriod} />
        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
          Separated Prepositions Analytics Only
        </span>
      </div>

      {loading || !report ? (
        <div className="py-20 text-center text-xs font-semibold text-slate-400">
          Generating Prepositions Analytics Report...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Cards grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ReportSummaryCard
              title="Prepositions Viewed"
              value={report.prepositionsViewed}
              description="Detail pages read"
              icon={<Shapes size={18} />}
            />
            <ReportSummaryCard
              title="Prepositions Practiced"
              value={report.prepositionsPracticed}
              description="Completed sessions"
              icon={<CalendarDays size={18} />}
            />
            <ReportSummaryCard
              title="Questions Answered"
              value={report.questionsAnswered}
              description="Mock AI sentences checked"
              icon={<Dumbbell size={18} />}
            />
            <ReportSummaryCard
              title="Mistakes Tracked"
              value={report.mistakesSaved}
              description="Errors saved from practice"
              icon={<AlertTriangle size={18} className="text-rose-500" />}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Analysis details */}
            <Card className="p-5 border border-slate-100/80 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
                Detailed Analysis
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Strong Prepositions
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600 block mt-1">
                      {report.strongPrepositions.join(", ") || "None yet"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Weak Prepositions
                    </span>
                    <span className="text-xs font-extrabold text-rose-500 block mt-1">
                      {report.weakPrepositions.join(", ") || "None yet"}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-violet-50/10 rounded-xl border border-violet-100/40">
                  <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider block">
                    Recommended Study Action
                  </span>
                  <span className="text-xs font-bold text-slate-700 block mt-1 leading-relaxed">
                    Practice preposition <span className="text-violet-600 font-extrabold">{report.suggestedNextPreposition}</span> next.
                  </span>
                </div>
              </div>
            </Card>

            {/* Recent Activity history list */}
            <Card className="p-5 border border-slate-100/80 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
                Recent Module Logs
              </h3>
              {report.recentActivity.length === 0 ? (
                <div className="py-8 text-center text-xs font-semibold text-slate-400">
                  No activity logged within the selected period.
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {report.recentActivity.map((act) => (
                    <li
                      key={act.id}
                      className="flex items-center justify-between gap-3 border-b border-slate-50 pb-2.5 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-700 truncate">
                          {act.title}
                        </span>
                        {act.description && (
                          <span className="block text-[10px] text-slate-400 font-semibold mt-0.5 truncate">
                            {act.description}
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-[9px] font-bold text-slate-400">
                        {new Date(act.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
