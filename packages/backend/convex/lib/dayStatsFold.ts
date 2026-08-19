// The single-day count, shared by the write path (lib/dayStats.computeDayStats)
// and the derived read path (lib/dayStatsDerive.deriveDayStatsRange). One
// function on purpose: two implementations of "what happened on this day" is
// exactly what let the stored dayStats row and the live Today view disagree, so
// a shared fold makes that drift impossible.

import { productivityScore } from "@cadence/shared";
import type { Doc, Id } from "../_generated/dataModel";
import { isScheduledOn } from "./schedule";
import { statusOn } from "./taskDay";
import type { CompletionStatus } from "./routineCompletions";

export type DayStatsNumbers = {
  routineScheduled: number;
  routineCompleted: number;
  randomTotal: number;
  randomCompleted: number;
  productivityScore: number;
};

// Whether a day earns a row at all — the load-bearing predicate here, and a
// named function rather than an inline comparison pair because it is wrong in
// two opposite and equally silent ways:
//
//   - Too strict (the old behaviour: a row only where a mutation ran) and a day
//     with five routines scheduled and none done has no row, rendering as "no
//     activity" — indistinguishable from a day before the account existed — and
//     drops out of every average. That is what made the 30-day rate an average
//     over good days only.
//   - Too loose (a row per calendar day) and every day before signup scores a
//     *neutral 100*, since productivityScore deliberately scores an empty plate
//     100 (see shared/scoring.ts), inflating the very averages this fixes.
export function hadSomethingOnThePlate(numbers: {
  routineScheduled: number;
  randomTotal: number;
}): boolean {
  return numbers.routineScheduled > 0 || numbers.randomTotal > 0;
}

export function foldDayStats(args: {
  routines: Doc<"routines">[];
  statusByRoutine: ReadonlyMap<Id<"routines">, CompletionStatus>;
  tasks: Doc<"dailyTasks">[];
  date: string;
  routineWeight: number | undefined;
}): DayStatsNumbers {
  let routineScheduled = 0;
  let routineCompleted = 0;
  for (const routine of args.routines) {
    if (!isScheduledOn(routine, args.date)) continue;
    const status = args.statusByRoutine.get(routine._id);
    // Skips leave the fraction rather than counting as failures — as
    // consistencyScore, countsTowardRate and computeCurrentStreak already do,
    // and as shared/scoring.ts states. The day's score was the last holdout.
    // Distinct from `pending`: a day's score is a snapshot of that day, so a
    // routine not done *yet* still counts against it (the tile climbs all day).
    if (status === "skipped") continue;
    routineScheduled += 1;
    if (status === "completed") routineCompleted += 1;
  }

  let randomCompleted = 0;
  for (const task of args.tasks) {
    if (statusOn(task, args.date) === "completed") randomCompleted += 1;
  }

  const numbers = {
    routineScheduled,
    routineCompleted,
    randomTotal: args.tasks.length,
    randomCompleted,
  };
  return {
    ...numbers,
    productivityScore: productivityScore(numbers, args.routineWeight),
  };
}
