import { computeCurrentStreak } from "@cadence/shared";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { isScheduledOn } from "./schedule";

export async function recomputeStreak(
  ctx: MutationCtx,
  routineId: Id<"routines">,
  today: string,
): Promise<void> {
  const routine = await ctx.db.get(routineId);
  if (!routine) return;

  const completions = await ctx.db
    .query("routineCompletions")
    .withIndex("by_routine_date", (q) => q.eq("routineId", routineId))
    .collect();

  const completedDates = new Set<string>();
  const skippedDates = new Set<string>();
  let lastCompletedDate: string | undefined;
  for (const c of completions) {
    if (c.status === "completed") {
      completedDates.add(c.date);
      if (!lastCompletedDate || c.date > lastCompletedDate) {
        lastCompletedDate = c.date;
      }
    } else {
      skippedDates.add(c.date);
    }
  }

  const current = computeCurrentStreak({
    completedDates,
    skippedDates,
    createdDate: routine.createdDate,
    isScheduledOn: (date) => isScheduledOn(routine, date),
    today,
  });

  const longest = Math.max(routine.longestStreak, current);
  await ctx.db.patch(routineId, {
    currentStreak: current,
    longestStreak: longest,
    lastCompletedDate: lastCompletedDate ?? routine.lastCompletedDate,
  });
}
