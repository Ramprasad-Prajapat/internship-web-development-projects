import React from "react";
import Card from "../common/Card";
import Badge from "../common/Badge";

interface NotebookToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

export default function NotebookToolCard({ title, description, icon, active, onClick }: NotebookToolCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`p-4 border cursor-pointer transition-all duration-200 flex items-start gap-3.5 select-none ${
        active
          ? "border-indigo-600 bg-indigo-50/10 shadow-sm"
          : "border-slate-100 bg-white hover:border-indigo-100 hover:shadow-sm"
      }`}
    >
      <div className={`p-2.5 rounded-xl border ${
        active
          ? "bg-indigo-50 border-indigo-100 text-indigo-600 shadow-sm/50"
          : "bg-slate-50 border-slate-200/40 text-slate-500"
      } shrink-0`}>
        {icon}
      </div>

      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-extrabold text-slate-800 text-xs tracking-tight truncate">
            {title}
          </h4>
          <Badge tone={active ? "indigo" : "slate"} className="text-[8px] font-extrabold px-1 tracking-wider uppercase">
            Mock AI
          </Badge>
        </div>
        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>
    </Card>
  );
}
