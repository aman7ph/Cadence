import { DEFAULT_LOOKBACK_DAYS, addDays, computeCurrentStreak } from "@cadence/shared";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { isScheduledOn } from "./schedule";
import { loadCompletionsByRoutine } from "./routineCompletions";
import type { CompletionsByRoutine } from "./routineCompletions";

// The streak a set of routines had as of `asOf`, computed from the completion
// log rather than read off the stored field.
//
// The stored routines.currentStreak is written only by recomputeStreak below,
// which runs only inside a completion mutation. *Missing* a day writes nothing,
// so nothing corrects the number: complete a routine on Monday, skip Tuesday
// through Thursday, and the badge still showed Monday's streak on Thursday. It
// self-corrected only on the next completion. There is no cron in this
// deployment and no other writer, so read time is the only place the answer can
// be kept honest.
//
// `asOf` rather than `today` on purpose: days.getDay passes the date being
// viewed, so a past day in History shows the streak as it stood on that day
// instead of today's. Completions after `asOf` are outside the range read, so
// they cannot leak backwards into it.
//
// Cost is one indexed range scan for the whole set, not one per routine —
// cheaper than the recomputeStreak below, which collects a routine's entire
// completion history unbounded on every write.

// The first date the derivation needs to see. Sized to exactly the window
// computeCurrentStreak walks — it starts at `asOf` and steps back
// DEFAULT_LOOKBACK_DAYS times, inclusive of the first — so callers that load
// the completion log themselves cannot pick a narrower range by accident.
export function streakRangeStart(asOf: string): string {
  return addDays(asOf, -(DEFAULT_LOOKBACK_DAYS - 1));
}

// The computation half, for callers that have already loaded the log over at
// least [streakRangeStart(asOf), asOf].
//
// Split from the read because days.getDay and goalLinks.getDayForGoal both
// need the *same day's* statuses as well, and that day sits inside this range:
// loading twice would read the day's rows a second time for nothing.
export function deriveStreaksFrom(
  routines: Doc<"routines">[],
  byRoutine: CompletionsByRoutine,
  asOf: string,
): Map<Id<"routines">, number> {
  const streaks = new Map<Id<"routines">, number>();
  for (const routine of routines) {
    const completedDates = new Set<string>();
    const skippedDates = new Set<string>();
    for (const [date, status] of byRoutine.get(routine._id) ?? []) {
      if (status === "completed") completedDates.add(date);
      else skippedDates.add(date);
    }
    streaks.set(
      routine._id,
      computeCurrentStreak({
        completedDates,
        skippedDates,
        createdDate: routine.createdDate,
        isScheduledOn: (date) => isScheduledOn(routine, date),
        today: asOf,
      }),
    );
  }
  return streaks;
}

// Load-and-derive, for callers with no other reason to read the completion log.
export async function deriveStreaks(
  ctx: QueryCtx,
  userId: Id<"users">,
  routines: Doc<"routines">[],
  asOf: string,
): Promise<Map<Id<"routines">, number>> {
  if (routines.length === 0) return new Map();
  const byRoutine = await loadCompletionsByRoutine(
    ctx,
    userId,
    streakRangeStart(asOf),
    asOf,
  );
  return deriveStreaksFrom(routines, byRoutine, asOf);
}

export async function recomputeStreak(
  ctx: MutationCtx,
  routineId: Id<"routines">,
  today: string,
): Promise<void> {
  const routine = await ctx.db.get(routineId);
  if (!routine) return;

  const completions = await ctx.db
    .query("routineCompletions")
    .withIndex("by_routine_date", (q) => q.eq("routineId", routineId))
    .collect();

  const completedDates = new Set<string>();
  const skippedDates = new Set<string>();
  let lastCompletedDate: string | undefined;
  for (const c of completions) {
    if (c.status === "completed") {
      completedDates.add(c.date);
      if (!lastCompletedDate || c.date > lastCompletedDate) {
        lastCompletedDate = c.date;
      }
    } else {
      skippedDates.add(c.date);
    }
  }

  const current = computeCurrentStreak({
    completedDates,
    skippedDates,
    createdDate: routine.createdDate,
    isScheduledOn: (date) => isScheduledOn(routine, date),
    today,
  });

  const longest = Math.max(routine.longestStreak, current);
  await ctx.db.patch(routineId, {
    currentStreak: current,
    longestStreak: longest,
    lastCompletedDate: lastCompletedDate ?? routine.lastCompletedDate,
  });
}
