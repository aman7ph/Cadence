import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { foldDayStats } from "./dayStatsDerive";
import { loadDayTasks } from "./taskDay";

export type DayStatsPayload = {
  userId: Id<"users">;
  date: string;
  routineScheduled: number;
  routineCompleted: number;
  randomTotal: number;
  randomCompleted: number;
  productivityScore: number;
};

// Counts the scheduled / completed / resolved events for (userId, date) as they
// stand right now, WITHOUT writing. Split from the upsert so the recompute pass
// in taskDays.ts can diff a proposed result against the stored row before
// touching it.
export async function computeDayStats(
  ctx: QueryCtx,
  userId: Id<"users">,
  date: string,
): Promise<DayStatsPayload> {
  const routines = await ctx.db
    .query("routines")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const completionsOnDate = await ctx.db
    .query("routineCompletions")
    .withIndex("by_user_date", (q) =>
      q.eq("userId", userId).eq("date", date),
    )
    .collect();
  const statusByRoutine = new Map(
    completionsOnDate.map((c) => [c.routineId, c.status] as const),
  );

  // Tasks by presence: every task that was on the plate that day counts once,
  // and the status it held THAT day decides whether it counts as done.
  //
  // This replaces three reads — every completed task the user has ever had,
  // plus unfinished tasks keyed on the mutable currentDate — with one
  // indexed read of the day's presence rows. It is both cheaper and correct for
  // past days: a task carried through a day used to vanish from that day's
  // plate the moment it rolled forward.
  const dayTasks = await loadDayTasks(ctx, userId, date);
  const user = await ctx.db.get(userId);

  // The counting itself lives in lib/dayStatsDerive.ts, shared with the derived
  // read path, so the stored row and the range query cannot drift apart.
  return {
    userId,
    date,
    ...foldDayStats({
      routines,
      statusByRoutine,
      tasks: dayTasks,
      date,
      routineWeight: user?.routineWeight,
    }),
  };
}

// Recomputes and upserts the dayStats row for (userId, date). Call from every
// completion mutation that could change those counts.
export async function upsertDayStats(
  ctx: MutationCtx,
  userId: Id<"users">,
  date: string,
): Promise<void> {
  const payload = await computeDayStats(ctx, userId, date);
  const existing = await ctx.db
    .query("dayStats")
    .withIndex("by_user_date", (q) =>
      q.eq("userId", userId).eq("date", date),
    )
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, payload);
  } else {
    await ctx.db.insert("dayStats", payload);
  }
}

// Recomputes the rows for `dates` that ALREADY exist, and only those. Creating
// rows here would manufacture scores for days the user never interacted with,
// newly painting the history heatmap for days that showed nothing before.
//
// Shared because two different writers change days other than today: the
// rollover grows a past day's plate, and deleting a task shrinks every plate it
// sat on. Both need the same "refresh, never create" rule.
export async function refreshExistingDayStats(
  ctx: MutationCtx,
  userId: Id<"users">,
  dates: Iterable<string>,
): Promise<void> {
  for (const date of dates) {
    const existing = await ctx.db
      .query("dayStats")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .unique();
    if (existing) await upsertDayStats(ctx, userId, date);
  }
}
