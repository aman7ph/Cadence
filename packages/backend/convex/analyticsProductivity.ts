import { v } from "convex/values";
import { addDays, daysBetween, productivityScore } from "@cadence/shared";
import { query } from "./_generated/server";
import { isScheduledOn } from "./lib/schedule";
import { resolveUser } from "./lib/resolveUser";

export type DayStatsRow = {
  date: string;
  routineScheduled: number;
  routineCompleted: number;
  randomTotal: number;
  randomCompleted: number;
  productivityScore: number;
};

// Range of dayStats rows in [from, to] inclusive for the current user.
export const dayStatsRange = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, { from, to }): Promise<DayStatsRow[]> => {
    const user = await resolveUser(ctx);
    if (!user) return [];
    const rows = await ctx.db
      .query("dayStats")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).gte("date", from).lte("date", to),
      )
      .collect();
    return rows.map((r) => ({
      date: r.date,
      routineScheduled: r.routineScheduled,
      routineCompleted: r.routineCompleted,
      randomTotal: r.randomTotal,
      randomCompleted: r.randomCompleted,
      productivityScore: productivityScore(
        {
          routineCompleted: r.routineCompleted,
          routineScheduled: r.routineScheduled,
          randomCompleted: r.randomCompleted,
          randomTotal: r.randomTotal,
        },
        user.routineWeight,
      ),
    }));
  },
});

export type DayOfWeekStat = {
  weekday: number;
  scheduled: number;
  completed: number;
  rate: number | null;
};

// Completion rate by weekday (0=Sun … 6=Sat). Skipped days excluded.
export const dayOfWeekStats = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, { from, to }): Promise<DayOfWeekStat[]> => {
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

    const stats = Array.from({ length: 7 }, (_, i) => ({
      weekday: i, scheduled: 0, completed: 0,
    }));

    const windowDays = daysBetween(from, to);
    for (let i = 0; i < windowDays; i++) {
      const day = addDays(to, -i);
      if (day < from) break;
      const [y, m, d] = day.split("-").map(Number);
      const weekday = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
      for (const r of routines) {
        if (day < r.createdDate) continue;
        if (!isScheduledOn(r, day)) continue;
        const status = completionMap.get(`${r._id}:${day}`);
        if (status === "skipped") continue;
        stats[weekday]!.scheduled += 1;
        if (status === "completed") stats[weekday]!.completed += 1;
      }
    }

    return stats.map((s) => ({
      weekday: s.weekday,
      scheduled: s.scheduled,
      completed: s.completed,
      rate: s.scheduled > 0 ? Math.round((s.completed / s.scheduled) * 100) : null,
    }));
  },
});
