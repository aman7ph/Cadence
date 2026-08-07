import { nextAllowedAt } from "@cadence/shared";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { isScheduledOn } from "./lib/schedule";
import { loadDayReflection } from "./lib/dayReflection";
import { carryoverOn, loadDayTasks, statusOn } from "./lib/taskDay";
import { countRepsByTask } from "./lib/taskRepeat";
import { countRepsByRoutine } from "./lib/routineRepeat";
import type { DayReflection } from "./lib/dayReflection";
import type { DayRoutine, DayTask } from "./lib/dayTypes";
import type { Doc, Id } from "./_generated/dataModel";

export type { DayReflection, DayRoutine, DayTask };

export type DayView = {
  date: string;
  routines: DayRoutine[];
  randomTasks: DayTask[];
  reflection: DayReflection | null;
};

export const getDay = query({
  args: { date: v.string() },
  handler: async (ctx, { date }): Promise<DayView | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    if (!user) return null;

    // All routines, not just active ones: isScheduledOn already excludes any
    // date before createdDate or after archivedDate, so filtering on isActive
    // here only ever erased archived routines from the *past* days they really
    // ran on. This is the same read upsertDayStats does, so the day view and
    // the day's score now agree on what was scheduled.
    const allRoutines = await ctx.db
      .query("routines")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const completionsToday = await ctx.db
      .query("routineCompletions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).eq("date", date),
      )
      .collect();
    const completionByRoutine = new Map<
      Id<"routines">,
      Doc<"routineCompletions">
    >();
    for (const c of completionsToday) {
      completionByRoutine.set(c.routineId, c);
    }

    const scheduledRoutines = allRoutines.filter((r) => isScheduledOn(r, date));
    const goalIds = [...new Set(scheduledRoutines.map((r) => r.goalId).filter((id): id is Id<"goals"> => !!id))];
    const goalTitleMap = new Map<Id<"goals">, string>((await Promise.all(goalIds.map((id) => ctx.db.get(id)))).filter(Boolean).map((g) => [g!._id, g!.title]));

    // Same guard as tasks: only read the rep log when the day actually has a
    // repeat routine on it.
    const repsByRoutine = scheduledRoutines.some((r) => r.repeatTarget)
      ? await countRepsByRoutine(ctx, user._id, date)
      : new Map<Id<"routines">, number>();

    const routines: DayRoutine[] = [];
    for (const r of scheduledRoutines) {
      const c = completionByRoutine.get(r._id);
      routines.push({
        routineId: r._id,
        name: r.name,
        description: r.description,
        scheduleType: r.scheduleType,
        customDays: r.customDays,
        status: c ? c.status : "pending",
        currentStreak: r.currentStreak,
        longestStreak: r.longestStreak,
        goalId: r.goalId,
        goalTitle: r.goalId ? goalTitleMap.get(r.goalId) : undefined,
        repeatTarget: r.repeatTarget,
        repeatIntervalMinutes: r.repeatIntervalMinutes,
        repeatDoneToday: r.repeatTarget ? (repsByRoutine.get(r._id) ?? 0) : undefined,
        nextRepAllowedAt: r.repeatTarget
          ? nextAllowedAt(r.lastRepAt, r.repeatIntervalMinutes)
          : undefined,
      });
    }

    // Read by presence, not by currentDate: a task that has since rolled over
    // still belongs to the days it actually sat on. See lib/taskDay.ts.
    const tasksToday = await loadDayTasks(ctx, user._id, date);
    const tkGoalIds = [...new Set(tasksToday.map(t => t.goalId).filter((id): id is Id<"goals"> => !!id))].filter(id => !goalTitleMap.has(id));
    (await Promise.all(tkGoalIds.map(id => ctx.db.get(id)))).forEach(g => g && goalTitleMap.set(g._id, g.title));

    // Read the rep log only when a repeat task is actually on the day, so
    // other days' subscriptions take no dependency on taskCompletions.
    const repCountByTask = tasksToday.some((t) => t.repeatTarget)
      ? await countRepsByTask(ctx, user._id, date)
      : new Map<Id<"dailyTasks">, number>();

    const randomTasks: DayTask[] = tasksToday.map((t) => ({
      taskId: t._id,
      title: t.title,
      description: t.description,
      category: t.category,
      status: statusOn(t, date),
      isCarriedOver: date > t.originalDate,
      originalDate: t.originalDate,
      carryoverCount: carryoverOn(t, date),
      completedDate: t.completedDate,
      goalTitle: t.goalId ? goalTitleMap.get(t.goalId) : undefined,
      repeatTarget: t.repeatTarget,
      repeatIntervalMinutes: t.repeatIntervalMinutes,
      repeatDoneToday: t.repeatTarget ? (repCountByTask.get(t._id) ?? 0) : undefined,
      nextRepAllowedAt: t.repeatTarget
        ? nextAllowedAt(t.lastRepAt, t.repeatIntervalMinutes)
        : undefined,
    }));

    const reflection = await loadDayReflection(ctx, user._id, date);

    return { date, routines, randomTasks, reflection };
  },
});
