import { addDays, daysBetween, startOfWeek, startOfMonth, startOfYear } from "@cadence/shared";
import type { DateRange } from "@cadence/shared";

export type Granularity = "daily" | "weekly" | "monthly";
export type LineSeries = { data: number[]; color: string; strokeWidth?: number; opacity?: number };
export type TK = "completed" | "dismissed" | "open";

export interface RangePreset {
  label: string;
  range: (today: string) => DateRange;
}

export const CC = ["#818cf8", "#4ade80", "#fbbf24", "#f87171", "#60a5fa", "#c084fc"];
export const HEAT_DARK  = ["#20232d", "#1f3a26", "#2b6c3a", "#3aa052", "#6fd581"];
export const HEAT_LIGHT = ["#ebedf0", "#c6e8cb", "#86cf92", "#43ae59", "#1b8a36"];
export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const TASK_KEYS: TK[] = ["completed", "dismissed", "open"];
export const TASK_COLORS: Record<TK, string> = { completed: "#4ade80", dismissed: "#fbbf24", open: CC[0]! };

export const RANGE_PRESETS: RangePreset[] = [
  { label: "Last 7 days",   range: (t) => ({ from: addDays(t, -6),   to: t }) },
  { label: "Last 30 days",  range: (t) => ({ from: addDays(t, -29),  to: t }) },
  { label: "Last 90 days",  range: (t) => ({ from: addDays(t, -89),  to: t }) },
  { label: "Last 6 months", range: (t) => ({ from: addDays(t, -181), to: t }) },
  { label: "Last year",     range: (t) => ({ from: addDays(t, -364), to: t }) },
  { label: "This week",     range: (t) => ({ from: startOfWeek(t),   to: t }) },
  { label: "This month",    range: (t) => ({ from: startOfMonth(t),  to: t }) },
  { label: "This year",     range: (t) => ({ from: startOfYear(t),   to: t }) },
  { label: "All time",      range: (t) => ({ from: "2020-01-01",     to: t }) },
];

export function getGranularity(from: string, to: string): Granularity {
  const days = daysBetween(from, to);
  if (days <= 30) return "daily";
  if (days <= 180) return "weekly";
  return "monthly";
}

export function granLabel(g: Granularity): string {
  if (g === "weekly") return "weekly buckets";
  if (g === "monthly") return "monthly buckets";
  return "daily";
}

export function computeEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const alpha = 2 / (period + 1);
  const ema = [values[0]!];
  for (let i = 1; i < values.length; i++) {
    ema.push(values[i]! * alpha + ema[i - 1]! * (1 - alpha));
  }
  return ema;
}

export function bucketByWeek(rows: { date: string; value: number }[]) {
  const buckets = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const key = startOfWeek(r.date);
    const b = buckets.get(key) ?? { sum: 0, count: 0 };
    b.sum += r.value; b.count += 1;
    buckets.set(key, b);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { sum, count }]) => ({ date, value: Math.round(sum / count) }));
}

export function bucketByMonth(rows: { date: string; value: number }[]) {
  const buckets = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const key = r.date.slice(0, 7) + "-01";
    const b = buckets.get(key) ?? { sum: 0, count: 0 };
    b.sum += r.value; b.count += 1;
    buckets.set(key, b);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { sum, count }]) => ({ date, value: Math.round(sum / count) }));
}

export function bucketCountsByWeek<K extends string>(
  rows: ({ date: string } & Record<K, number>)[],
  keys: K[],
): ({ date: string } & Record<K, number>)[] {
  const buckets = new Map<string, Record<K, number>>();
  for (const row of rows) {
    const key = startOfWeek(row.date);
    const b = buckets.get(key) ?? Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
    for (const k of keys) b[k] = ((b[k] ?? 0) as number) + (row[k] ?? 0);
    buckets.set(key, b);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }) as { date: string } & Record<K, number>);
}

export function bucketCountsByMonth<K extends string>(
  rows: ({ date: string } & Record<K, number>)[],
  keys: K[],
): ({ date: string } & Record<K, number>)[] {
  const buckets = new Map<string, Record<K, number>>();
  for (const row of rows) {
    const key = row.date.slice(0, 7) + "-01";
    const b = buckets.get(key) ?? Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
    for (const k of keys) b[k] = ((b[k] ?? 0) as number) + (row[k] ?? 0);
    buckets.set(key, b);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }) as { date: string } & Record<K, number>);
}

export function fmtXLabel(date: string, g: Granularity): string {
  const [y, m, d] = date.split("-").map(Number);
  if (g === "monthly") {
    return new Date(Date.UTC(y!, m! - 1, 1)).toLocaleDateString(undefined, { month: "short", timeZone: "UTC" });
  }
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString(undefined, { month: "numeric", day: "numeric", timeZone: "UTC" });
}

export { fmtShort } from "./dateUtils";

export function pickLabelIndices(n: number): number[] {
  if (n === 0) return [];
  if (n <= 6) return Array.from({ length: n }, (_, i) => i);
  return [0, Math.floor(n / 2), n - 1];
}
