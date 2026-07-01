import { addDays, daysBetween, formatDateShort, formatMonthYear, startOfWeek } from "@cadence/shared";

export type Granularity = "daily" | "weekly" | "monthly";

export function getGranularity(from: string, to: string): Granularity {
  const days = daysBetween(from, to);
  if (days <= 90) return "daily";
  if (days <= 365) return "weekly";
  return "monthly";
}

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

// Fill gaps in a date series so charts don't skip days.
// Returns one entry per calendar day in [from, to]; missing dates get value 0.
export function fillDailyGaps(
  rows: { date: string; value: number }[],
  from: string,
  to: string,
): { date: string; value: number }[] {
  const map = new Map(rows.map((r) => [r.date, r.value]));
  const result: { date: string; value: number }[] = [];
  const total = daysBetween(from, to);
  for (let i = 0; i < total; i++) {
    const date = addDays(from, i);
    result.push({ date, value: map.get(date) ?? 0 });
  }
  return result;
}
