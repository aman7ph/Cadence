import { addDays } from "./date";

export type StreakInputs = {
  completedDates: ReadonlySet<string>;
  skippedDates: ReadonlySet<string>;
  createdDate: string;
  isScheduledOn: (date: string) => boolean;
  today: string;
  lookbackDays?: number;
};

// Exported so the read-time derivation in the backend can size its completion
// range to exactly the window this function will walk — one constant, so the
// query cannot read a shorter span than the streak needs and silently truncate
// a long streak.
export const DEFAULT_LOOKBACK_DAYS = 365;

// Walks back from `today` over scheduled days, counting consecutive completions.
// Skip is neutral (does not break or extend). A scheduled day with neither a
// completion nor a skip breaks the streak — unless we have not yet found any
// completion at all, in which case the absence of a record on today itself is
// tolerated (today might just be incomplete-so-far).
export type LongestStreakInputs = {
  completedDates: ReadonlySet<string>;
  skippedDates: ReadonlySet<string>;
  createdDate: string;
  endDate: string;
  isScheduledOn: (date: string) => boolean;
};

// The longest run of consecutive scheduled days ever completed.
//
// `routines.longestStreak` is stored, and recomputeStreak only ever raises it —
// `Math.max(routine.longestStreak, current)`. So while the R2 staleness bug was
// live, a `currentStreak` that had silently gone stale could be promoted into
// `longestStreak` permanently, and nothing would ever bring it back down. This
// recomputes the true value from the completion log so the repair in
// routineManagement.repairLongestStreaks has something honest to compare against.
//
// Same rules as computeCurrentStreak, so the two can never disagree about what
// a streak is: unscheduled days are invisible, a skip is neutral, and a
// scheduled day with no record breaks the run. Walks forward rather than back
// because it needs every run, not just the one ending today.
export function computeLongestStreak(inputs: LongestStreakInputs): number {
  let best = 0;
  let run = 0;
  for (
    let cursor = inputs.createdDate;
    cursor <= inputs.endDate;
    cursor = addDays(cursor, 1)
  ) {
    if (!inputs.isScheduledOn(cursor)) continue;
    if (inputs.completedDates.has(cursor)) {
      run += 1;
      if (run > best) best = run;
    } else if (inputs.skippedDates.has(cursor)) {
      // skip is neutral — the run passes through it
    } else if (cursor < inputs.endDate) {
      // A scheduled day with no record breaks the run. The final day is
      // exempt for the same reason computeCurrentStreak tolerates today: it
      // may simply be unfinished. Exempting it cannot inflate the answer,
      // since `best` is already at least `run`.
      run = 0;
    }
  }
  return best;
}

// The "Best streak" tile: the largest all-time streak across every ACTIVE
// routine, with the routine that holds it.
//
// Both clients previously reduced over the routines scheduled on the *viewed
// day*, so a rest day — or any day the streak-holding routine was not scheduled
// — reported 0, reading as though a streak had been lost. `longestStreak` is an
// all-time figure and has nothing to do with which day is on screen.
//
// The name is withheld at zero: "0 days · Morning run" invites the reader to
// think Morning run just broke, when it means nothing is running at all.
export function bestStreakOf(
  routines: ReadonlyArray<{ name: string; longestStreak: number }> | undefined,
): { days: number; name: string } {
  const active = routines ?? [];
  const days = active.reduce((max, r) => Math.max(max, r.longestStreak), 0);
  return {
    days,
    name:
      days > 0
        ? (active.find((r) => r.longestStreak === days)?.name ?? "—")
        : "—",
  };
}

export function computeCurrentStreak(inputs: StreakInputs): number {
  const lookback = inputs.lookbackDays ?? DEFAULT_LOOKBACK_DAYS;
  let cursor = inputs.today;
  let current = 0;
  let foundAnyCompletion = false;
  for (let i = 0; i < lookback; i++) {
    if (cursor < inputs.createdDate) break;
    if (inputs.isScheduledOn(cursor)) {
      if (inputs.completedDates.has(cursor)) {
        current += 1;
        foundAnyCompletion = true;
      } else if (inputs.skippedDates.has(cursor)) {
        // skip is neutral — pass through
      } else if (foundAnyCompletion) {
        break;
      } else if (cursor < inputs.today) {
        break;
      }
    }
    cursor = addDays(cursor, -1);
  }
  return current;
}
