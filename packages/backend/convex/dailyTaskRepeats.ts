import {
  formatCountdown,
  isRepAllowed,
  nextAllowedAt,
  remainingMs,
} from "@cadence/shared";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireOwnedTask } from "./lib/ownership";
import { upsertDayStats } from "./lib/dayStats";
import { applyGoalContribution } from "./lib/goalContribution";

// Completions ("reps") of a repeat task. Split from dailyTasks.ts to stay
// under the project's 150-line limit, the same way routineManagement.ts is
// split from routines.ts.
//
// The interval gate lives here and nowhere else. It compares against the
// server's own clock, never a client-supplied timestamp — defeating the gate
// is precisely what the feature exists to prevent, so the one authority on
// "has enough time passed" is this mutation.

// Logs one rep. Rejected if the interval has not elapsed since the newest rep,
// measured from that rep and not from any schedule, so being late never earns
// banked reps. Completes the task once the day's count reaches the target.
export const logRep = mutation({
  args: { taskId: v.id("dailyTasks"), today: v.string() },
  handler: async (ctx, { taskId, today }) => {
    const task = await requireOwnedTask(ctx, taskId);
    if (!task.repeatTarget) throw new Error("This task does not repeat");
    if (task.status !== "open") throw new Error("Task is not open");

    const now = Date.now();
    if (!isRepAllowed(task.lastRepAt, task.repeatIntervalMinutes, now)) {
      const wait = remainingMs(
        nextAllowedAt(task.lastRepAt, task.repeatIntervalMinutes),
        now,
      );
      throw new Error(
        `Too soon — wait ${formatCountdown(wait)} before the next one`,
      );
    }

    // Reps are counted per client-local day, which is what makes a partially
    // done task restart at 0/N tomorrow without any reset logic.
    const repsToday = await ctx.db
      .query("taskCompletions")
      .withIndex("by_task_date", (q) =>
        q.eq("taskId", taskId).eq("date", today),
      )
      .collect();
    const doneToday = repsToday.length + 1;
    const reachedTarget = doneToday >= task.repeatTarget;

    await ctx.db.insert("taskCompletions", {
      userId: task.userId,
      taskId,
      date: today,
      completedAt: now,
    });

    if (reachedTarget) {
      await ctx.db.patch(taskId, {
        lastRepAt: now,
        status: "completed",
        completedAt: now,
        completedDate: today,
      });
      // Once, at full completion — a rep on its own never moves the goal.
      await applyGoalContribution(ctx, task.goalId, task.goalContribution, 1);
      await upsertDayStats(ctx, task.userId, today);
    } else {
      await ctx.db.patch(taskId, { lastRepAt: now });
    }

    return { doneToday, target: task.repeatTarget, completed: reachedTarget };
  },
});

// Reverses the newest rep logged on `today`. Not gated — an undo is a
// correction, not a completion. Restoring lastRepAt from the rep that now
// sits newest is the reason reps are a log rather than a counter: the gate
// has to fall back to where it stood before the undone rep.
export const undoRep = mutation({
  args: { taskId: v.id("dailyTasks"), today: v.string() },
  handler: async (ctx, { taskId, today }) => {
    const task = await requireOwnedTask(ctx, taskId);
    if (!task.repeatTarget) throw new Error("This task does not repeat");

    // Scoped to today so an undo can never reach back and eat a rep that
    // belongs to an earlier day's count.
    const newest = await ctx.db
      .query("taskCompletions")
      .withIndex("by_task_date", (q) =>
        q.eq("taskId", taskId).eq("date", today),
      )
      .order("desc")
      .first();
    if (!newest) return { doneToday: 0, target: task.repeatTarget };

    await ctx.db.delete(newest._id);
    const previous = await ctx.db
      .query("taskCompletions")
      .withIndex("by_task", (q) => q.eq("taskId", taskId))
      .order("desc")
      .first();

    if (task.status === "completed") {
      await ctx.db.patch(taskId, {
        lastRepAt: previous?.completedAt,
        status: "open",
        completedAt: undefined,
        completedDate: undefined,
      });
      await applyGoalContribution(ctx, task.goalId, task.goalContribution, -1);
      await upsertDayStats(
        ctx,
        task.userId,
        task.completedDate ?? task.currentDate,
      );
    } else {
      await ctx.db.patch(taskId, { lastRepAt: previous?.completedAt });
    }

    const repsToday = await ctx.db
      .query("taskCompletions")
      .withIndex("by_task_date", (q) =>
        q.eq("taskId", taskId).eq("date", today),
      )
      .collect();
    return { doneToday: repsToday.length, target: task.repeatTarget };
  },
});
