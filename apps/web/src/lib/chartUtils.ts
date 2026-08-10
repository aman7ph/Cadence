import { formatDateShort, formatMonthYear, startOfWeek } from "@cadence/shared";
import type { Granularity } from "@cadence/shared";

// `getGranularity` and its thresholds moved to @cadence/shared in Step 11.
// Web switched at 90/365 days and mobile at 30/180, so "Last 90 days" rendered
// as 90 daily points on one platform and weekly averages on the other — the
// same range over the same data showing two different sets of numbers. Both now
// read one implementation. Re-exported here so existing imports keep working.
export type { Granularity } from "@cadence/shared";
export { getGranularity } from "@cadence/shared";

export function formatXLabel(date: string, granularity: Granularity): string {
  if (granularity === "monthly") return formatMonthYear(date);
  return formatDateShort(date);
}

// Bucket daily {date, value} rows into ISO-week buckets keyed to the Monday.
// Values are averaged within each bucket.
export function bucketByWeek(
  rows: { date: string; value: number }[],
): { date: string; value: number }[] {
  const buckets = new Map<string, { sum: number; count: number }>();
  for (const row of rows) {
    const key = startOfWeek(row.date);
    const b = buckets.get(key) ?? { sum: 0, count: 0 };
    b.sum += row.value;
    b.count += 1;
    buckets.set(key, b);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { sum, count }]) => ({ date, value: Math.round(sum / count) }));
}

// Bucket daily {date, value} rows into calendar-month buckets keyed to YYYY-MM-01.
// Values are averaged within each bucket.
export function bucketByMonth(
  rows: { date: string; value: number }[],
): { date: string; value: number }[] {
  const buckets = new Map<string, { sum: number; count: number }>();
  for (const row of rows) {
    const key = row.date.slice(0, 7) + "-01"; // "2026-06-01"
    const b = buckets.get(key) ?? { sum: 0, count: 0 };
    b.sum += row.value;
    b.count += 1;
    buckets.set(key, b);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { sum, count }]) => ({ date, value: Math.round(sum / count) }));
}

// Bucket daily rows that carry multiple numeric fields (e.g. completed/open/dismissed).
// Each numeric field is summed (not averaged) within each bucket — counts should be summed.
export function bucketCountsByWeek<K extends string>(
  rows: ({ date: string } & Record<K, number>)[],
  keys: K[],
): ({ date: string } & Record<K, number>)[] {
  const buckets = new Map<string, Record<K, number>>();
  for (const row of rows) {
    const key = startOfWeek(row.date);
    const b = buckets.get(key) ?? Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
    for (const k of keys) b[k] = (b[k] ?? 0) + row[k];
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
    for (const k of keys) b[k] = (b[k] ?? 0) + row[k];
    buckets.set(key, b);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }) as { date: string } & Record<K, number>);
}

// `fillDailyGaps` used to live here and was never called by anything. It moved
// to @cadence/shared in Step 9, where mobile needs it too and where it is
// tested — see packages/shared/src/chart.ts.
