import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUser } from "./lib/auth";

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
  },
  handler: async (ctx, { routineId, name, description, scheduleType: sType, customDays, goalId, goalContribution }) => {
    const user = await requireUser(ctx);
    const routine = await ctx.db.get(routineId);
    if (!routine || routine.userId !== user._id) throw new Error("Routine not found");
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Routine name is required");
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
    await ctx.db.delete(routineId);
  },
});
