import { v } from "convex/values";
import { addDays, consistencyScore, daysBetween } from "@cadence/shared";
import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { isScheduledOn } from "./lib/schedule";
import { resolveUser } from "./lib/resolveUser";

const CONSISTENCY_TAU_DAYS = 14;

export type RoutineConsistencyRow = {
  routineId: Id<"routines">;
  name: string;
  scheduled: number;
  completed: number;
  rate: number | null;
  consistency: number;
  currentStreak: number;
  longestStreak: number;
};

// Per active-routine recency-weighted consistency score over [from, to].
export const routineConsistency = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, { from, to }): Promise<RoutineConsistencyRow[]> => {
    const user = await resolveUser(ctx);
    if (!user) return [];

    const routines = await ctx.db
      .query("routines")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isActive", true),
      )
      .collect();
    if (routines.length === 0) return [];

    const completions = await ctx.db
      .query("routineCompletions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).gte("date", from).lte("date", to),
      )
      .collect();

    const byRoutine = new Map<Id<"routines">, { completed: Set<string>; skipped: Set<string> }>();
    for (const c of completions) {
      let entry = byRoutine.get(c.routineId);
      if (!entry) {
        entry = { completed: new Set(), skipped: new Set() };
        byRoutine.set(c.routineId, entry);
      }
      if (c.status === "completed") entry.completed.add(c.date);
      else entry.skipped.add(c.date);
    }

    const windowDays = daysBetween(from, to);

    return routines.map((r): RoutineConsistencyRow => {
      const entry = byRoutine.get(r._id) ?? { completed: new Set<string>(), skipped: new Set<string>() };
      const entries: Array<{ daysAgo: number; hit: boolean }> = [];
      let scheduled = 0;
      let completedCount = 0;
      for (let i = 0; i < windowDays; i++) {
        const day = addDays(to, -i);
        if (day < r.createdDate) break;
        if (day < from) break;
        if (!isScheduledOn(r, day)) continue;
        if (entry.skipped.has(day)) continue;
        const hit = entry.completed.has(day);
        entries.push({ daysAgo: i, hit });
        scheduled += 1;
        if (hit) completedCount += 1;
      }
      const consistency = consistencyScore(entries, CONSISTENCY_TAU_DAYS);
      const rate = scheduled > 0 ? Math.round((completedCount / scheduled) * 100) : null;
      return {
        routineId: r._id,
        name: r.name,
        scheduled,
        completed: completedCount,
        rate,
        consistency,
        currentStreak: r.currentStreak,
        longestStreak: r.longestStreak,
      };
    });
  },
});

export type RoutineTimelineDay = {
  date: string;
  status: "completed" | "skipped" | "missed" | "pending";
};

export type RoutineTimelineRow = {
  routineId: Id<"routines">;
  name: string;
  days: RoutineTimelineDay[];
};

// Per-routine daily completion status for the line chart.
export const routineTimeline = query({
  args: { from: v.string(), to: v.string(), today: v.string() },
  handler: async (ctx, { from, to, today }): Promise<RoutineTimelineRow[]> => {
    const user = await resolveUser(ctx);
    if (!user) return [];

    const routines = await ctx.db
      .query("routines")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isActive", true),
      )
      .collect();
    if (routines.length === 0) return [];

    const completions = await ctx.db
      .query("routineCompletions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).gte("date", from).lte("date", to),
      )
      .collect();

    const completionMap = new Map<string, "completed" | "skipped">();
    for (const c of completions) {
      completionMap.set(`${c.routineId}:${c.date}`, c.status);
    }

    const windowDays = daysBetween(from, to);

    return routines.map((r): RoutineTimelineRow => {
      const days: RoutineTimelineDay[] = [];
      for (let i = windowDays - 1; i >= 0; i--) {
        const day = addDays(to, -i);
        if (day < from) continue;
        if (day < r.createdDate) continue;
        if (!isScheduledOn(r, day)) continue;
        const status = completionMap.get(`${r._id}:${day}`);
        let resolved: RoutineTimelineDay["status"];
        if (status === "completed") resolved = "completed";
        else if (status === "skipped") resolved = "skipped";
        else if (day < today) resolved = "missed";
        else resolved = "pending";
        days.push({ date: day, status: resolved });
      }
      return { routineId: r._id, name: r.name, days };
    });
  },
});
