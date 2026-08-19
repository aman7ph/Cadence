import {
  addDays,
  daysBetween,
  startOfWeek,
  startOfMonth,
  startOfYear,
} from "@cadence/shared";
import type { DateRange, Granularity } from "@cadence/shared";
import type { Colors } from "./colors";

// `null` is a gap, not a zero: a routine with no scheduled days in a stretch
// must leave a hole rather than draw along the floor. SimpleLineChart skips any
// segment with a null endpoint. Plain number[] still assigns cleanly, so the
// momentum and open-task charts needed no change.
export type LineSeries = {
  data: (number | null)[];
  color: string;
  strokeWidth?: number;
  opacity?: number;
};
export type TK = "completed" | "open";

export interface RangePreset {
  label: string;
  range: (today: string) => DateRange;
}

export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const TASK_KEYS: TK[] = ["completed", "open"];

// These were module-level const arrays of raw hex — a second chart palette
// living outside colors.ts, which is exactly what the token layer forbids.
// They take the active colours instead, so the charts follow the theme.
// Order and role match web: series run --chart-1..6; completed/open are
// --chart-2 / --chart-5 (see insights-tasks-by-day-chart.tsx).
export const seriesColors = (c: Colors): string[] => [
  c.chart1,
  c.chart2,
  c.chart3,
  c.chart4,
  c.chart5,
  c.chart6,
];

export const taskColors = (c: Colors): Record<TK, string> => ({
  completed: c.chart2,
  open: c.chart5,
});

export const RANGE_PRESETS: RangePreset[] = [
  { label: "Last 7 days", range: (t) => ({ from: addDays(t, -6), to: t }) },
  { label: "Last 30 days", range: (t) => ({ from: addDays(t, -29), to: t }) },
  { label: "Last 90 days", range: (t) => ({ from: addDays(t, -89), to: t }) },
  { label: "Last 6 months", range: (t) => ({ from: addDays(t, -181), to: t }) },
  { label: "Last year", range: (t) => ({ from: addDays(t, -364), to: t }) },
  { label: "This week", range: (t) => ({ from: startOfWeek(t), to: t }) },
  { label: "This month", range: (t) => ({ from: startOfMonth(t), to: t }) },
  { label: "This year", range: (t) => ({ from: startOfYear(t), to: t }) },
  { label: "All time", range: (t) => ({ from: "2020-01-01", to: t }) },
];

// `getGranularity` and `granLabel` moved to @cadence/shared in Step 11. Mobile
// switched at 30/180 days while web switched at 90/365, so the same preset
// produced different charts on each platform. Re-exported so existing imports
// keep working; `granLabel` is now `granularityLabel`.
export type { Granularity } from "@cadence/shared";
export { getGranularity, granularityLabel } from "@cadence/shared";

export function fmtXLabel(date: string, g: Granularity): string {
  const [y, m, d] = date.split("-").map(Number);
  if (g === "monthly") {
    return new Date(Date.UTC(y!, m! - 1, 1)).toLocaleDateString(undefined, {
      month: "short",
      timeZone: "UTC",
    });
  }
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString(undefined, {
    month: "numeric",
    day: "numeric",
    timeZone: "UTC",
  });
}

export { fmtShort } from "./dateUtils";

export function pickLabelIndices(n: number): number[] {
  if (n === 0) return [];
  if (n <= 6) return Array.from({ length: n }, (_, i) => i);
  return [0, Math.floor(n / 2), n - 1];
}
