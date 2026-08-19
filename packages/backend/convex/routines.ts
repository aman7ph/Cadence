import { validateRepeatArgs } from "@cadence/shared";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { requireOwnedRoutine } from "./lib/ownership";
import { clearStatus, setStatus } from "./lib/routineSetStatus";
import { assertPlainRoutine } from "./lib/routineRepeat";
import { deriveStreaks } from "./lib/streak";

const scheduleType = v.union(
  v.literal("daily"),
  v.literal("weekdays"),
  v.literal("custom"),
);

// `today` is required because currentStreak is overridden with the derived
// value (see lib/streak.ts) — the stored field goes stale the moment a
// scheduled day is missed, and only the client knows its own local date.
export const list = query({
  args: { includeArchived: v.optional(v.boolean()), today: v.string() },
  handler: async (ctx, { includeArchived, today }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    if (!user) return [];

    const routines = includeArchived
      ? await ctx.db
          .query("routines")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .order("desc")
          .collect()
      : await ctx.db
          .query("routines")
          .withIndex("by_user_active", (q) =>
            q.eq("userId", user._id).eq("isActive", true),
          )
          .order("desc")
          .collect();

    const streaks = await deriveStreaks(ctx, user._id, routines, today);
    return routines.map((r) => ({
      ...r,
      currentStreak: streaks.get(r._id) ?? 0,
    }));
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
    repeatTarget: v.optional(v.number()),
    repeatIntervalMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const trimmed = args.name.trim();
    if (!trimmed) throw new Error("Routine name is required");
    validateRepeatArgs(args.repeatTarget, args.repeatIntervalMinutes);
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
      repeatTarget: args.repeatTarget,
      repeatIntervalMinutes: args.repeatIntervalMinutes,
    });
  },
});

export const complete = mutation({
  args: { routineId: v.id("routines"), date: v.string(), today: v.string() },
  handler: async (ctx, args) => {
    const routine = await ctx.db.get(args.routineId);
    if (routine) assertPlainRoutine(routine);
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
    const routine = await requireOwnedRoutine(ctx, routineId);
    // Un-skipping a repeat routine is fine; only reversing a completion has to
    // go through undoRep, which repairs the rep log alongside the status.
    const existing = await ctx.db
      .query("routineCompletions")
      .withIndex("by_routine_date", (q) =>
        q.eq("routineId", routineId).eq("date", date),
      )
      .unique();
    if (existing?.status === "completed") assertPlainRoutine(routine);
    await clearStatus(ctx, { routineId, date, today });
  },
});
