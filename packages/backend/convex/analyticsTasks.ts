import { v } from "convex/values";
import { query } from "./_generated/server";
import { resolveUser } from "./lib/resolveUser";

export type RandomByDayRow = {
  date: string;
  added: number;
  completed: number;
  dismissed: number;
  open: number;
};

// Tasks added (by originalDate) and their terminal status, grouped by day.
export const randomTasksByDay = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, { from, to }): Promise<RandomByDayRow[]> => {
    const user = await resolveUser(ctx);
    if (!user) return [];

    const tasks = await ctx.db
      .query("dailyTasks")
      .withIndex("by_user_original", (q) =>
        q.eq("userId", user._id).gte("originalDate", from).lte("originalDate", to),
      )
      .collect();

    const byDay = new Map<string, { added: number; completed: number; dismissed: number; open: number }>();
    for (const t of tasks) {
      const day = t.originalDate;
      const entry = byDay.get(day) ?? { added: 0, completed: 0, dismissed: 0, open: 0 };
      entry.added += 1;
      if (t.status === "completed") entry.completed += 1;
      else if (t.status === "dismissed") entry.dismissed += 1;
      else entry.open += 1;
      byDay.set(day, entry);
    }

    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));
  },
});

export type CarryoverDistributionBucket = { times: number; count: number };

export type AvgCarryoverResult = {
  avg: number;
  distribution: CarryoverDistributionBucket[];
};

// Completed task carryover distribution in [from, to].
export const avgCarryover = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, { from, to }): Promise<AvgCarryoverResult> => {
    const user = await resolveUser(ctx);
    if (!user) return { avg: 0, distribution: [] };

    const tasks = await ctx.db
      .query("dailyTasks")
      .withIndex("by_user_original", (q) =>
        q.eq("userId", user._id).gte("originalDate", from).lte("originalDate", to),
      )
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    if (tasks.length === 0) return { avg: 0, distribution: [] };

    const counts = [0, 0, 0, 0];
    let totalCarryovers = 0;
    for (const t of tasks) {
      const c = t.carryoverCount ?? 0;
      totalCarryovers += c;
      counts[Math.min(c, 3)]! += 1;
    }

    return {
      avg: totalCarryovers / tasks.length,
      distribution: [
        { times: 0, count: counts[0]! },
        { times: 1, count: counts[1]! },
        { times: 2, count: counts[2]! },
        { times: 3, count: counts[3]! },
      ],
    };
  },
});

export type OpenByOriginRow = { date: string; count: number };

// Tasks created in [from, to] still open today.
export const openTasksByOriginDate = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, { from, to }): Promise<OpenByOriginRow[]> => {
    const user = await resolveUser(ctx);
    if (!user) return [];

    const tasks = await ctx.db
      .query("dailyTasks")
      .withIndex("by_user_original", (q) =>
        q.eq("userId", user._id).gte("originalDate", from).lte("originalDate", to),
      )
      .filter((q) => q.eq(q.field("status"), "open"))
      .collect();

    const byDate = new Map<string, number>();
    for (const t of tasks) {
      byDate.set(t.originalDate, (byDate.get(t.originalDate) ?? 0) + 1);
    }

    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  },
});

export type RandomStatsResult = {
  onTime: number;
  afterCarryover: number;
  never: number;
  total: number;
};

// Breakdown of random tasks in [from, to] by terminal fate. Open tasks excluded.
export const randomStats = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, { from, to }): Promise<RandomStatsResult> => {
    const user = await resolveUser(ctx);
    if (!user) return { onTime: 0, afterCarryover: 0, never: 0, total: 0 };

    const tasks = await ctx.db
      .query("dailyTasks")
      .withIndex("by_user_original", (q) =>
        q.eq("userId", user._id).gte("originalDate", from).lte("originalDate", to),
      )
      .collect();

    let onTime = 0;
    let afterCarryover = 0;
    let never = 0;
    for (const t of tasks) {
      if (t.status === "completed") {
        if (t.carryoverCount === 0) onTime += 1;
        else afterCarryover += 1;
      } else if (t.status === "dismissed") {
        never += 1;
      }
    }
    return { onTime, afterCarryover, never, total: onTime + afterCarryover + never };
  },
});
