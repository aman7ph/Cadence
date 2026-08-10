import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { resolveUser } from "./lib/resolveUser";
import { isScheduledOn } from "./lib/schedule";
import { carryoverOn, loadDayTasks, statusOn } from "./lib/taskDay";
import { countRepsByTask } from "./lib/taskRepeat";
import { deriveStreaksFrom, streakRangeStart } from "./lib/streak";
import { loadCompletionsByRoutine } from "./lib/routineCompletions";
import type { Id } from "./_generated/dataModel";
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
    // One read for both the day's statuses and the streaks, as days.getDay does
    // — the viewed date sits inside the streak lookback that ends on it.
    const completions = await loadCompletionsByRoutine(ctx, user._id, streakRangeStart(date), date);
    // Derived as of the viewed date, exactly as days.getDay does — the two
    // render the same rows and must not disagree about a streak.
    const streaks = deriveStreaksFrom(scheduled, completions, date);
    const routines: DayRoutine[] = scheduled.map((r) => ({
      routineId: r._id, name: r.name, description: r.description,
      scheduleType: r.scheduleType, customDays: r.customDays,
      status: completions.get(r._id)?.get(date) ?? "pending",
      currentStreak: streaks.get(r._id) ?? 0, longestStreak: r.longestStreak, goalId: r.goalId,
    }));

    // By presence, not currentDate — same reason as days.getDay: a carried task
    // still belongs to the days it sat on. See lib/taskDay.ts.
    const dayTasks = await loadDayTasks(ctx, user._id, date);
    const goalTasks = dayTasks.filter((t) => t.goalId === goalId);
    // Repeat progress, so a repeat task on the goal's daily tracking shows
    // "2/5" like it does everywhere else instead of rendering as a plain row.
    const repCounts = goalTasks.some((t) => t.repeatTarget)
      ? await countRepsByTask(ctx, user._id, date)
      : new Map<Id<"dailyTasks">, number>();
    const tasks: DayTask[] = goalTasks.map((t) => ({
      taskId: t._id, title: t.title, description: t.description, category: t.category,
      status: statusOn(t, date), isCarriedOver: date > t.originalDate,
      originalDate: t.originalDate, carryoverCount: carryoverOn(t, date),
      repeatTarget: t.repeatTarget,
      repeatDoneToday: t.repeatTarget ? (repCounts.get(t._id) ?? 0) : undefined,
    }));

    return { routines, tasks };
  },
});
