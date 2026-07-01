import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { resolveUser } from "./lib/resolveUser";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

async function loadTags(ctx: QueryCtx, reflectionDoc: Doc<"dailyReflections">) {
  const tags = await ctx.db
    .query("reflectionTags")
    .withIndex("by_reflection", (q) => q.eq("reflectionId", reflectionDoc._id))
    .collect();
  return {
    date: reflectionDoc.date,
    text: reflectionDoc.text,
    taggedRoutineIds: tags
      .map((t) => t.routineId)
      .filter((id): id is Id<"routines"> => id !== undefined),
    taggedTaskIds: tags
      .map((t) => t.taskId)
      .filter((id): id is Id<"dailyTasks"> => id !== undefined),
    updatedAt: reflectionDoc.updatedAt,
  };
}

// Upserts today's reflection text and does a full replace of the tags join table.
// Client sends the complete tags list on every save — no diffing needed.
export const upsert = mutation({
  args: {
    date: v.string(),
    text: v.string(),
    tags: v.array(
      v.object({
        entityId: v.string(),
        entityType: v.union(v.literal("task"), v.literal("routine")),
      }),
    ),
  },
  handler: async (ctx, { date, text, tags }) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("dailyReflections")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).eq("date", date),
      )
      .unique();

    let reflectionId: Id<"dailyReflections">;
    if (!existing) {
      reflectionId = await ctx.db.insert("dailyReflections", {
        userId: user._id,
        date,
        text,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      reflectionId = existing._id;
      await ctx.db.patch(existing._id, { text, updatedAt: Date.now() });
    }

    // Full replace: delete old tag rows, insert new ones
    const oldTags = await ctx.db
      .query("reflectionTags")
      .withIndex("by_reflection", (q) => q.eq("reflectionId", reflectionId))
      .collect();
    for (const tag of oldTags) {
      await ctx.db.delete(tag._id);
    }
    for (const tag of tags) {
      await ctx.db.insert("reflectionTags", {
        userId: user._id,
        reflectionId,
        taskId:
          tag.entityType === "task"
            ? (tag.entityId as Id<"dailyTasks">)
            : undefined,
        routineId:
          tag.entityType === "routine"
            ? (tag.entityId as Id<"routines">)
            : undefined,
      });
    }

    return reflectionId;
  },
});

export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const user = await resolveUser(ctx);
    if (!user) return null;
    const doc = await ctx.db
      .query("dailyReflections")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).eq("date", date),
      )
      .unique();
    if (!doc) return null;
    return loadTags(ctx, doc);
  },
});

export const getRange = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, { from, to }) => {
    const user = await resolveUser(ctx);
    if (!user) return [];
    const docs = await ctx.db
      .query("dailyReflections")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).gte("date", from).lte("date", to),
      )
      .order("desc")
      .collect();
    return Promise.all(docs.map((doc) => loadTags(ctx, doc)));
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const user = await resolveUser(ctx);
    if (!user) return [];
    const docs = await ctx.db
      .query("dailyReflections")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit ?? 5);
    return Promise.all(docs.map((doc) => loadTags(ctx, doc)));
  },
});
