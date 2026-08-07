import { validateRepeatArgs } from "@cadence/shared";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { upsertDayStats } from "./lib/dayStats";
import { applyGoalContribution } from "./lib/goalContribution";
import { deleteTaskDays, recordTaskDaySpan } from "./lib/taskDay";
import { assertPlainTask, deleteTaskCompletions } from "./lib/taskRepeat";

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    today: v.string(),
    goalId: v.optional(v.id("goals")),
    goalContribution: v.optional(v.number()),
    repeatTarget: v.optional(v.number()),
    repeatIntervalMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const trimmed = args.title.trim();
    if (!trimmed) throw new Error("Task title is required");
    validateRepeatArgs(args.repeatTarget, args.repeatIntervalMinutes);
    const taskId = await ctx.db.insert("dailyTasks", {
      userId: user._id,
      title: trimmed,
      description: args.description?.trim() || undefined,
      category: args.category?.trim() || undefined,
      originalDate: args.today,
      currentDate: args.today,
      status: "open",
      carryoverCount: 0,
      createdAt: Date.now(),
      goalId: args.goalId,
      goalContribution: args.goalContribution,
      repeatTarget: args.repeatTarget,
      repeatIntervalMinutes: args.repeatIntervalMinutes,
    });
    await recordTaskDaySpan(ctx, user._id, taskId, args.today, args.today);
    return taskId;
  },
});

export const complete = mutation({
  args: { taskId: v.id("dailyTasks"), today: v.string() },
  handler: async (ctx, { taskId, today }) => {
    const user = await requireUser(ctx);
    const task = await ctx.db.get(taskId);
    if (!task || task.userId !== user._id) {
      throw new Error("Task not found");
    }
    assertPlainTask(task);
    if (task.status === "completed") return;
    await ctx.db.patch(taskId, {
      status: "completed",
      completedAt: Date.now(),
      completedDate: today,
    });
    await applyGoalContribution(ctx, task.goalId, task.goalContribution, 1);
    await upsertDayStats(ctx, user._id, today);
  },
});

export const uncomplete = mutation({
  args: { taskId: v.id("dailyTasks") },
  handler: async (ctx, { taskId }) => {
    const user = await requireUser(ctx);
    const task = await ctx.db.get(taskId);
    if (!task || task.userId !== user._id) {
      throw new Error("Task not found");
    }
    // Restoring a *dismissed* repeat task is fine here; only reversing a
    // completion must go through undoRep, which repairs the rep log too.
    if (task.status === "completed") assertPlainTask(task);
    if (task.status === "open") return;
    const affectedDate = task.completedDate ?? task.currentDate;
    const wasCompleted = task.status === "completed";
    await ctx.db.patch(taskId, {
      status: "open",
      completedAt: undefined,
      completedDate: undefined,
    });
    if (wasCompleted) {
      await applyGoalContribution(ctx, task.goalId, task.goalContribution, -1);
    }
    await upsertDayStats(ctx, user._id, affectedDate);
  },
});

export const dismiss = mutation({
  args: { taskId: v.id("dailyTasks") },
  handler: async (ctx, { taskId }) => {
    const user = await requireUser(ctx);
    const task = await ctx.db.get(taskId);
    if (!task || task.userId !== user._id) {
      throw new Error("Task not found");
    }
    if (task.status === "dismissed") return;
    await ctx.db.patch(taskId, { status: "dismissed" });
    await upsertDayStats(ctx, user._id, task.currentDate);
  },
});

export const remove = mutation({
  args: { taskId: v.id("dailyTasks") },
  handler: async (ctx, { taskId }) => {
    const user = await requireUser(ctx);
    const task = await ctx.db.get(taskId);
    if (!task || task.userId !== user._id) {
      throw new Error("Task not found");
    }
    const linked = await ctx.db
      .query("reflectionTags")
      .withIndex("by_task", (q) => q.eq("taskId", taskId))
      .first();
    if (linked) {
      throw new Error(
        "This task is mentioned in a reflection. Remove the @mention first.",
      );
    }
    const affectedDate = task.status === "completed" ? (task.completedDate ?? task.currentDate) : task.status === "dismissed" ? task.currentDate : null;
    await deleteTaskCompletions(ctx, taskId);
    await deleteTaskDays(ctx, taskId);
    await ctx.db.delete(taskId);
    if (affectedDate) {
      await upsertDayStats(ctx, user._id, affectedDate);
    }
  },
});
