import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { addDays, todayLocal } from "@cadence/shared";

const WINDOW_DAYS = 30;
const VIEWBOX_W = 300;
const VIEWBOX_H = 60;
const PAD_X = 4;
const PAD_Y = 6;

function pointsFor(
  rows: ReadonlyArray<{ date: string; productivityScore: number }>,
  from: string,
): { d: string; circles: Array<{ cx: number; cy: number; key: string }> } | null {
  if (rows.length === 0) return null;
  // Map every row to an (x, y) in the viewBox. x = days-since-from / WINDOW * width.
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const usable = VIEWBOX_W - PAD_X * 2;
  const usableH = VIEWBOX_H - PAD_Y * 2;
  const xy = sorted.map((r) => {
    const daysSinceFrom = daysBetween(from, r.date);
    const x = PAD_X + (daysSinceFrom / (WINDOW_DAYS - 1)) * usable;
    const y = PAD_Y + (1 - r.productivityScore / 100) * usableH;
    return { x, y, key: r.date };
  });
  const d = xy
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");
  const circles = xy.map((p) => ({ cx: p.x, cy: p.y, key: p.key }));
  return { d, circles };
}

function daysBetween(from: string, to: string): number {
  // Both YYYY-MM-DD; UTC subtraction is safe because date-only.
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const f = Date.UTC(fy!, fm! - 1, fd!);
  const t = Date.UTC(ty!, tm! - 1, td!);
  return Math.round((t - f) / 86_400_000);
}

function trendLabel(
  rows: ReadonlyArray<{ productivityScore: number }>,
): string {
  if (rows.length < 2) return rows.length === 0 ? "Awaiting activity" : "1 day tracked";
  const half = Math.max(1, Math.floor(rows.length / 2));
  const oldAvg =
    rows.slice(0, half).reduce((s, r) => s + r.productivityScore, 0) / half;
  const newAvg =
    rows.slice(-half).reduce((s, r) => s + r.productivityScore, 0) / half;
  const delta = newAvg - oldAvg;
  if (Math.abs(delta) < 5) return `${rows.length} days · steady`;
  return `${rows.length} days · ${delta > 0 ? "trending up" : "trending down"}`;
}

export function ProductivitySparkline() {
  const today = todayLocal();
  const from = addDays(today, -(WINDOW_DAYS - 1));
  const rows = useQuery(api.analyticsProductivity.dayStatsRange, { from, to: today });

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
          Productivity trend
        </h3>
        <span className="text-[10px] uppercase tracking-[0.10em] text-muted-foreground">
          {WINDOW_DAYS} days
        </span>
      </div>
      {rows === undefined ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          The trend line appears once a few days are tracked.
        </p>
      ) : (
        <SparklineSVG rows={rows} from={from} />
      )}
      {rows && rows.length > 0 && (
        <span className="text-[11px] text-muted-foreground font-mono">
          {trendLabel(rows)}
        </span>
      )}
    </section>
  );
}

function SparklineSVG({
  rows,
  from,
}: {
  rows: ReadonlyArray<{ date: string; productivityScore: number }>;
  from: string;
}) {
  const path = pointsFor(rows, from);
  if (!path) return null;
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      className="w-full h-12"
      role="img"
      aria-label={`Productivity over the last ${WINDOW_DAYS} days`}
      preserveAspectRatio="none"
    >
      {/* Baseline at score=0 — subtle, in muted-foreground at low opacity. */}
      <line
        x1={PAD_X}
        x2={VIEWBOX_W - PAD_X}
        y1={VIEWBOX_H - PAD_Y}
        y2={VIEWBOX_H - PAD_Y}
        stroke="currentColor"
        strokeWidth={0.5}
        className="text-border"
      />
      <path
        d={path.d}
        fill="none"
        stroke="var(--status-streak)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {path.circles.map((c) => (
        <circle
          key={c.key}
          cx={c.cx}
          cy={c.cy}
          r={1.8}
          fill="var(--status-streak)"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
