interface ReportPeriodFilterProps {
  value: string;
  onChange: (val: string) => void;
}

export function ReportPeriodFilter({ value, onChange }: ReportPeriodFilterProps) {
  const options = [
    { key: "today", label: "Today" },
    { key: "last-7-days", label: "Last 7 Days" },
    { key: "this-month", label: "This Month" },
    { key: "all-time", label: "All Time" },
  ];

  return (
    <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-100 bg-slate-50/50 p-1">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
            value === opt.key
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default ReportPeriodFilter;
