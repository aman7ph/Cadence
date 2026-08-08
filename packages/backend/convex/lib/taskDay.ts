import { addDays, daysBetween } from "@cadence/shared";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

// Writes to the taskDays presence log — the record of which days a task sat on
// the user's plate. See tables/tasks.ts for why the log exists at all.
//
// The invariant every writer upholds: presence is CONTIGUOUS. A task has a row
// for every day from its originalDate up to the day it currently sits on. This
// matters because rolloverOpenTasks only fires when the app is opened — leave a
// task open on the 1st and next open the app on the 5th and it patches
// currentDate in a single jump, so writing one row for the 5th would leave the
// 2nd–4th empty. Spans, not single days, are what keep the log honest.

// A span is bounded only by how long the user stayed away, so it is capped:
// a long absence with many open tasks would otherwise write an unbounded number
// of rows in one mutation. A gap longer than this keeps its most recent days
// and drops the oldest — an explicit, documented loss beats an unbounded write.
export const MAX_SPAN_DAYS = 120;

// The days in an inclusive span, with the cap applied. Shared so that the
// presence writer and anything reasoning about "which days did this change"
// (rolloverOpenTasks recomputing day stats) agree exactly on the range.
export function spanDates(from: string, to: string): string[] {
  if (from > to) return [];
  // daysBetween is inclusive, so a 120-day cap starts 119 days before the end.
  const start =
    daysBetween(from, to) > MAX_SPAN_DAYS
      ? addDays(to, -(MAX_SPAN_DAYS - 1))
      : from;
  const dates: string[] = [];
  for (let date = start; date <= to; date = addDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}

export type SpanResult = { inserted: number; skipped: number };

// Idempotent per day: rollover runs on every foreground and the backfill is
// meant to be re-runnable, so an existing row for a day is left alone rather
// than duplicated. Per-day (not per-task) idempotency is what lets the backfill
// safely extend a task the live write path has already partly covered.
//
// `dryRun` counts what it would write without writing, so a backfill can be
// inspected before it touches anything.
export async function recordTaskDaySpan(
  ctx: MutationCtx,
  userId: Id<"users">,
  taskId: Id<"dailyTasks">,
  from: string,
  to: string,
  opts: { dryRun?: boolean } = {},
): Promise<SpanResult> {
  const result: SpanResult = { inserted: 0, skipped: 0 };
  for (const date of spanDates(from, to)) {
    const existing = await ctx.db
      .query("taskDays")
      .withIndex("by_task_date", (q) =>
        q.eq("taskId", taskId).eq("date", date),
      )
      .first();
    if (existing) {
      result.skipped += 1;
      continue;
    }
    if (!opts.dryRun) {
      await ctx.db.insert("taskDays", { userId, taskId, date });
    }
    result.inserted += 1;
  }
  return result;
}

// The tasks that were on the user's plate on `date`. Replaces reading
// dailyTasks by currentDate, which only ever finds tasks that have not since
// rolled over — the bug this whole module exists to fix.
//
// Sorted by createdAt so the order is stable and meaningful (creation order)
// rather than following the order presence rows happened to be written in.
export async function loadDayTasks(
  ctx: QueryCtx,
  userId: Id<"users">,
  date: string,
): Promise<Doc<"dailyTasks">[]> {
  const rows = await ctx.db
    .query("taskDays")
    .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
    .collect();
  const tasks = await Promise.all(rows.map((r) => ctx.db.get(r.taskId)));
  return tasks
    .filter((t): t is Doc<"dailyTasks"> => t !== null)
    .sort((a, b) => a.createdAt - b.createdAt);
}

// The status a task had ON a given day. `task.status` is a single mutable
// field describing only *now*: a task carried from the 1st to the 2nd and
// completed there would otherwise claim to have been completed on the 1st too.
//
// The end-of-life date matches the backfill's exactly (`completedDate` with a
// `currentDate` fallback), so a day view and a reconstructed span always agree.
export function statusOn(
  task: Doc<"dailyTasks">,
  date: string,
): Doc<"dailyTasks">["status"] {
  if (task.status === "completed") {
    return (task.completedDate ?? task.currentDate) === date ? "completed" : "open";
  }
  if (task.status === "dismissed") {
    return task.currentDate === date ? "dismissed" : "open";
  }
  return "open";
}

// How many times the task had been carried by `date`. The stored
// carryoverCount counts rollover *events*, so it under-counts whenever the app
// went unopened for several days — and it describes only the present. Because
// presence is contiguous, the days-waited figure is exactly daysBetween - 1.
//
// The current day deliberately keeps the stored value: changing it there would
// move the Today view's badge and disagree with analyticsTasks, which reads the
// field directly. That is a separate defect with its own blast radius.
export function carryoverOn(task: Doc<"dailyTasks">, date: string): number {
  return date < task.currentDate
    ? daysBetween(task.originalDate, date) - 1
    : task.carryoverCount;
}

// Removes a task's presence log. Called when the task itself is deleted, so no
// orphaned taskDays rows are left pointing at a missing task — the same
// contract as deleteTaskCompletions in ./taskRepeat.ts.
export async function deleteTaskDays(
  ctx: MutationCtx,
  taskId: Id<"dailyTasks">,
): Promise<void> {
  const rows = await ctx.db
    .query("taskDays")
    .withIndex("by_task", (q) => q.eq("taskId", taskId))
    .collect();
  for (const row of rows) {
    await ctx.db.delete(row._id);
  }
}
