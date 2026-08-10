import { v } from "convex/values";
import { addDays, consistencyScore, countsTowardRate, daysBetween, resolveDayStatus } from "@cadence/shared";
import type { ScheduledDayStatus } from "@cadence/shared";
import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { isScheduledOn } from "./lib/schedule";
import { resolveUser } from "./lib/resolveUser";
import { loadCompletionsByRoutine } from "./lib/routineCompletions";
import { deriveStreaks } from "./lib/streak";

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
// `today` decides which scheduled days are still pending — see lib/routineDay.ts.
export const routineConsistency = query({
  args: { from: v.string(), to: v.string(), today: v.string() },
  handler: async (ctx, { from, to, today }): Promise<RoutineConsistencyRow[]> => {
    const user = await resolveUser(ctx);
    if (!user) return [];

    const routines = await ctx.db
      .query("routines")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isActive", true),
      )
      .collect();
    if (routines.length === 0) return [];

    const byRoutine = await loadCompletionsByRoutine(ctx, user._id, from, to);
    // Streaks are derived, not read off the stored field — see lib/streak.ts.
    // Its own range is the streak lookback, which is why it is a separate read.
    const streaks = await deriveStreaks(ctx, user._id, routines, today);

    const windowDays = daysBetween(from, to);

    return routines.map((r): RoutineConsistencyRow => {
      const entry = byRoutine.get(r._id);
      const entries: Array<{ daysAgo: number; hit: boolean }> = [];
      let scheduled = 0;
      let completedCount = 0;
      for (let i = 0; i < windowDays; i++) {
        const day = addDays(to, -i);
        if (day < r.createdDate) break;
        if (day < from) break;
        if (!isScheduledOn(r, day)) continue;
        // Skipped days are neutral and pending days have no answer yet, so
        // both leave the fraction entirely rather than counting as failures.
        const status = resolveDayStatus(entry?.get(day), day, today);
        if (!countsTowardRate(status)) continue;
        const hit = status === "completed";
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
        currentStreak: streaks.get(r._id) ?? 0,
        longestStreak: r.longestStreak,
      };
    });
  },
});

export type RoutineTimelineDay = {
  date: string;
  status: ScheduledDayStatus;
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

    const byRoutine = await loadCompletionsByRoutine(ctx, user._id, from, to);
    const windowDays = daysBetween(from, to);

    return routines.map((r): RoutineTimelineRow => {
      const records = byRoutine.get(r._id);
      const days: RoutineTimelineDay[] = [];
      for (let i = windowDays - 1; i >= 0; i--) {
        const day = addDays(to, -i);
        if (day < from) continue;
        if (day < r.createdDate) continue;
        if (!isScheduledOn(r, day)) continue;
        days.push({
          date: day,
          status: resolveDayStatus(records?.get(day), day, today),
        });
      }
      return { routineId: r._id, name: r.name, days };
    });
  },
});
