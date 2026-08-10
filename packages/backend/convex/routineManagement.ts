import { computeLongestStreak, validateRepeatArgs } from "@cadence/shared";
import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { deleteRoutineReps } from "./lib/routineRepeat";
import { isScheduledOn } from "./lib/schedule";
import { loadCompletionsByRoutine } from "./lib/routineCompletions";

const scheduleType = v.union(
  v.literal("daily"),
  v.literal("weekdays"),
  v.literal("custom"),
);

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
  handler: async (ctx, { routineId, name, description, scheduleType: sType, customDays, goalId, goalContribution, repeatTarget, repeatIntervalMinutes }) => {
    const user = await requireUser(ctx);
    const routine = await ctx.db.get(routineId);
    if (!routine || routine.userId !== user._id) throw new Error("Routine not found");
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Routine name is required");
    validateRepeatArgs(repeatTarget, repeatIntervalMinutes);
    if (sType === "custom") {
      if (!customDays || customDays.length === 0) throw new Error("Custom schedule needs at least one day");
      for (const d of customDays) {
        if (!Number.isInteger(d) || d < 0 || d > 6) throw new Error("customDays entries must be 0..6");
      }
    }
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
    const user = await requireUser(ctx);
    const routine = await ctx.db.get(routineId);
    if (!routine || routine.userId !== user._id) throw new Error("Routine not found");
    await ctx.db.patch(routineId, { isActive: false, archivedDate: today });
  },
});

export const restore = mutation({
  args: { routineId: v.id("routines") },
  handler: async (ctx, { routineId }) => {
    const user = await requireUser(ctx);
    const routine = await ctx.db.get(routineId);
    if (!routine || routine.userId !== user._id) throw new Error("Routine not found");
    await ctx.db.patch(routineId, { isActive: true, archivedDate: undefined });
  },
});

// Recomputes routines.longestStreak from the completion log and patches any
// routine whose stored value disagrees.
//
// `internalMutation`, so no client can reach it — an operator tool, run as
//   npx convex run routineManagement:repairLongestStreaks '{"userId":"…","today":"…","dryRun":true}'
// and again without dryRun, exactly like taskDays:backfillTaskDays. Internal
// functions carry no auth identity, hence the explicit userId; and no client
// clock, hence the explicit today.
//
// It patches toward the truth in BOTH directions rather than only lowering. The
// log is the authority: a stored value above it is inflated, one below it lost a
// run that really happened, and both are wrong.
//
// currentStreak is deliberately left alone — Step 3 made it derived at read
// time, so the stored field is a write-time cache that nothing displays.
export const repairLongestStreaks = internalMutation({
  args: { userId: v.id("users"), today: v.string(), dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { userId, today, dryRun }) => {
    const routines = await ctx.db
      .query("routines")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (routines.length === 0) return { routinesScanned: 0, changed: 0, dryRun: !!dryRun, changes: [] };

    const earliest = routines.reduce((min, r) => (r.createdDate < min ? r.createdDate : min), today);
    const byRoutine = await loadCompletionsByRoutine(ctx, userId, earliest, today);

    const changes = [];
    for (const routine of routines) {
      const completedDates = new Set<string>();
      const skippedDates = new Set<string>();
      for (const [date, status] of byRoutine.get(routine._id) ?? []) {
        if (status === "completed") completedDates.add(date);
        else skippedDates.add(date);
      }
      const trueLongest = computeLongestStreak({
        completedDates,
        skippedDates,
        createdDate: routine.createdDate,
        endDate: routine.archivedDate && routine.archivedDate < today ? routine.archivedDate : today,
        isScheduledOn: (date) => isScheduledOn(routine, date),
      });
      if (trueLongest === routine.longestStreak) continue;
      changes.push({ name: routine.name, before: routine.longestStreak, after: trueLongest });
      if (!dryRun) await ctx.db.patch(routine._id, { longestStreak: trueLongest });
    }

    return { routinesScanned: routines.length, changed: changes.length, dryRun: !!dryRun, changes };
  },
});

export const permanentDelete = mutation({
  args: { routineId: v.id("routines") },
  handler: async (ctx, { routineId }) => {
    const user = await requireUser(ctx);
    const routine = await ctx.db.get(routineId);
    if (!routine || routine.userId !== user._id) throw new Error("Routine not found");
    const completions = await ctx.db
      .query("routineCompletions")
      .withIndex("by_routine_date", (q) => q.eq("routineId", routineId))
      .collect();
    await Promise.all(completions.map((c) => ctx.db.delete(c._id)));
    await deleteRoutineReps(ctx, routineId);
    await ctx.db.delete(routineId);
  },
});
