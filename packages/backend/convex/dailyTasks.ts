import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { upsertDayStats } from "./lib/dayStats";

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    today: v.string(),
    goalId: v.optional(v.id("goals")),
    goalContribution: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const trimmed = args.title.trim();
    if (!trimmed) throw new Error("Task title is required");
    return await ctx.db.insert("dailyTasks", {
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
    });
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
    if (task.status === "completed") return;
    await ctx.db.patch(taskId, {
      status: "completed",
      completedAt: Date.now(),
      completedDate: today,
    });
    if (task.goalId && task.goalContribution) {
      const goal = await ctx.db.get(task.goalId);
      if (goal) {
        await ctx.db.patch(task.goalId, {
          currentValue: Math.max(0, (goal.currentValue ?? 0) + task.goalContribution),
        });
      }
    }
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
    if (task.status === "open") return;
    const affectedDate = task.completedDate ?? task.currentDate;
    const wasCompleted = task.status === "completed";
    await ctx.db.patch(taskId, {
      status: "open",
      completedAt: undefined,
      completedDate: undefined,
    });
    if (wasCompleted && task.goalId && task.goalContribution) {
      const goal = await ctx.db.get(task.goalId);
      if (goal) {
        await ctx.db.patch(task.goalId, {
          currentValue: Math.max(0, (goal.currentValue ?? 0) - task.goalContribution),
        });
      }
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
    await ctx.db.delete(taskId);
    if (affectedDate) {
      await upsertDayStats(ctx, user._id, affectedDate);
    }
  },
});

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
    for (const t of openTasks) {
      if (t.currentDate < today) {
        await ctx.db.patch(t._id, {
          currentDate: today,
          carryoverCount: t.carryoverCount + 1,
        });
      }
    }
  },
});
