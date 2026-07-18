interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  /** Tailwind text-color class applied to the progress arc (uses currentColor). */
  color?: string;
  label?: string;
}

/** Simple circular progress indicator drawn with SVG (no chart library). */
export function ProgressRing({
  value,
  size = 72,
  stroke = 8,
  color = "text-indigo-600",
  label,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={color}
        />
      </svg>
      <span className="absolute text-sm font-semibold text-slate-700">
        {label ?? `${Math.round(clamped)}%`}
      </span>
    </div>
  );
}

export default ProgressRing;
