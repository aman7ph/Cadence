import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { resolveUser } from "./lib/resolveUser";
import { isScheduledOn } from "./lib/schedule";
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
    const user = await requireUser(ctx);
    const task = await ctx.db.get(taskId);
    if (!task || task.userId !== user._id) throw new Error("Task not found");
    await ctx.db.patch(taskId, { goalId: undefined, goalContribution: undefined });
  },
});

export const unlinkRoutine = mutation({
  args: { routineId: v.id("routines") },
  handler: async (ctx, { routineId }) => {
    const user = await requireUser(ctx);
    const routine = await ctx.db.get(routineId);
    if (!routine || routine.userId !== user._id) throw new Error("Routine not found");
    await ctx.db.patch(routineId, { goalId: undefined, goalContribution: undefined });
  },
});

export const getDayForGoal = query({
  args: { goalId: v.id("goals"), date: v.string() },
  handler: async (ctx, { goalId, date }): Promise<{ routines: DayRoutine[]; tasks: DayTask[] } | null> => {
    const user = await resolveUser(ctx);
    if (!user) return null;
    const goal = await ctx.db.get(goalId);
    if (!goal || goal.userId !== user._id) return null;

    const goalRoutines = await ctx.db.query("routines")
      .withIndex("by_goal", (q) => q.eq("goalId", goalId)).collect();
    const scheduled = goalRoutines.filter((r) => r.isActive && isScheduledOn(r, date));
    const completions = await ctx.db.query("routineCompletions")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id).eq("date", date)).collect();
    const compMap = new Map(completions.map((c) => [c.routineId, c.status as "completed" | "skipped"]));
    const routines: DayRoutine[] = scheduled.map((r) => ({
      routineId: r._id, name: r.name, description: r.description,
      scheduleType: r.scheduleType, customDays: r.customDays,
      status: compMap.get(r._id) ?? "pending",
      currentStreak: r.currentStreak, longestStreak: r.longestStreak, goalId: r.goalId,
    }));

    const dayTasks = await ctx.db.query("dailyTasks")
      .withIndex("by_user_current", (q) => q.eq("userId", user._id).eq("currentDate", date)).collect();
    const tasks: DayTask[] = dayTasks.filter((t) => t.goalId === goalId).map((t) => ({
      taskId: t._id, title: t.title, description: t.description, category: t.category,
      status: t.status, isCarriedOver: t.currentDate > t.originalDate,
      originalDate: t.originalDate, carryoverCount: t.carryoverCount,
    }));

    return { routines, tasks };
  },
});
