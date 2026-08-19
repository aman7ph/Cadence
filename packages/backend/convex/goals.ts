import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { requireOwnedGoal } from "./lib/ownership";
import { resolveUser } from "./lib/resolveUser";
import { buildGoalPatch, unlinkGoalEverywhere } from "./lib/goalWrite";

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
  handler: async (
    ctx,
    { goalId, title, description, targetValue, unit, dueDate },
  ) => {
    await requireOwnedGoal(ctx, goalId);
    await ctx.db.patch(
      goalId,
      buildGoalPatch({ title, description, targetValue, unit, dueDate }),
    );
  },
});

export const updateProgress = mutation({
  args: { goalId: v.id("goals"), currentValue: v.number() },
  handler: async (ctx, { goalId, currentValue }) => {
    await requireOwnedGoal(ctx, goalId);
    await ctx.db.patch(goalId, { currentValue });
  },
});

export const complete = mutation({
  args: { goalId: v.id("goals") },
  handler: async (ctx, { goalId }) => {
    await requireOwnedGoal(ctx, goalId);
    await ctx.db.patch(goalId, {
      status: "completed",
      completedAt: Date.now(),
    });
  },
});

export const abandon = mutation({
  args: { goalId: v.id("goals") },
  handler: async (ctx, { goalId }) => {
    await requireOwnedGoal(ctx, goalId);
    await ctx.db.patch(goalId, { status: "abandoned" });
  },
});

export const remove = mutation({
  args: { goalId: v.id("goals") },
  handler: async (ctx, { goalId }) => {
    await requireOwnedGoal(ctx, goalId);
    await unlinkGoalEverywhere(ctx, goalId);
    await ctx.db.delete(goalId);
  },
});
