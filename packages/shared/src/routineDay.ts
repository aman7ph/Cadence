// What happened to one routine on one scheduled day.
//
// Three backend queries answer this question — routineConsistency,
// dayOfWeekStats and routineTimeline — and before this module they answered it
// three different ways. Only routineTimeline knew that a scheduled day which
// has not happened yet is *pending* rather than *missed*; the other two counted
// today as a failure from the moment the clock struck midnight.
//
// That is why the rail's consistency score fell every morning and climbed back
// during the day, and why the day-of-week heatmap permanently under-rated
// whichever weekday today happened to be. With consistencyScore weighting by
// exp(-daysAgo / tau), the daysAgo = 0 sample carries the *largest* weight in
// the average — so the single heaviest input was the one guaranteed wrong.
//
// The rule is deliberately not "ignore today". Ignoring it would make a routine
// you already finished today vanish from your score until midnight. Only the
// *absence* of a record on a day that is not over yet is unanswerable.
// computeCurrentStreak in ./streak.ts already draws the line in exactly this
// place — see its `cursor < inputs.today` tolerance.
//
// It lives in shared rather than in the backend's lib/ for the reason
// validateRepeatArgs did (see convex/lib/taskRepeat.ts): it is pure and
// entity-agnostic, so it belongs where it can be tested directly.

export type ScheduledDayStatus = "completed" | "skipped" | "missed" | "pending";

// `record` is the routineCompletions row's status for this (routine, date), or
// undefined when no row exists. `date` is assumed already known to be scheduled
// for the routine — callers check isScheduledOn first, because that needs the
// routine document and this deliberately does not.
export function resolveDayStatus(
  record: "completed" | "skipped" | undefined,
  date: string,
  today: string,
): ScheduledDayStatus {
  if (record) return record;
  return date >= today ? "pending" : "missed";
}

// Whether a resolved day belongs in a completion rate, as numerator or
// denominator. Skips are neutral by design — see the note in scoring.ts — and
// pending days have no answer yet, so both leave the fraction entirely rather
// than counting as failures.
//
// The charts that bucket routineTimeline already filter to exactly this pair,
// so routing every caller through one predicate is what keeps the timeline
// chart and the consistency score describing the same set of days.
export function countsTowardRate(status: ScheduledDayStatus): boolean {
  return status === "completed" || status === "missed";
}
