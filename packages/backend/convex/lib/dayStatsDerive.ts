import { addDays, daysBetween } from "@cadence/shared";
import type { QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { loadCompletionsByRoutine } from "./routineCompletions";
import type { CompletionStatus } from "./routineCompletions";
import { foldDayStats, hadSomethingOnThePlate } from "./dayStatsFold";
import type { DayStatsNumbers } from "./dayStatsFold";

export type DerivedDayStats = DayStatsNumbers & { date: string };

// Every day in [from, to] that had something on its plate, computed from source
// data rather than read from the stored dayStats table.
//
// Three bulk reads plus one point-get per *distinct* task — not per day. A
// 365-day heatmap is therefore a handful of indexed queries, not 365 of them.
// Both range scans are served by by_user_date, which is ["userId", "date"].
export async function deriveDayStatsRange(
  ctx: QueryCtx,
  userId: Id<"users">,
  from: string,
  to: string,
  routineWeight: number | undefined,
): Promise<DerivedDayStats[]> {
  const routines = await ctx.db
    .query("routines")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const completions = await loadCompletionsByRoutine(ctx, userId, from, to);

  // Presence, not currentDate — a task that has since rolled over still belongs
  // to the days it sat on. Same source days.getDay reads. See lib/taskDay.ts.
  const presence = await ctx.db
    .query("taskDays")
    .withIndex("by_user_date", (q) =>
      q.eq("userId", userId).gte("date", from).lte("date", to),
    )
    .collect();

  const taskIdsByDate = new Map<string, Id<"dailyTasks">[]>();
  for (const row of presence) {
    const forDate = taskIdsByDate.get(row.date);
    if (forDate) forDate.push(row.taskId);
    else taskIdsByDate.set(row.date, [row.taskId]);
  }

  const distinctTaskIds = [...new Set(presence.map((row) => row.taskId))];
  const taskById = new Map<Id<"dailyTasks">, Doc<"dailyTasks">>();
  for (const task of await Promise.all(
    distinctTaskIds.map((id) => ctx.db.get(id)),
  )) {
    if (task) taskById.set(task._id, task);
  }

  const rows: DerivedDayStats[] = [];
  const totalDays = daysBetween(from, to);
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(from, i);

    const statusByRoutine = new Map<Id<"routines">, CompletionStatus>();
    for (const routine of routines) {
      const status = completions.get(routine._id)?.get(date);
      if (status) statusByRoutine.set(routine._id, status);
    }

    const tasks = (taskIdsByDate.get(date) ?? [])
      .map((id) => taskById.get(id))
      .filter((task): task is Doc<"dailyTasks"> => task !== undefined);

    const numbers = foldDayStats({
      routines,
      statusByRoutine,
      tasks,
      date,
      routineWeight,
    });
    if (!hadSomethingOnThePlate(numbers)) continue;
    rows.push({ date, ...numbers });
  }
  return rows;
}
