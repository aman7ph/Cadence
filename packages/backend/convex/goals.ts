import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { resolveUser } from "./lib/resolveUser";

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    targetValue: v.optional(v.number()),
    currentValue: v.optional(v.number()),
    unit: v.optional(v.string()),
    dueDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const trimmed = args.title.trim();
    if (!trimmed) throw new Error("Goal title is required");
    return await ctx.db.insert("goals", {
      userId: user._id,
      title: trimmed,
      description: args.description?.trim() || undefined,
      status: "active",
      targetValue: args.targetValue,
      currentValue: args.currentValue,
      unit: args.unit?.trim() || undefined,
      dueDate: args.dueDate || undefined,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: { includeInactive: v.optional(v.boolean()) },
  handler: async (ctx, { includeInactive }) => {
    const user = await resolveUser(ctx);
    if (!user) return [];
    if (includeInactive) {
      return await ctx.db
        .query("goals")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
    }
    return await ctx.db
      .query("goals")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "active"),
      )
      .collect();
  },
});

export const get = query({
  args: { goalId: v.id("goals") },
  handler: async (ctx, { goalId }) => {
    const user = await resolveUser(ctx);
    if (!user) return null;
    const goal = await ctx.db.get(goalId);
    if (!goal || goal.userId !== user._id) return null;
    return goal;
  },
});

export const update = mutation({
  args: {
    goalId: v.id("goals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    targetValue: v.optional(v.number()),
    unit: v.optional(v.string()),
    dueDate: v.optional(v.string()),
  },
  handler: async (ctx, { goalId, title, description, targetValue, unit, dueDate }) => {
    const user = await requireUser(ctx);
    const goal = await ctx.db.get(goalId);
    if (!goal || goal.userId !== user._id) throw new Error("Goal not found");
    const patch: {
      title?: string;
      description?: string;
      targetValue?: number;
      unit?: string;
      dueDate?: string;
    } = {};
    if (title !== undefined) patch.title = title.trim();
    if (description !== undefined) patch.description = description.trim() || undefined;
    if (targetValue !== undefined) patch.targetValue = targetValue;
    if (unit !== undefined) patch.unit = unit.trim() || undefined;
    if (dueDate !== undefined) patch.dueDate = dueDate || undefined;
    await ctx.db.patch(goalId, patch);
  },
});

export const updateProgress = mutation({
  args: { goalId: v.id("goals"), currentValue: v.number() },
  handler: async (ctx, { goalId, currentValue }) => {
    const user = await requireUser(ctx);
    const goal = await ctx.db.get(goalId);
    if (!goal || goal.userId !== user._id) throw new Error("Goal not found");
    await ctx.db.patch(goalId, { currentValue });
  },
});

export const complete = mutation({
  args: { goalId: v.id("goals") },
  handler: async (ctx, { goalId }) => {
    const user = await requireUser(ctx);
    const goal = await ctx.db.get(goalId);
    if (!goal || goal.userId !== user._id) throw new Error("Goal not found");
    await ctx.db.patch(goalId, { status: "completed", completedAt: Date.now() });
  },
});

export const abandon = mutation({
  args: { goalId: v.id("goals") },
  handler: async (ctx, { goalId }) => {
    const user = await requireUser(ctx);
    const goal = await ctx.db.get(goalId);
    if (!goal || goal.userId !== user._id) throw new Error("Goal not found");
    await ctx.db.patch(goalId, { status: "abandoned" });
  },
});

export const remove = mutation({
  args: { goalId: v.id("goals") },
  handler: async (ctx, { goalId }) => {
    const user = await requireUser(ctx);
    const goal = await ctx.db.get(goalId);
    if (!goal || goal.userId !== user._id) throw new Error("Goal not found");
    // Unlink tasks
    const tasks = await ctx.db
      .query("dailyTasks")
      .withIndex("by_goal", (q) => q.eq("goalId", goalId))
      .collect();
    for (const task of tasks) {
      await ctx.db.patch(task._id, { goalId: undefined, goalContribution: undefined });
    }
    // Unlink routines
    const routines = await ctx.db
      .query("routines")
      .withIndex("by_goal", (q) => q.eq("goalId", goalId))
      .collect();
    for (const routine of routines) {
      await ctx.db.patch(routine._id, { goalId: undefined, goalContribution: undefined });
    }
    await ctx.db.delete(goalId);
  },
});

