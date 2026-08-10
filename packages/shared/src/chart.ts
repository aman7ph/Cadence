import { addDays, daysBetween } from "./date";

// How a date range is bucketed for charting.
//
// Shared because web and mobile had drifted apart: web switched at 90/365 days,
// mobile at 30/180. "Last 90 days" therefore rendered as 90 daily points on web
// and as weekly averages on mobile — the same range over the same data showing
// two different sets of numbers, which is a correctness problem and not a
// styling one.
//
// The web thresholds win. 90 daily points stay readable, and bucketing earlier
// throws away exactly the detail a user asked for by picking a 90-day range.
// The cost is that mobile charts get denser between 31 and 90 days; that is the
// trade, and it is these two constants if it ever needs revisiting.

export type Granularity = "daily" | "weekly" | "monthly";

// Inclusive upper bounds, in days. A range measuring at most MAX_DAILY_RANGE_DAYS
// plots one point per day; at most MAX_WEEKLY_RANGE_DAYS buckets by ISO week;
// anything longer buckets by calendar month.
//
// `daysBetween` is inclusive, so the "Last 90 days" preset (today - 89 through
// today) measures exactly MAX_DAILY_RANGE_DAYS and stays daily. The boundary sits
// *on* a shipping preset rather than near one, which is why the tests pin both
// sides of it — an off-by-one here silently changes what every user sees.
export const MAX_DAILY_RANGE_DAYS = 90;
export const MAX_WEEKLY_RANGE_DAYS = 365;

export function getGranularity(from: string, to: string): Granularity {
  const days = daysBetween(from, to);
  if (days <= MAX_DAILY_RANGE_DAYS) return "daily";
  if (days <= MAX_WEEKLY_RANGE_DAYS) return "weekly";
  return "monthly";
}

// What a chart's data actually represents, for the badge in its header.
//
// Web's version of this returned "7-day rolling" for daily granularity and was
// hung on two charts that plot plain per-day counts; mobile's returned "daily"
// and was hung on the one chart that really is rolling. Each platform mislabeled
// the charts the other got right. A rolling series says so through
// rollingWindowLabel in ./routineChart.ts; everything else is just its bucket.
export function granularityLabel(granularity: Granularity): string {
  if (granularity === "weekly") return "weekly buckets";
  if (granularity === "monthly") return "monthly buckets";
  return "daily";
}

// One row per calendar day in [from, to], with `empty(date)` standing in for
// days the source had nothing for.
//
// Count series need this before they are bucketed or plotted. A backend query
// that groups by date only emits days that had something, so a day with zero is
// simply absent — and on a categorical axis an absent day is not a gap, it is a
// day that never happened. The line closes over it and a week with three quiet
// days looks like a week with four. Summing an unfilled series into weekly
// buckets hides it further, because the weeks still add up correctly while the
// daily view they came from was already lying about the shape.
//
// The caller supplies the zero row, so this stays honest about shape: there is
// no guessing which numeric fields a row has.
export function fillDailyGaps<T extends { date: string }>(
  rows: ReadonlyArray<T>,
  from: string,
  to: string,
  empty: (date: string) => T,
): T[] {
  const byDate = new Map(rows.map((row) => [row.date, row]));
  const total = daysBetween(from, to);
  const filled: T[] = [];
  for (let i = 0; i < total; i++) {
    const date = addDays(from, i);
    filled.push(byDate.get(date) ?? empty(date));
  }
  return filled;
}
