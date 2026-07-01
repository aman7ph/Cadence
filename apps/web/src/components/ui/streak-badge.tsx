import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  count: number;
  size?: "sm" | "md" | "lg";
  active?: boolean;
  className?: string;
}

const sizes = {
  sm: { h: "h-7", text: "text-xs", icon: 12, gap: "gap-1", pad: "px-2.5" },
  md: { h: "h-9", text: "text-sm", icon: 16, gap: "gap-1.5", pad: "px-3" },
  lg: { h: "h-11", text: "text-base", icon: 20, gap: "gap-2", pad: "px-4" },
} as const;

export function StreakBadge({
  count,
  size = "sm",
  active = true,
  className,
}: StreakBadgeProps) {
  const s = sizes[size];
  const cold = count === 0 || !active;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-display font-bold tracking-tight tabular-nums",
        s.h,
        s.text,
        s.gap,
        s.pad,
        cold
          ? "bg-[var(--surface-active)] text-[var(--text-tertiary)]"
          : "bg-[var(--green-100)] text-[var(--green-700)] dark:bg-[rgba(43,168,74,0.18)] dark:text-[var(--green-500)]",
        className,
      )}
    >
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 24 24"
        fill={cold ? "var(--text-tertiary)" : "currentColor"}
        aria-hidden="true"
      >
        <path d="M12 2c1 3-1 4.5-2.5 6.5C8 10.5 7 12 7 14a5 5 0 0 0 10 0c0-1.8-.9-3.4-2-4.8.3 1.2-.2 2.3-1 2.8.6-3-1-5.5-2-10z" />
      </svg>
      <span className="font-mono">{count}</span>
    </span>
  );
}
