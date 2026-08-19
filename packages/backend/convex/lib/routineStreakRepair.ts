// Recomputes routines.longestStreak from the completion log and patches any
// routine whose stored value disagrees.
//
// It patches toward the truth in BOTH directions rather than only lowering. The
// log is the authority: a stored value above it is inflated, one below it lost a
// run that really happened, and both are wrong.
//
// currentStreak is deliberately left alone — Step 3 made it derived at read
// time, so the stored field is a write-time cache that nothing displays.

import { computeLongestStreak } from "@cadence/shared";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { isScheduledOn } from "./schedule";
import { loadCompletionsByRoutine } from "./routineCompletions";

export type StreakRepairResult = {
  routinesScanned: number;
  changed: number;
  dryRun: boolean;
  changes: { name: string; before: number; after: number }[];
};

export async function repairLongestStreaksFor(
  ctx: MutationCtx,
  userId: Id<"users">,
  today: string,
  dryRun: boolean,
): Promise<StreakRepairResult> {
  const routines = await ctx.db
    .query("routines")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  if (routines.length === 0)
    return { routinesScanned: 0, changed: 0, dryRun, changes: [] };

  const earliest = routines.reduce(
    (min, r) => (r.createdDate < min ? r.createdDate : min),
    today,
  );
  const byRoutine = await loadCompletionsByRoutine(
    ctx,
    userId,
    earliest,
    today,
  );

  const changes = [];
  for (const routine of routines) {
    const completedDates = new Set<string>();
    const skippedDates = new Set<string>();
    for (const [date, status] of byRoutine.get(routine._id) ?? []) {
      if (status === "completed") completedDates.add(date);
      else skippedDates.add(date);
    }
    const trueLongest = computeLongestStreak({
      completedDates,
      skippedDates,
      createdDate: routine.createdDate,
      endDate:
        routine.archivedDate && routine.archivedDate < today
          ? routine.archivedDate
          : today,
      isScheduledOn: (date) => isScheduledOn(routine, date),
    });
    if (trueLongest === routine.longestStreak) continue;
    changes.push({
      name: routine.name,
      before: routine.longestStreak,
      after: trueLongest,
    });
    if (!dryRun)
      await ctx.db.patch(routine._id, { longestStreak: trueLongest });
  }

  return {
    routinesScanned: routines.length,
    changed: changes.length,
    dryRun,
    changes,
  };
}
