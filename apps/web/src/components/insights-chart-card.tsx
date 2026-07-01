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

export function computeEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const alpha = 2 / (period + 1);
  const ema: number[] = [values[0] as number];
  for (let i = 1; i < values.length; i++) {
    ema.push((values[i] as number) * alpha + (ema[i - 1] as number) * (1 - alpha));
  }
  return ema;
}

export function numFmt(v: unknown): number {
  return typeof v === "number" ? v : 0;
}

export function granularityLabel(g: string): string {
  if (g === "weekly") return "weekly buckets";
  if (g === "monthly") return "monthly buckets";
  return "7-day rolling";
}

export const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "10px",
  boxShadow: "var(--shadow-md)",
  fontSize: "12px",
  color: "var(--foreground)",
};

export const axisStyle = { fill: "var(--text-tertiary)", fontSize: 11 } as const;

export function ChartCard({
  title,
  label,
  children,
  className = "",
}: {
  title: string;
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex flex-col gap-3 rounded-[16px] border border-[var(--border-subtle)] bg-card p-5 shadow-[var(--shadow-sm)] ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h3>
        {label && (
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">{label}</span>
        )}
      </div>
      {children}
    </section>
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
