import { addDays } from "@cadence/shared";
import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { computeDayStats, refreshExistingDayStats } from "./lib/dayStats";
import { recordTaskDaySpan, spanDates } from "./lib/taskDay";

// Day-tracking mutations for daily tasks: which day a task sits on, and which
// days it has sat on. Split out of dailyTasks.ts (which was at exactly 149 of
// the project's 150 allowed lines) the same way stagedTaskScheduling.ts was
// split out of stagedTasks.ts. The taskDays presence-log writes and the
// backfill join this module in later steps, beside the rollover they belong
// with — moving rolloverOpenTasks here is what makes room for them.

// Idempotent rollover: advances open tasks to today and bumps carryoverCount. See docs §2.5.
export const rolloverOpenTasks = mutation({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const user = await requireUser(ctx);
    const openTasks = await ctx.db
      .query("dailyTasks")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "open"),
      )
      .collect();
    const touchedDates = new Set<string>();
    for (const t of openTasks) {
      if (t.currentDate < today) {
        // Every day the task silently sat through, not just today: this fires
        // only on app open, so a multi-day absence is one jump here but was
        // several days on the user's plate. See lib/taskDay.ts.
        const from = addDays(t.currentDate, 1);
        await recordTaskDaySpan(ctx, user._id, t._id, from, today);
        for (const d of spanDates(from, today)) touchedDates.add(d);
        await ctx.db.patch(t._id, {
          currentDate: today,
          carryoverCount: t.carryoverCount + 1,
        });
      }
    }

    // Those days' task plates just grew, so any score already recorded for them
    // is now stale. Refreshed, never created — see refreshExistingDayStats.
    await refreshExistingDayStats(ctx, user._id, touchedDates);
  },
});

// One-off backfill: reconstructs the presence log for tasks that predate it.
// `internalMutation`, so it is never exposed to a client — this is an operator
// tool, run once per deployment with
//   npx convex run taskDays:backfillTaskDays '{"userId":"…","dryRun":true}'
// and again without dryRun. Internal functions carry no auth identity, hence
// the explicit userId argument.
//
// It only ever INSERTS into taskDays. No dailyTasks row is read for anything
// but its dates, and none is modified.
//
// The span is the same fact the live writers record, recovered from the fields
// that survived: a task was on the plate from originalDate until it was
// finished, or until the day it currently sits on if it never was. Per-day
// idempotency (see lib/taskDay.ts) means this can be re-run, and that it
// correctly extends tasks the live write path has already partly covered.
export const backfillTaskDays = internalMutation({
  args: { userId: v.id("users"), dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { userId, dryRun }) => {
    const tasks = await ctx.db
      .query("dailyTasks")
      .withIndex("by_user_original", (q) => q.eq("userId", userId))
      .collect();

    let rowsInserted = 0;
    let rowsSkipped = 0;
    for (const t of tasks) {
      const endDate =
        t.status === "completed" ? (t.completedDate ?? t.currentDate) : t.currentDate;
      const { inserted, skipped } = await recordTaskDaySpan(
        ctx,
        userId,
        t._id,
        t.originalDate,
        endDate,
        { dryRun },
      );
      rowsInserted += inserted;
      rowsSkipped += skipped;
    }

    return { tasksScanned: tasks.length, rowsInserted, rowsSkipped, dryRun: !!dryRun };
  },
});

// One-off companion to the backfill: existing dayStats rows were computed under
// the old currentDate-keyed counting, so they disagree with what
// computeDayStats now returns. Without this pass, a day's score would silently
// change the next time any mutation happened to touch that date.
//
// Only EXISTING rows are recomputed — same reasoning as the rollover above.
// `dryRun` reports the full before/after diff without writing.
export const recomputeDayStats = internalMutation({
  args: { userId: v.id("users"), dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { userId, dryRun }) => {
    const rows = await ctx.db
      .query("dayStats")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();

    const changes = [];
    for (const row of rows) {
      const next = await computeDayStats(ctx, userId, row.date);
      const differs =
        next.routineScheduled !== row.routineScheduled ||
        next.routineCompleted !== row.routineCompleted ||
        next.randomTotal !== row.randomTotal ||
        next.randomCompleted !== row.randomCompleted ||
        next.productivityScore !== row.productivityScore;
      if (!differs) continue;
      changes.push({
        date: row.date,
        before: `r ${row.routineCompleted}/${row.routineScheduled} t ${row.randomCompleted}/${row.randomTotal} score ${row.productivityScore}`,
        after: `r ${next.routineCompleted}/${next.routineScheduled} t ${next.randomCompleted}/${next.randomTotal} score ${next.productivityScore}`,
      });
      if (!dryRun) await ctx.db.patch(row._id, next);
    }

    return { rowsScanned: rows.length, changed: changes.length, dryRun: !!dryRun, changes };
  },
});
