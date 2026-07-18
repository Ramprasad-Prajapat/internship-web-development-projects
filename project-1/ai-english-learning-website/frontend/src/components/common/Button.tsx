import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] transition-all duration-200 shadow-sm focus:ring-indigo-500/20",
  secondary: "bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] transition-all duration-200 shadow-sm focus:ring-emerald-500/20",
  outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] transition-all duration-200 shadow-sm focus:ring-slate-500/20",
  ghost: "text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] transition-all duration-200 focus:ring-slate-500/10",
  danger: "bg-rose-500 text-white hover:bg-rose-600 active:scale-[0.98] transition-all duration-200 shadow-sm focus:ring-rose-500/20",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs font-semibold",
  md: "px-4 py-2 text-sm font-semibold",
  lg: "px-5 py-2.5 text-base font-semibold",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl font-medium focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
