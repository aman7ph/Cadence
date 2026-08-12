import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

// One-off migration retiring the "dismissed" task status.
//
// Deliberately split from the schema change that follows it: Convex validates
// the schema against the data at rest, so pushing a dailyTasks.status union
// without "dismissed" while a single row still holds that value fails the
// deploy. The order is therefore fixed, and this deploy is the middle step:
//   1. remove every writer of the old status (dailyTasks.dismiss is gone, and
//      no client can send it) — done in the same deploy as this file, so no
//      row can be dismissed after the run below and before the schema change;
//   2. run this to clear the rows that already exist;
//   3. only then may the literal leave tables/tasks.ts, and this file with it.
//
// `internalMutation`, so no client can reach it — an operator tool, run with
//   npx convex run migrations:dismissedTasksToOpen '{"dryRun":true}'
// and again without dryRun. Internal functions carry no auth identity, hence
// the explicit userId, optional here because the whole point is to leave no row
// behind anywhere. Matches taskDays.backfillTaskDays.
//
// Open is the landing status rather than deleted: a dismissed task is one the
// user set aside, and the log of days it sat on their plate is real history.
// No day's score moves here — lib/dayStatsDerive.foldDayStats counts
// randomTotal as every task present that day and tests only for "completed",
// so dismissed and open already scored identically. The one visible
// consequence is rollover: taskDays.rolloverOpenTasks now picks these up and
// carries them to today, which is exactly what "back on the plate" means.
export const dismissedTasksToOpen = internalMutation({
  args: { userId: v.optional(v.id("users")), dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { userId, dryRun }) => {
    const userIds = userId
      ? [userId]
      : (await ctx.db.query("users").collect()).map((u) => u._id);

    let found = 0;
    const samples: { title: string; originalDate: string; currentDate: string }[] = [];
    for (const uid of userIds) {
      // Indexed rather than a table scan, and scoped per user so one large
      // account can be migrated on its own if a whole-table run ever outgrows a
      // single transaction. Re-runnable: a patched row stops matching.
      const dismissed = await ctx.db
        .query("dailyTasks")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", uid).eq("status", "dismissed"),
        )
        .collect();
      for (const task of dismissed) {
        if (samples.length < 25) {
          samples.push({
            title: task.title,
            originalDate: task.originalDate,
            currentDate: task.currentDate,
          });
        }
        if (!dryRun) await ctx.db.patch(task._id, { status: "open" });
        found += 1;
      }
    }

    return {
      usersScanned: userIds.length,
      tasksFound: found,
      tasksPatched: dryRun ? 0 : found,
      dryRun: !!dryRun,
      samples,
    };
  },
});
