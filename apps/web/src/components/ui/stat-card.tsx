import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: string;
  deltaDir?: "up" | "down" | "flat";
  accent?: boolean;
  icon?: ReactNode;
  className?: string;
  muted?: boolean;
}

export function StatCard({
  label,
  value,
  unit,
  delta,
  deltaDir = "flat",
  accent = false,
  icon,
  className,
  muted = false,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-[16px] flex flex-col gap-3 border shadow-[var(--shadow-sm)]",
        accent
          ? "bg-[var(--bg-inverse)] border-transparent text-white px-5 py-[18px]"
          : "bg-card border-[var(--border-subtle)] px-5 py-[18px]",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-[11px] font-bold uppercase tracking-[0.08em]",
            accent ? "text-white/55" : "text-[var(--text-tertiary)]",
          )}
        >
          {label}
        </span>
        {icon && (
          <span className={cn("flex", accent ? "text-white/60" : "text-[var(--text-tertiary)]")}>
            {icon}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-display font-bold tracking-tight tabular-nums",
            accent ? "text-[40px] leading-none text-white" : "text-[36px] leading-none",
            !accent && (muted ? "text-[var(--text-tertiary)]" : "text-foreground"),
          )}
        >
          {value}
        </span>
        {unit && (
          <span
            className={cn(
              "font-display font-semibold text-[18px]",
              accent ? "text-white/65" : "text-[var(--text-secondary)]",
            )}
          >
            {unit}
          </span>
        )}
      </div>

      {delta && (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-semibold",
            accent
              ? "text-white/70"
              : deltaDir === "up"
                ? "text-[var(--status-complete)]"
                : deltaDir === "down"
                  ? "text-[var(--status-danger)]"
                  : "text-[var(--text-tertiary)]",
          )}
        >
          {deltaDir === "up" ? "▲" : deltaDir === "down" ? "▼" : "·"}{" "}
          {delta}
        </span>
      )}
    </div>
  );
}
