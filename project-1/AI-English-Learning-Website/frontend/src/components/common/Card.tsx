import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverable?: boolean;
}

/** Rounded white surface with a soft shadow — the base block of every page. */
export function Card({ className, children, hoverable, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-100/80 bg-white p-5 shadow-card transition-all duration-300",
        hoverable && "hover:-translate-y-0.5 hover:shadow-card-hover hover:border-slate-200/50 cursor-pointer",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
