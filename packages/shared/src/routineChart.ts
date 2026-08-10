import { countsTowardRate } from "./routineDay";
import type { ScheduledDayStatus } from "./routineDay";
import { granularityLabel } from "./chart";
import type { Granularity } from "./chart";

// How many of a routine's OWN scheduled days a rolling rate averages over.
//
// "Own" is the whole point. Both clients previously took the last 7 dates from
// the union of *all* routines' dates and then filtered to one routine, so the
// window size depended on how many other routines the user happened to have.
// Measured over a 28-day window with one daily and one Monday-only routine: the
// daily routine's window reached 7 of its own samples, the Monday-only
// routine's never exceeded 1 — so its line was a 0/100 square wave rather than
// a rate. Sizing the window in a routine's own scheduled days makes every line
// mean the same thing.
export const ROLLING_WINDOW_DAYS = 7;

export type RoutineChartDay = { date: string; status: ScheduledDayStatus };

// The header badge for the routine-completion chart. Only the daily view is
// rolling — the bucketed views are ordinary per-bucket rates — and the label is
// built from ROLLING_WINDOW_DAYS so it can never claim a window size the
// computation does not use. "scheduled days", not "days", because the window is
// measured in the routine's own scheduled days.
export function rollingWindowLabel(granularity: Granularity): string {
  return granularity === "daily"
    ? `last ${ROLLING_WINDOW_DAYS} scheduled days`
    : granularityLabel(granularity);
}

// Rolling completion rate at each of `atDates`, as a percentage, or null where
// the routine had no countable days yet.
//
// null rather than 0 is deliberate. A routine created ten days into a thirty-day
// window has no data for the first twenty days; plotting 0 there draws a flat
// line along the floor that reads as total failure. A gap reads as a gap — both
// clients bridge it (recharts `connectNulls`, and SimpleLineChart skips
// segments with a null endpoint).
//
// Skipped and pending days drop out via countsTowardRate, the same predicate
// the consistency score and the day-of-week heatmap use, so a chart and a score
// over the same range describe the same set of days.
export function rollingCompletionRate(
  days: ReadonlyArray<RoutineChartDay>,
  atDates: ReadonlyArray<string>,
  windowSize: number = ROLLING_WINDOW_DAYS,
): (number | null)[] {
  const countable = days
    .filter((day) => countsTowardRate(day.status))
    .sort((a, b) => a.date.localeCompare(b.date));

  return atDates.map((date) => {
    const window = countable
      .filter((day) => day.date <= date)
      .slice(-windowSize);
    if (window.length === 0) return null;
    const hits = window.filter((day) => day.status === "completed").length;
    return Math.round((hits / window.length) * 100);
  });
}
