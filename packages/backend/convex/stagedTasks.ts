import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";
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

export const update = mutation({
  args: {
    stagedTaskId: v.id("stagedTasks"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { stagedTaskId, title, description }) => {
    const user = await requireUser(ctx);
    const staged = await ctx.db.get(stagedTaskId);
    if (!staged || staged.userId !== user._id) {
      throw new Error("Staged task not found");
    }
    const trimmed = title.trim();
    if (!trimmed) throw new Error("Task title is required");
    await ctx.db.patch(stagedTaskId, {
      title: trimmed,
      description: description?.trim() || undefined,
    });
  },
});

export const remove = mutation({
  args: { stagedTaskId: v.id("stagedTasks") },
  handler: async (ctx, { stagedTaskId }) => {
    const user = await requireUser(ctx);
    const staged = await ctx.db.get(stagedTaskId);
    if (!staged || staged.userId !== user._id) {
      throw new Error("Staged task not found");
    }
    await ctx.db.delete(stagedTaskId);
  },
});
