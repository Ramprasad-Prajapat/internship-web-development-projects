import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 mb-6 animate-fade-in",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm font-medium text-slate-500 sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 sm:mt-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
