import type { QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

/** One goal-credit event: a date, an amount, and what produced it. */
export interface GoalCredit {
  date: string;
  amount: number;
  label: string;
}

/**
 * Every credit a goal has actually received, as dated events.
 *
 * This is the one place that knows what "counts" as a credit, because getting
 * it wrong is silent and large:
 *
 *  - TASKS are credited **once**, when the task itself completes — see
 *    dailyTasks.complete and dailyTaskRepeats.logRep, which only credits at
 *    `reachedTarget`. `taskCompletions` holds one row per *rep*, so a repeat
 *    task with target 20 would be counted twentyfold if reps were summed.
 *    The credit event is therefore the task row's own `completedDate`.
 *
 *  - ROUTINES are credited per completed day. `routineCompletions` is already
 *    exactly one row per (routine, date) — `routineReps` is the rep log and
 *    must not be used here for the same reason.
 *
 * Mirrors lib/goalContribution.applyGoalContribution, which is what actually
 * moves `currentValue`; if that changes, this must change with it.
 */
export async function goalCredits(
  ctx: QueryCtx,
  goalId: Id<"goals">,
): Promise<GoalCredit[]> {
  const credits: GoalCredit[] = [];

  const tasks = await ctx.db
    .query("dailyTasks")
    .withIndex("by_goal", (q) => q.eq("goalId", goalId))
    .collect();

  for (const t of tasks) {
    if (t.status !== "completed" || !t.goalContribution) continue;
    const date = t.completedDate ?? t.currentDate;
    credits.push({ date, amount: t.goalContribution, label: t.title });
  }

  const routines = await ctx.db
    .query("routines")
    .withIndex("by_goal", (q) => q.eq("goalId", goalId))
    .collect();

  for (const r of routines) {
    if (!r.goalContribution) continue;
    // Prefix of by_routine_date — no new index is added by this plan.
    const days = await ctx.db
      .query("routineCompletions")
      .withIndex("by_routine_date", (q) => q.eq("routineId", r._id))
      .collect();
    for (const d of days) {
      if (d.status !== "completed") continue;
      credits.push({ date: d.date, amount: r.goalContribution, label: r.name });
    }
  }

  credits.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return credits;
}

/** Active goals for the signed-in user. */
export async function activeGoals(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<Doc<"goals">[]> {
  return ctx.db
    .query("goals")
    .withIndex("by_user_status", (q) =>
      q.eq("userId", userId).eq("status", "active"),
    )
    .collect();
}
