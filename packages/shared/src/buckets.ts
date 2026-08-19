// Bucketing and smoothing for the insight charts.
//
// Both apps had their own copy — `web/src/lib/chartUtils.ts` and
// `mobile/lib/insightBuckets.ts` — and they were the same maths written twice,
// which is exactly how the two platforms end up plotting different numbers from
// the same data. `getGranularity` had already drifted that way once: web
// switched at 90/365 days and mobile at 30/180, so "Last 90 days" rendered as
// daily points on one and weekly averages on the other.

import { startOfWeek } from "./date";

/**
 * Exponential moving average. Seeded with the first value rather than with
 * zero, so a series does not open with a dip that is an artefact of the
 * smoothing rather than of the data.
 */
export function computeEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const alpha = 2 / (period + 1);
  const ema = [values[0]!];
  for (let i = 1; i < values.length; i++) {
    ema.push(values[i]! * alpha + ema[i - 1]! * (1 - alpha));
  }
  return ema;
}

export interface DatedValue {
  date: string;
  value: number;
}

function bucketValues(
  rows: DatedValue[],
  keyOf: (date: string) => string,
): DatedValue[] {
  const buckets = new Map<string, { sum: number; count: number }>();
  for (const row of rows) {
    const key = keyOf(row.date);
    const b = buckets.get(key) ?? { sum: 0, count: 0 };
    b.sum += row.value;
    b.count += 1;
    buckets.set(key, b);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { sum, count }]) => ({
      date,
      value: Math.round(sum / count),
    }));
}

function bucketCounts<K extends string>(
  rows: ({ date: string } & Record<K, number>)[],
  keys: K[],
  keyOf: (date: string) => string,
): ({ date: string } & Record<K, number>)[] {
  const buckets = new Map<string, Record<K, number>>();
  for (const row of rows) {
    const key = keyOf(row.date);
    const b =
      buckets.get(key) ??
      (Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>);
    // Both sides nullish-guarded: a row missing one of `keys` would otherwise
    // poison the whole bucket with NaN, and one of the two old copies did.
    for (const k of keys) b[k] = (b[k] ?? 0) + (row[k] ?? 0);
    buckets.set(key, b);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([date, counts]) =>
        ({ date, ...counts }) as { date: string } & Record<K, number>,
    );
}

/** YYYY-MM-01 — the calendar month a date falls in. */
const monthKey = (date: string) => date.slice(0, 7) + "-01";

/** Daily rows into ISO-week buckets keyed to the Monday. Values are AVERAGED. */
export function bucketByWeek(rows: DatedValue[]): DatedValue[] {
  return bucketValues(rows, startOfWeek);
}

/** Daily rows into calendar-month buckets. Values are AVERAGED. */
export function bucketByMonth(rows: DatedValue[]): DatedValue[] {
  return bucketValues(rows, monthKey);
}

/**
 * Rows carrying several numeric fields (e.g. completed/open), into ISO-week
 * buckets. Each field is SUMMED, not averaged — these are counts, and the
 * average of a count over a week answers a question nobody asked.
 */
export function bucketCountsByWeek<K extends string>(
  rows: ({ date: string } & Record<K, number>)[],
  keys: K[],
): ({ date: string } & Record<K, number>)[] {
  return bucketCounts(rows, keys, startOfWeek);
}

/** As `bucketCountsByWeek`, by calendar month. */
export function bucketCountsByMonth<K extends string>(
  rows: ({ date: string } & Record<K, number>)[],
  keys: K[],
): ({ date: string } & Record<K, number>)[] {
  return bucketCounts(rows, keys, monthKey);
}
