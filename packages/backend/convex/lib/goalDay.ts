// One goal's slice of one day: the routines it owns that were scheduled, and
// the tasks linked to it that were present.
//
// It mirrors days.getDay deliberately and in detail — the goal's daily tracking
// renders the same rows as Today, so any disagreement about a streak or a
// carryover count would show up as the same routine reading differently on two
// screens.

import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { isScheduledOn } from "./schedule";
import { carryoverOn, loadDayTasks, statusOn } from "./taskDay";
import { countRepsByTask } from "./taskRepeat";
import { deriveStreaksFrom, streakRangeStart } from "./streak";
import { loadCompletionsByRoutine } from "./routineCompletions";
import type { DayRoutine, DayTask } from "../days";

export async function loadGoalDay(
  ctx: QueryCtx,
  userId: Id<"users">,
  goalId: Id<"goals">,
  date: string,
): Promise<{ routines: DayRoutine[]; tasks: DayTask[] }> {
  const goalRoutines = await ctx.db
    .query("routines")
    .withIndex("by_goal", (q) => q.eq("goalId", goalId))
    .collect();
  const scheduled = goalRoutines.filter(
    (r) => r.isActive && isScheduledOn(r, date),
  );
  // One read for both the day's statuses and the streaks, as days.getDay does
  // — the viewed date sits inside the streak lookback that ends on it.
  const completions = await loadCompletionsByRoutine(
    ctx,
    userId,
    streakRangeStart(date),
    date,
  );
  // Derived as of the viewed date, exactly as days.getDay does — the two
  // render the same rows and must not disagree about a streak.
  const streaks = deriveStreaksFrom(scheduled, completions, date);
  const routines: DayRoutine[] = scheduled.map((r) => ({
    routineId: r._id,
    name: r.name,
    description: r.description,
    scheduleType: r.scheduleType,
    customDays: r.customDays,
    status: completions.get(r._id)?.get(date) ?? "pending",
    currentStreak: streaks.get(r._id) ?? 0,
    longestStreak: r.longestStreak,
    goalId: r.goalId,
  }));

  // By presence, not currentDate — same reason as days.getDay: a carried task
  // still belongs to the days it sat on. See lib/taskDay.ts.
  const dayTasks = await loadDayTasks(ctx, userId, date);
  const goalTasks = dayTasks.filter((t) => t.goalId === goalId);
  // Repeat progress, so a repeat task on the goal's daily tracking shows
  // "2/5" like it does everywhere else instead of rendering as a plain row.
  const repCounts = goalTasks.some((t) => t.repeatTarget)
    ? await countRepsByTask(ctx, userId, date)
    : new Map<Id<"dailyTasks">, number>();
  const tasks: DayTask[] = goalTasks.map((t) => ({
    taskId: t._id,
    title: t.title,
    description: t.description,
    category: t.category,
    status: statusOn(t, date),
    isCarriedOver: date > t.originalDate,
    originalDate: t.originalDate,
    carryoverCount: carryoverOn(t, date),
    repeatTarget: t.repeatTarget,
    repeatDoneToday: t.repeatTarget ? (repCounts.get(t._id) ?? 0) : undefined,
  }));

  return { routines, tasks };
}
