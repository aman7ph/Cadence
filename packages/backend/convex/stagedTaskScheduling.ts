import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { promoteStagedTask } from "./lib/promoteStagedTask";

const targetType = v.union(v.literal("task"), v.literal("routine"));
const routineScheduleType = v.union(
  v.literal("daily"),
  v.literal("weekdays"),
  v.literal("custom"),
);

export const schedule = mutation({
  args: {
    stagedTaskId: v.id("stagedTasks"),
    title: v.string(),
    description: v.optional(v.string()),
    targetType,
    scheduledDate: v.string(),
    routineScheduleType: v.optional(routineScheduleType),
    routineCustomDays: v.optional(v.array(v.number())),
    goalId: v.optional(v.id("goals")),
    goalContribution: v.optional(v.number()),
    today: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const staged = await ctx.db.get(args.stagedTaskId);
    if (!staged || staged.userId !== user._id) {
      throw new Error("Staged task not found");
    }
    const trimmed = args.title.trim();
    if (!trimmed) throw new Error("Task title is required");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.scheduledDate)) {
      throw new Error("Scheduled date must be YYYY-MM-DD");
    }
    if (args.scheduledDate < args.today) {
      throw new Error("Scheduled date cannot be in the past");
    }
    if (args.targetType === "routine") {
      if (!args.routineScheduleType) {
        throw new Error("Routine schedule is required");
      }
      if (args.routineScheduleType === "custom") {
        if (!args.routineCustomDays || args.routineCustomDays.length === 0) {
          throw new Error("Custom schedule needs at least one day");
        }
        for (const d of args.routineCustomDays) {
          if (!Number.isInteger(d) || d < 0 || d > 6) {
            throw new Error("customDays entries must be 0..6");
          }
        }
      }
    }
    const isRoutine = args.targetType === "routine";
    await ctx.db.patch(args.stagedTaskId, {
      title: trimmed,
      description: args.description?.trim() || undefined,
      scheduledDate: args.scheduledDate,
      targetType: args.targetType,
      routineScheduleType: isRoutine ? args.routineScheduleType : undefined,
      routineCustomDays:
        isRoutine && args.routineScheduleType === "custom"
          ? args.routineCustomDays
          : undefined,
      goalId: args.goalId,
      goalContribution: args.goalContribution,
    });
    if (args.scheduledDate <= args.today) {
      const fresh = await ctx.db.get(args.stagedTaskId);
      if (fresh) await promoteStagedTask(ctx, fresh, args.today);
      return { promoted: true };
    }
    return { promoted: false };
  },
});

export const unschedule = mutation({
  args: { stagedTaskId: v.id("stagedTasks") },
  handler: async (ctx, { stagedTaskId }) => {
    const user = await requireUser(ctx);
    const staged = await ctx.db.get(stagedTaskId);
    if (!staged || staged.userId !== user._id) {
      throw new Error("Staged task not found");
    }
    await ctx.db.patch(stagedTaskId, {
      scheduledDate: undefined,
      targetType: undefined,
      routineScheduleType: undefined,
      routineCustomDays: undefined,
      goalId: undefined,
      goalContribution: undefined,
    });
  },
});

// Idempotent: promoted rows are deleted, so re-running (or concurrent runs
// from multiple devices) finds nothing left to promote. Called from the
// RolloverOnForeground workers with the client's local today, same as
// dailyTasks.rolloverOpenTasks.
export const promoteDue = mutation({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const user = await requireUser(ctx);
    const staged = await ctx.db
      .query("stagedTasks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const s of staged) {
      if (s.scheduledDate !== undefined && s.scheduledDate <= today) {
        await promoteStagedTask(ctx, s, today);
      }
    }
  },
});
