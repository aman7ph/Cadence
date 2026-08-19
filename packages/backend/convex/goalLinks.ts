import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwnedRoutine, requireOwnedTask } from "./lib/ownership";
import { resolveUser } from "./lib/resolveUser";
import { loadGoalDay } from "./lib/goalDay";
import type { DayRoutine, DayTask } from "./days";

export const getWithLinkedCounts = query({
  args: {},
  handler: async (ctx) => {
    const user = await resolveUser(ctx);
    if (!user) return [];
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "active"),
      )
      .collect();
    return Promise.all(
      goals.map(async (goal) => {
        const tasks = await ctx.db
          .query("dailyTasks")
          .withIndex("by_goal", (q) => q.eq("goalId", goal._id))
          .collect();
        const routines = await ctx.db
          .query("routines")
          .withIndex("by_goal", (q) => q.eq("goalId", goal._id))
          .collect();
        return { goal, taskCount: tasks.length, routineCount: routines.length };
      }),
    );
  },
});

export const getLinkedItems = query({
  args: { goalId: v.id("goals") },
  handler: async (ctx, { goalId }) => {
    const user = await resolveUser(ctx);
    if (!user) return null;
    const goal = await ctx.db.get(goalId);
    if (!goal || goal.userId !== user._id) return null;
    const tasks = await ctx.db
      .query("dailyTasks")
      .withIndex("by_goal", (q) => q.eq("goalId", goalId))
      .collect();
    const routines = await ctx.db
      .query("routines")
      .withIndex("by_goal", (q) => q.eq("goalId", goalId))
      .collect();
    return { goal, tasks, routines };
  },
});

export const unlinkTask = mutation({
  args: { taskId: v.id("dailyTasks") },
  handler: async (ctx, { taskId }) => {
    await requireOwnedTask(ctx, taskId);
    await ctx.db.patch(taskId, {
      goalId: undefined,
      goalContribution: undefined,
    });
  },
});

export const unlinkRoutine = mutation({
  args: { routineId: v.id("routines") },
  handler: async (ctx, { routineId }) => {
    await requireOwnedRoutine(ctx, routineId);
    await ctx.db.patch(routineId, {
      goalId: undefined,
      goalContribution: undefined,
    });
  },
});

export const getDayForGoal = query({
  args: { goalId: v.id("goals"), date: v.string() },
  handler: async (
    ctx,
    { goalId, date },
  ): Promise<{ routines: DayRoutine[]; tasks: DayTask[] } | null> => {
    const user = await resolveUser(ctx);
    if (!user) return null;
    const goal = await ctx.db.get(goalId);
    if (!goal || goal.userId !== user._id) return null;
    return await loadGoalDay(ctx, user._id, goalId, date);
  },
});
