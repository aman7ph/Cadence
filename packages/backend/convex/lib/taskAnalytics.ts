// Every analytics query over random tasks starts with the same scan: tasks
// whose originalDate falls in [from, to], optionally narrowed to one status.
// It was written out four times, and the `by_user_original` index name and the
// gte/lte pair had to be right in all four.
//
// originalDate, not currentDate, is the axis on purpose: these queries ask
// "what did this window produce", so a task belongs to the day it was added
// even after it carries forward.

import type { QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

export async function loadTasksByOriginRange(
  ctx: QueryCtx,
  userId: Id<"users">,
  from: string,
  to: string,
  status?: "open" | "completed",
): Promise<Doc<"dailyTasks">[]> {
  const scan = ctx.db
    .query("dailyTasks")
    .withIndex("by_user_original", (q) =>
      q.eq("userId", userId).gte("originalDate", from).lte("originalDate", to),
    );
  return status
    ? await scan.filter((q) => q.eq(q.field("status"), status)).collect()
    : await scan.collect();
}

// Counts keyed by a day string, sorted into ascending date order — the shape
// every chart on the Insights page consumes.
export function toSortedRows<T extends object>(
  byDate: Map<string, T>,
): ({ date: string } & T)[] {
  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, ...value }));
}
