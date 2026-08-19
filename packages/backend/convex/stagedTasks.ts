import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { requireOwnedStagedTask } from "./lib/ownership";
import { resolveUser } from "./lib/resolveUser";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await resolveUser(ctx);
    if (!user) return [];
    return await ctx.db
      .query("stagedTasks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const trimmed = args.title.trim();
    if (!trimmed) throw new Error("Task title is required");
    return await ctx.db.insert("stagedTasks", {
      userId: user._id,
      title: trimmed,
      description: args.description?.trim() || undefined,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { stagedTaskId: v.id("stagedTasks") },
  handler: async (ctx, { stagedTaskId }) => {
    await requireOwnedStagedTask(ctx, stagedTaskId);
    await ctx.db.delete(stagedTaskId);
  },
});
