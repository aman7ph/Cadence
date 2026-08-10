import { addDays, daysBetween, productivityScore } from "@cadence/shared";
import type { QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { isScheduledOn } from "./schedule";
import { statusOn } from "./taskDay";
import { loadCompletionsByRoutine } from "./routineCompletions";
import type { CompletionStatus } from "./routineCompletions";

export type DayStatsNumbers = {
  routineScheduled: number;
  routineCompleted: number;
  randomTotal: number;
  randomCompleted: number;
  productivityScore: number;
};

export type DerivedDayStats = DayStatsNumbers & { date: string };

// Whether a day earns a row at all — the load-bearing predicate here, and a
// named function rather than an inline comparison pair because it is wrong in
// two opposite and equally silent ways:
//
//   - Too strict (the old behaviour: a row only where a mutation ran) and a day
//     with five routines scheduled and none done has no row, rendering as "no
//     activity" — indistinguishable from a day before the account existed — and
//     drops out of every average. That is what made the 30-day rate an average
//     over good days only.
//   - Too loose (a row per calendar day) and every day before signup scores a
//     *neutral 100*, since productivityScore deliberately scores an empty plate
//     100 (see shared/scoring.ts), inflating the very averages this fixes.
export function hadSomethingOnThePlate(numbers: {
  routineScheduled: number;
  randomTotal: number;
}): boolean {
  return numbers.routineScheduled > 0 || numbers.randomTotal > 0;
}

// The single-day count, shared by the write path (lib/dayStats.computeDayStats)
// and the derived read path below. One function on purpose: two implementations
// of "what happened on this day" is exactly what let the stored dayStats row and
// the live Today view disagree, so a shared fold makes that drift impossible.
export function foldDayStats(args: {
  routines: Doc<"routines">[];
  statusByRoutine: ReadonlyMap<Id<"routines">, CompletionStatus>;
  tasks: Doc<"dailyTasks">[];
  date: string;
  routineWeight: number | undefined;
}): DayStatsNumbers {
  let routineScheduled = 0;
  let routineCompleted = 0;
  for (const routine of args.routines) {
    if (!isScheduledOn(routine, args.date)) continue;
    const status = args.statusByRoutine.get(routine._id);
    // Skips leave the fraction rather than counting as failures — as
    // consistencyScore, countsTowardRate and computeCurrentStreak already do,
    // and as shared/scoring.ts states. The day's score was the last holdout.
    // Distinct from `pending`: a day's score is a snapshot of that day, so a
    // routine not done *yet* still counts against it (the tile climbs all day).
    if (status === "skipped") continue;
    routineScheduled += 1;
    if (status === "completed") routineCompleted += 1;
  }

  let randomCompleted = 0;
  for (const task of args.tasks) {
    if (statusOn(task, args.date) === "completed") randomCompleted += 1;
  }

  const numbers = {
    routineScheduled,
    routineCompleted,
    randomTotal: args.tasks.length,
    randomCompleted,
  };
  return {
    ...numbers,
    productivityScore: productivityScore(numbers, args.routineWeight),
  };
}

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
  for (const task of await Promise.all(distinctTaskIds.map((id) => ctx.db.get(id)))) {
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
