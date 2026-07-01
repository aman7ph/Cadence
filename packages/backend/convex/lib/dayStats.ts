import { productivityScore } from "@cadence/shared";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { isScheduledOn } from "./schedule";

// Recomputes and upserts the dayStats row for (userId, date) by counting
// scheduled / completed / resolved events as they exist at call time. Call
// from every completion mutation that could change those counts.
export async function upsertDayStats(
  ctx: MutationCtx,
  userId: Id<"users">,
  date: string,
): Promise<void> {
  const routines = await ctx.db
    .query("routines")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const routineScheduled = routines.filter((r) =>
    isScheduledOn(r, date),
  ).length;

  const completionsOnDate = await ctx.db
    .query("routineCompletions")
    .withIndex("by_user_date", (q) =>
      q.eq("userId", userId).eq("date", date),
    )
    .collect();
  const routineCompleted = completionsOnDate.filter(
    (c) => c.status === "completed",
  ).length;

  // randomCompleted: tasks whose completedDate === date.  We scan completed
  // tasks for the user and filter — there is no index on completedDate, and
  // for a personal app the volume is small.  See doc/implementation-plan.md
  // Phase 7 (§5) for the broader .collect() audit.
  const completedTasks = await ctx.db
    .query("dailyTasks")
    .withIndex("by_user_status", (q) =>
      q.eq("userId", userId).eq("status", "completed"),
    )
    .collect();
  const randomCompleted = completedTasks.filter(
    (t) => t.completedDate === date,
  ).length;

  // Open tasks sitting on this date AND dismissed tasks credited to this
  // date both contribute to the day's task plate. They count against the
  // score until completed.
  const openOnDate = await ctx.db
    .query("dailyTasks")
    .withIndex("by_user_current", (q) =>
      q.eq("userId", userId).eq("currentDate", date).eq("status", "open"),
    )
    .collect();
  const dismissedOnDate = await ctx.db
    .query("dailyTasks")
    .withIndex("by_user_current", (q) =>
      q.eq("userId", userId).eq("currentDate", date).eq("status", "dismissed"),
    )
    .collect();
  const randomTotal =
    randomCompleted + openOnDate.length + dismissedOnDate.length;

  const user = await ctx.db.get(userId);
  const score = productivityScore(
    {
      routineCompleted,
      routineScheduled,
      randomCompleted,
      randomTotal,
    },
    user?.routineWeight,
  );

  const existing = await ctx.db
    .query("dayStats")
    .withIndex("by_user_date", (q) =>
      q.eq("userId", userId).eq("date", date),
    )
    .unique();

  const payload = {
    userId,
    date,
    routineScheduled,
    routineCompleted,
    randomTotal,
    randomCompleted,
    productivityScore: score,
  };

  if (existing) {
    await ctx.db.patch(existing._id, payload);
  } else {
    await ctx.db.insert("dayStats", payload);
  }
}
