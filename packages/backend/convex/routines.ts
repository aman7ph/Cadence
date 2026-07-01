import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { recomputeStreak } from "./lib/streak";
import { upsertDayStats } from "./lib/dayStats";
import { setStatus } from "./lib/routineSetStatus";

const scheduleType = v.union(
  v.literal("daily"),
  v.literal("weekdays"),
  v.literal("custom"),
);

export const list = query({
  args: { includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, { includeArchived }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    if (!user) return [];

    if (includeArchived) {
      return await ctx.db
        .query("routines")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .collect();
    }
    return await ctx.db
      .query("routines")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isActive", true),
      )
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    scheduleType,
    customDays: v.optional(v.array(v.number())),
    today: v.string(),
    goalId: v.optional(v.id("goals")),
    goalContribution: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const trimmed = args.name.trim();
    if (!trimmed) throw new Error("Routine name is required");
    if (args.scheduleType === "custom") {
      if (!args.customDays || args.customDays.length === 0) {
        throw new Error("Custom schedule needs at least one day");
      }
      for (const d of args.customDays) {
        if (!Number.isInteger(d) || d < 0 || d > 6) {
          throw new Error("customDays entries must be 0..6");
        }
      }
    }
    return await ctx.db.insert("routines", {
      userId: user._id,
      name: trimmed,
      description: args.description?.trim() || undefined,
      scheduleType: args.scheduleType,
      customDays: args.scheduleType === "custom" ? args.customDays : undefined,
      isActive: true,
      createdDate: args.today,
      currentStreak: 0,
      longestStreak: 0,
      goalId: args.goalId,
      goalContribution: args.goalContribution,
    });
  },
});

export const complete = mutation({
  args: { routineId: v.id("routines"), date: v.string(), today: v.string() },
  handler: async (ctx, args) => {
    await setStatus(ctx, { ...args, status: "completed" });
  },
});

export const skip = mutation({
  args: { routineId: v.id("routines"), date: v.string(), today: v.string() },
  handler: async (ctx, args) => {
    await setStatus(ctx, { ...args, status: "skipped" });
  },
});

export const uncomplete = mutation({
  args: { routineId: v.id("routines"), date: v.string(), today: v.string() },
  handler: async (ctx, { routineId, date, today }) => {
    const user = await requireUser(ctx);
    const routine = await ctx.db.get(routineId);
    if (!routine || routine.userId !== user._id) throw new Error("Routine not found");
    const existing = await ctx.db
      .query("routineCompletions")
      .withIndex("by_routine_date", (q) =>
        q.eq("routineId", routineId).eq("date", date),
      )
      .unique();
    if (existing) {
      const wasCompleted = existing.status === "completed";
      await ctx.db.delete(existing._id);
      if (wasCompleted && routine.goalId && routine.goalContribution) {
        const goal = await ctx.db.get(routine.goalId);
        if (goal) {
          await ctx.db.patch(routine.goalId, {
            currentValue: Math.max(0, (goal.currentValue ?? 0) - routine.goalContribution),
          });
        }
      }
      await recomputeStreak(ctx, routineId, today);
      await upsertDayStats(ctx, user._id, date);
    }
  },
});
