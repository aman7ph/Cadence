import { v } from "convex/values";
import {
  addDays,
  countsTowardRate,
  daysBetween,
  resolveDayStatus,
} from "@cadence/shared";
import { query } from "./_generated/server";
import { isScheduledOn } from "./lib/schedule";
import { resolveUser } from "./lib/resolveUser";
import { loadCompletionsByRoutine } from "./lib/routineCompletions";
import { deriveDayStatsRange } from "./lib/dayStatsDerive";

export type DayStatsRow = {
  date: string;
  routineScheduled: number;
  routineCompleted: number;
  randomTotal: number;
  randomCompleted: number;
  productivityScore: number;
};

// Every day in [from, to] that had something on its plate, derived from source
// data rather than read from the stored dayStats table.
//
// The stored table is still written, but no query reads it any more. It only
// ever held rows for days a mutation happened to touch, so a day where five
// routines were scheduled and none were done had no row at all and rendered as
// "no activity" — and five mutations (task create, open-task delete, routine
// create, archive/restore/delete, staged promotion) never refreshed the rows
// that did exist. Deriving removes both failure modes and the second source of
// truth that caused them. See lib/dayStatsDerive.ts.
export const dayStatsRange = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, { from, to }): Promise<DayStatsRow[]> => {
    const user = await resolveUser(ctx);
    if (!user) return [];
    return await deriveDayStatsRange(
      ctx,
      user._id,
      from,
      to,
      user.routineWeight,
    );
  },
});

export type DayOfWeekStat = {
  weekday: number;
  scheduled: number;
  completed: number;
  rate: number | null;
};

// Completion rate by weekday (0=Sun … 6=Sat). Skipped and still-pending days
// are both excluded — see lib/routineDay.ts for why today is not a miss.
export const dayOfWeekStats = query({
  args: { from: v.string(), to: v.string(), today: v.string() },
  handler: async (ctx, { from, to, today }): Promise<DayOfWeekStat[]> => {
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

    const stats = Array.from({ length: 7 }, (_, i) => ({
      weekday: i,
      scheduled: 0,
      completed: 0,
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
        const status = resolveDayStatus(
          byRoutine.get(r._id)?.get(day),
          day,
          today,
        );
        if (!countsTowardRate(status)) continue;
        stats[weekday]!.scheduled += 1;
        if (status === "completed") stats[weekday]!.completed += 1;
      }
    }

    return stats.map((s) => ({
      weekday: s.weekday,
      scheduled: s.scheduled,
      completed: s.completed,
      rate:
        s.scheduled > 0 ? Math.round((s.completed / s.scheduled) * 100) : null,
    }));
  },
});
