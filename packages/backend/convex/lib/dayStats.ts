import { productivityScore } from "@cadence/shared";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { isScheduledOn } from "./schedule";
import { loadDayTasks, statusOn } from "./taskDay";

export type DayStatsPayload = {
  userId: Id<"users">;
  date: string;
  routineScheduled: number;
  routineCompleted: number;
  randomTotal: number;
  randomCompleted: number;
  productivityScore: number;
};

// Counts the scheduled / completed / resolved events for (userId, date) as they
// stand right now, WITHOUT writing. Split from the upsert so the recompute pass
// in taskDays.ts can diff a proposed result against the stored row before
// touching it.
export async function computeDayStats(
  ctx: QueryCtx,
  userId: Id<"users">,
  date: string,
): Promise<DayStatsPayload> {
  const routines = await ctx.db
    .query("routines")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const routineScheduled = routines.filter((r) => isScheduledOn(r, date)).length;

  const completionsOnDate = await ctx.db
    .query("routineCompletions")
    .withIndex("by_user_date", (q) =>
      q.eq("userId", userId).eq("date", date),
    )
    .collect();
  const routineCompleted = completionsOnDate.filter(
    (c) => c.status === "completed",
  ).length;

  // Tasks by presence: every task that was on the plate that day counts once,
  // and the status it held THAT day decides whether it counts as done.
  //
  // This replaces three reads — every completed task the user has ever had,
  // plus open and dismissed tasks keyed on the mutable currentDate — with one
  // indexed read of the day's presence rows. It is both cheaper and correct for
  // past days: a task carried through a day used to vanish from that day's
  // plate the moment it rolled forward.
  const dayTasks = await loadDayTasks(ctx, userId, date);
  const randomTotal = dayTasks.length;
  const randomCompleted = dayTasks.filter(
    (t) => statusOn(t, date) === "completed",
  ).length;

  const user = await ctx.db.get(userId);
  const score = productivityScore(
    { routineCompleted, routineScheduled, randomCompleted, randomTotal },
    user?.routineWeight,
  );

  return {
    userId,
    date,
    routineScheduled,
    routineCompleted,
    randomTotal,
    randomCompleted,
    productivityScore: score,
  };
}

// Recomputes and upserts the dayStats row for (userId, date). Call from every
// completion mutation that could change those counts.
export async function upsertDayStats(
  ctx: MutationCtx,
  userId: Id<"users">,
  date: string,
): Promise<void> {
  const payload = await computeDayStats(ctx, userId, date);
  const existing = await ctx.db
    .query("dayStats")
    .withIndex("by_user_date", (q) =>
      q.eq("userId", userId).eq("date", date),
    )
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, payload);
  } else {
    await ctx.db.insert("dayStats", payload);
  }
}
