import { v } from "convex/values";
import { query } from "./_generated/server";
import { resolveUser } from "./lib/resolveUser";
import { carryoverForTask } from "./lib/carryover";

export type RandomByDayRow = {
  date: string;
  added: number;
  completed: number;
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

    const byDay = new Map<string, { added: number; completed: number; open: number }>();
    for (const t of tasks) {
      const day = t.originalDate;
      const entry = byDay.get(day) ?? { added: 0, completed: 0, open: 0 };
      entry.added += 1;
      if (t.status === "completed") entry.completed += 1;
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
      const c = carryoverForTask(t); // derived, not the stored event counter
      totalCarryovers += c;
      counts[Math.min(c, counts.length - 1)]! += 1;
    }

    return {
      avg: totalCarryovers / tasks.length,
      // Index is the carry count; the last bucket is the "3+" overflow.
      distribution: counts.map((count, times) => ({ times, count })),
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
  total: number;
};

// Breakdown of completed random tasks in [from, to] by how long they took.
// Open tasks are excluded: an unfinished task has no fate to report yet. The
// third bucket here used to be dismissed tasks; with that status retired,
// completion is the only terminal state a task has.
export const randomStats = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, { from, to }): Promise<RandomStatsResult> => {
    const user = await resolveUser(ctx);
    if (!user) return { onTime: 0, afterCarryover: 0, total: 0 };

    const tasks = await ctx.db
      .query("dailyTasks")
      .withIndex("by_user_original", (q) =>
        q.eq("userId", user._id).gte("originalDate", from).lte("originalDate", to),
      )
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    let onTime = 0;
    let afterCarryover = 0;
    for (const t of tasks) {
      // "On time" must mean it never sat overnight — see lib/carryover.ts.
      if (carryoverForTask(t) === 0) onTime += 1;
      else afterCarryover += 1;
    }
    return { onTime, afterCarryover, total: onTime + afterCarryover };
  },
});
