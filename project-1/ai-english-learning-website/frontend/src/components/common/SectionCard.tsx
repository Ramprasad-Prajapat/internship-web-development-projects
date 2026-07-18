import type { ReactNode } from "react";
import Card from "./Card";
import { cn } from "../../utils/cn";

interface SectionCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: SectionCardProps) {
  return (
    <Card className={cn("p-6 border border-slate-100/80 shadow-sm", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100/80 pb-4 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight sm:text-lg">
            {title}
          </h2>
          {description && (
            <p className="text-xs font-normal text-slate-500 mt-0.5">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:mt-0">
            {actions}
          </div>
        )}
      </div>
      <div>{children}</div>
    </Card>
  );
}

export default SectionCard;
