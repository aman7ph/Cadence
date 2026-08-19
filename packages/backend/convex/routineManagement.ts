import { validateRepeatArgs } from "@cadence/shared";
import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { requireOwnedRoutine } from "./lib/ownership";
import { deleteRoutineReps } from "./lib/routineRepeat";
import { repairLongestStreaksFor } from "./lib/routineStreakRepair";

const scheduleType = v.union(
  v.literal("daily"),
  v.literal("weekdays"),
  v.literal("custom"),
);

// A custom schedule with no days would never fire, and a day index outside
// 0..6 silently never matches — both are rejected rather than stored.
function validateCustomDays(
  sType: "daily" | "weekdays" | "custom",
  customDays: number[] | undefined,
): void {
  if (sType !== "custom") return;
  if (!customDays || customDays.length === 0)
    throw new Error("Custom schedule needs at least one day");
  for (const d of customDays) {
    if (!Number.isInteger(d) || d < 0 || d > 6)
      throw new Error("customDays entries must be 0..6");
  }
}

export const update = mutation({
  args: {
    routineId: v.id("routines"),
    name: v.string(),
    description: v.optional(v.string()),
    scheduleType,
    customDays: v.optional(v.array(v.number())),
    goalId: v.optional(v.id("goals")),
    goalContribution: v.optional(v.number()),
    repeatTarget: v.optional(v.number()),
    repeatIntervalMinutes: v.optional(v.number()),
  },
  handler: async (
    ctx,
    {
      routineId,
      name,
      description,
      scheduleType: sType,
      customDays,
      goalId,
      goalContribution,
      repeatTarget,
      repeatIntervalMinutes,
    },
  ) => {
    const routine = await requireOwnedRoutine(ctx, routineId);
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Routine name is required");
    validateRepeatArgs(repeatTarget, repeatIntervalMinutes);
    validateCustomDays(sType, customDays);
    await ctx.db.patch(routineId, {
      name: trimmed,
      description: description?.trim() || undefined,
      scheduleType: sType,
      customDays: sType === "custom" ? customDays : undefined,
      goalId: goalId,
      goalContribution: goalContribution,
      repeatTarget,
      repeatIntervalMinutes,
      // Turning repeat off must not strand a stale gate on the routine.
      lastRepAt: repeatTarget === undefined ? undefined : routine.lastRepAt,
    });
  },
});

export const archive = mutation({
  args: { routineId: v.id("routines"), today: v.string() },
  handler: async (ctx, { routineId, today }) => {
    await requireOwnedRoutine(ctx, routineId);
    await ctx.db.patch(routineId, { isActive: false, archivedDate: today });
  },
});

export const restore = mutation({
  args: { routineId: v.id("routines") },
  handler: async (ctx, { routineId }) => {
    await requireOwnedRoutine(ctx, routineId);
    await ctx.db.patch(routineId, { isActive: true, archivedDate: undefined });
  },
});

// `internalMutation`, so no client can reach it — an operator tool, run as
//   npx convex run routineManagement:repairLongestStreaks '{"userId":"…","today":"…","dryRun":true}'
// and again without dryRun, exactly like taskDays:backfillTaskDays. Internal
// functions carry no auth identity, hence the explicit userId; and no client
// clock, hence the explicit today.
//
// What it repairs and why is in lib/routineStreakRepair.ts.
export const repairLongestStreaks = internalMutation({
  args: {
    userId: v.id("users"),
    today: v.string(),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, { userId, today, dryRun }) =>
    repairLongestStreaksFor(ctx, userId, today, !!dryRun),
});

export const permanentDelete = mutation({
  args: { routineId: v.id("routines") },
  handler: async (ctx, { routineId }) => {
    await requireOwnedRoutine(ctx, routineId);
    const completions = await ctx.db
      .query("routineCompletions")
      .withIndex("by_routine_date", (q) => q.eq("routineId", routineId))
      .collect();
    await Promise.all(completions.map((c) => ctx.db.delete(c._id)));
    await deleteRoutineReps(ctx, routineId);
    await ctx.db.delete(routineId);
  },
});
