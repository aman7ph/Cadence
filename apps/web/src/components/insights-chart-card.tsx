import type { ReactNode } from "react";

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

export const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// `computeEMA` moved to @cadence/shared — mobile had an identical copy.
// Re-exported so the chart importing it from here keeps working.
export { computeEMA } from "@cadence/shared";

export function numFmt(v: unknown): number {
  return typeof v === "number" ? v : 0;
}

// `granularityLabel` moved to @cadence/shared in Step 11. The version here
// returned "7-day rolling" for daily granularity and was hung on two charts
// that plot plain per-day counts. The rolling chart now labels itself with
// `rollingWindowLabel`, which is built from the window constant it actually uses.
export { granularityLabel } from "@cadence/shared";

export const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "12px",
  boxShadow: "var(--shadow-md)",
  fontSize: "12px",
  color: "var(--foreground)",
};

export const axisStyle = {
  fill: "var(--text-tertiary)",
  fontSize: 11,
} as const;

export function ChartCard({
  title,
  subtitle,
  label,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col gap-3 rounded-lg border border-[var(--border-subtle)] bg-card p-5 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-[13.5px] font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">
              {subtitle}
            </p>
          )}
        </div>
        {label && (
          <span className="font-display text-[10px] uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
            {label}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * A sunken track with a gold fill — the bar every ranked list on Insights uses.
 *
 * Size is the caller's (`h-[5px] w-[70px]`, `h-[9px] flex-1`), because that is
 * the only thing the instances legitimately disagree about; the two colours and
 * the pill radius are fixed so a bar cannot drift off the token layer.
 */
export function Meter({
  percent,
  className = "",
}: {
  percent: number;
  className?: string;
}) {
  return (
    <span
      className={`overflow-hidden rounded-pill bg-[var(--bg-sunken)] ${className}`}
    >
      <span
        className="block h-full rounded-pill bg-[var(--action-primary)]"
        style={{ width: `${percent}%` }}
      />
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
      {children}
    </div>
  );
}

export function Loading() {
  return <Empty>Loading…</Empty>;
}
