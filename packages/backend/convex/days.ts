import { v } from "convex/values";
import { query } from "./_generated/server";
import { isScheduledOn } from "./lib/schedule";
import type { Doc, Id } from "./_generated/dataModel";

export type DayRoutine = {
  routineId: Id<"routines">;
  name: string;
  description?: string;
  scheduleType: Doc<"routines">["scheduleType"];
  customDays?: number[];
  status: "completed" | "skipped" | "pending";
  currentStreak: number;
  longestStreak: number;
  goalId?: Id<"goals">;
  goalTitle?: string;
};

export type DayTask = {
  taskId: Id<"dailyTasks">;
  title: string;
  description?: string;
  category?: string;
  status: Doc<"dailyTasks">["status"];
  isCarriedOver: boolean;
  originalDate: string;
  carryoverCount: number;
  completedDate?: string;
  goalTitle?: string;
};

export type DayReflection = {
  text: string;
  taggedRoutineIds: Id<"routines">[];
  taggedTaskIds: Id<"dailyTasks">[];
  updatedAt: number;
};

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

    const activeRoutines = await ctx.db
      .query("routines")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isActive", true),
      )
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

    const scheduledRoutines = activeRoutines.filter((r) => isScheduledOn(r, date));
    const goalIds = [...new Set(scheduledRoutines.map((r) => r.goalId).filter((id): id is Id<"goals"> => !!id))];
    const goalTitleMap = new Map<Id<"goals">, string>((await Promise.all(goalIds.map((id) => ctx.db.get(id)))).filter(Boolean).map((g) => [g!._id, g!.title]));

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
      });
    }

    const tasksToday = await ctx.db
      .query("dailyTasks")
      .withIndex("by_user_current", (q) =>
        q.eq("userId", user._id).eq("currentDate", date),
      )
      .collect();
    const tkGoalIds = [...new Set(tasksToday.map(t => t.goalId).filter((id): id is Id<"goals"> => !!id))].filter(id => !goalTitleMap.has(id));
    (await Promise.all(tkGoalIds.map(id => ctx.db.get(id)))).forEach(g => g && goalTitleMap.set(g._id, g.title));

    const randomTasks: DayTask[] = tasksToday.map((t) => ({
      taskId: t._id,
      title: t.title,
      description: t.description,
      category: t.category,
      status: t.status,
      isCarriedOver: t.currentDate > t.originalDate,
      originalDate: t.originalDate,
      carryoverCount: t.carryoverCount,
      completedDate: t.completedDate,
      goalTitle: t.goalId ? goalTitleMap.get(t.goalId) : undefined,
    }));

    const reflectionDoc = await ctx.db
      .query("dailyReflections")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).eq("date", date),
      )
      .unique();

    let reflection: DayReflection | null = null;
    if (reflectionDoc) {
      const tags = await ctx.db
        .query("reflectionTags")
        .withIndex("by_reflection", (q) =>
          q.eq("reflectionId", reflectionDoc._id),
        )
        .collect();
      reflection = {
        text: reflectionDoc.text,
        taggedRoutineIds: tags
          .map((t) => t.routineId)
          .filter((id): id is Id<"routines"> => id !== undefined),
        taggedTaskIds: tags
          .map((t) => t.taskId)
          .filter((id): id is Id<"dailyTasks"> => id !== undefined),
        updatedAt: reflectionDoc.updatedAt,
      };
    }

    return { date, routines, randomTasks, reflection };
  },
});
