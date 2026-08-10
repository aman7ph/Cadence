import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOOKBACK_DAYS,
  bestStreakOf,
  computeCurrentStreak,
  computeLongestStreak,
} from "./streak";
import { addDays } from "./date";

const everyDay = () => true;

function streakWith(args: {
  completed?: string[];
  skipped?: string[];
  today: string;
  createdDate?: string;
  isScheduledOn?: (date: string) => boolean;
  lookbackDays?: number;
}) {
  return computeCurrentStreak({
    completedDates: new Set(args.completed ?? []),
    skippedDates: new Set(args.skipped ?? []),
    createdDate: args.createdDate ?? "2026-01-01",
    isScheduledOn: args.isScheduledOn ?? everyDay,
    today: args.today,
    lookbackDays: args.lookbackDays,
  });
}

describe("computeCurrentStreak", () => {
  it("returns 0 when nothing is completed", () => {
    expect(streakWith({ today: "2026-06-25" })).toBe(0);
  });

  it("counts a single completion on today", () => {
    expect(streakWith({ today: "2026-06-25", completed: ["2026-06-25"] })).toBe(
      1,
    );
  });

  it("counts consecutive completions ending today", () => {
    expect(
      streakWith({
        today: "2026-06-25",
        completed: ["2026-06-23", "2026-06-24", "2026-06-25"],
      }),
    ).toBe(3);
  });

  it("tolerates today not yet being recorded as long as prior days continue the streak", () => {
    expect(
      streakWith({
        today: "2026-06-25",
        completed: ["2026-06-23", "2026-06-24"],
      }),
    ).toBe(2);
  });

  it("breaks the streak on a missed scheduled day", () => {
    expect(
      streakWith({
        today: "2026-06-25",
        completed: ["2026-06-25", "2026-06-23"],
      }),
    ).toBe(1);
  });

  it("treats a skipped day as neutral — does not break the streak", () => {
    expect(
      streakWith({
        today: "2026-06-25",
        completed: ["2026-06-23", "2026-06-25"],
        skipped: ["2026-06-24"],
      }),
    ).toBe(2);
  });

  it("a skipped day does not extend a streak on its own", () => {
    expect(
      streakWith({
        today: "2026-06-25",
        skipped: ["2026-06-25"],
      }),
    ).toBe(0);
  });

  it("stops at createdDate — old completions before creation do not count", () => {
    expect(
      streakWith({
        today: "2026-06-25",
        createdDate: "2026-06-24",
        completed: [
          "2026-06-20", // before creation, ignored
          "2026-06-24",
          "2026-06-25",
        ],
      }),
    ).toBe(2);
  });

  it("respects the schedule filter — unscheduled days are skipped over", () => {
    // Weekdays-only routine.  2026-06-25 is a Thursday, 27 is Sat, 28 is Sun.
    const weekdaysOnly = (date: string) => {
      const dow = new Date(date + "T00:00:00Z").getUTCDay();
      return dow >= 1 && dow <= 5;
    };
    // today = Monday Jun 29, completed prior Friday (Jun 26) and the
    // intervening weekend has no record.  Streak should still be 1 (today not
    // marked, Mon-Fri continuity preserved via skipping weekend cells).
    expect(
      streakWith({
        today: "2026-06-29",
        completed: ["2026-06-26"],
        isScheduledOn: weekdaysOnly,
      }),
    ).toBe(1);
  });

  it("stops at the lookback bound", () => {
    // 5-day lookback. Walking back from today, we should see at most 5
    // scheduled-day evaluations. A completion older than that is invisible.
    expect(
      streakWith({
        today: "2026-06-25",
        completed: [
          "2026-06-25",
          "2026-06-24",
          "2026-06-23",
          "2026-06-22",
          "2026-06-21",
          "2026-06-20", // outside the 5-day window
        ],
        lookbackDays: 5,
      }),
    ).toBe(5);
  });

  it("retro-completing yesterday grows the streak when today is also completed", () => {
    // The Phase 4 streak-fix scenario.  Real today is Jun 25; yesterday and
    // today both have completion records; recompute must walk from Jun 25.
    expect(
      streakWith({
        today: "2026-06-25",
        completed: ["2026-06-24", "2026-06-25"],
      }),
    ).toBe(2);
  });
});

// The read-time derivation in convex/lib/streak.ts sizes its completion-log
// range from DEFAULT_LOOKBACK_DAYS. If that range were one day short of the
// window this function actually walks, a maximal streak would silently
// truncate — the query would simply never load the oldest day it needs. These
// pin the boundary from both sides so the two cannot drift apart.
describe("computeLongestStreak", () => {
  const longestWith = (args: {
    completed?: string[];
    skipped?: string[];
    createdDate?: string;
    endDate: string;
    isScheduledOn?: (date: string) => boolean;
  }) =>
    computeLongestStreak({
      completedDates: new Set(args.completed ?? []),
      skippedDates: new Set(args.skipped ?? []),
      createdDate: args.createdDate ?? "2026-06-01",
      endDate: args.endDate,
      isScheduledOn: args.isScheduledOn ?? everyDay,
    });

  it("finds the best run, not the most recent one", () => {
    // A 4-day run early, broken, then a 2-day run at the end. The current
    // streak is 2; the longest is 4.
    expect(
      longestWith({
        completed: [
          "2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04",
          "2026-06-09", "2026-06-10",
        ],
        endDate: "2026-06-10",
      }),
    ).toBe(4);
  });

  it("returns 0 when nothing was ever completed", () => {
    expect(longestWith({ endDate: "2026-06-10" })).toBe(0);
  });

  it("a missed scheduled day breaks the run", () => {
    expect(
      longestWith({
        completed: ["2026-06-01", "2026-06-02", "2026-06-04", "2026-06-05"],
        endDate: "2026-06-05",
      }),
    ).toBe(2);
  });

  it("a skip is neutral — it joins the runs either side of it", () => {
    expect(
      longestWith({
        completed: ["2026-06-01", "2026-06-02", "2026-06-04", "2026-06-05"],
        skipped: ["2026-06-03"],
        endDate: "2026-06-05",
      }),
    ).toBe(4);
  });

  it("unscheduled days are invisible, so a weekly routine's run counts weeks", () => {
    const mondaysOnly = (date: string) =>
      new Date(date + "T00:00:00Z").getUTCDay() === 1;
    expect(
      longestWith({
        completed: ["2026-06-01", "2026-06-08", "2026-06-15"],
        endDate: "2026-06-15",
        isScheduledOn: mondaysOnly,
      }),
    ).toBe(3);
  });

  it("an unfinished final day does not break the run", () => {
    // Same tolerance computeCurrentStreak gives today. It cannot inflate the
    // answer either way, since `best` already covers the completed run.
    expect(
      longestWith({
        completed: ["2026-06-01", "2026-06-02", "2026-06-03"],
        endDate: "2026-06-04",
      }),
    ).toBe(3);
  });

  it("ignores completions before the routine existed", () => {
    expect(
      longestWith({
        completed: ["2026-05-28", "2026-05-29", "2026-05-30", "2026-06-01"],
        createdDate: "2026-06-01",
        endDate: "2026-06-01",
      }),
    ).toBe(1);
  });

  it("agrees with computeCurrentStreak when the best run is the current one", () => {
    const completed = ["2026-06-08", "2026-06-09", "2026-06-10"];
    const longest = longestWith({ completed, endDate: "2026-06-10" });
    const current = streakWith({ completed, today: "2026-06-10" });
    expect(longest).toBe(current);
  });
});

describe("bestStreakOf", () => {
  const routines = [
    { name: "Morning run", longestStreak: 12 },
    { name: "Read", longestStreak: 30 },
    { name: "Stretch", longestStreak: 4 },
  ];

  it("takes the largest all-time streak and names its holder", () => {
    expect(bestStreakOf(routines)).toEqual({ days: 30, name: "Read" });
  });

  it("does not depend on which routines are scheduled today — the defect", () => {
    // The old code reduced over the *viewed day's* routines, so a rest day, or
    // a day the streak holder was not scheduled, reported 0 as though the
    // streak had broken. The full active list always yields the same answer.
    const withoutHolder = routines.filter((r) => r.name !== "Read");
    expect(bestStreakOf(routines).days).toBe(30);
    expect(bestStreakOf(withoutHolder).days).toBe(12);
  });

  it("withholds the name at zero rather than blaming a routine", () => {
    // "0 days · Morning run" reads as though Morning run just broke.
    expect(bestStreakOf([{ name: "Morning run", longestStreak: 0 }])).toEqual({
      days: 0,
      name: "—",
    });
  });

  it("handles the loading and empty states without throwing", () => {
    expect(bestStreakOf(undefined)).toEqual({ days: 0, name: "—" });
    expect(bestStreakOf([])).toEqual({ days: 0, name: "—" });
  });

  it("on a tie, names the first holder in the list", () => {
    expect(
      bestStreakOf([
        { name: "A", longestStreak: 7 },
        { name: "B", longestStreak: 7 },
      ]).name,
    ).toBe("A");
  });
});

describe("the default lookback window, as the derivation sizes it", () => {
  const TODAY = "2026-08-08";
  // The derivation reads [OLDEST_REACHABLE, asOf]; anything older is invisible.
  const OLDEST_REACHABLE = addDays(TODAY, -(DEFAULT_LOOKBACK_DAYS - 1));

  const consecutiveEndingToday = (days: number) =>
    Array.from({ length: days }, (_, i) => addDays(TODAY, -i));

  it("counts a streak spanning the entire window", () => {
    expect(
      streakWith({
        today: TODAY,
        completed: consecutiveEndingToday(DEFAULT_LOOKBACK_DAYS),
        createdDate: OLDEST_REACHABLE,
      }),
    ).toBe(DEFAULT_LOOKBACK_DAYS);
  });

  it("cannot see one day beyond it, so the range never needs to be wider", () => {
    const beyond = addDays(OLDEST_REACHABLE, -1);
    expect(
      streakWith({
        today: TODAY,
        completed: [...consecutiveEndingToday(DEFAULT_LOOKBACK_DAYS), beyond],
        createdDate: beyond,
      }),
    ).toBe(DEFAULT_LOOKBACK_DAYS);
  });

  it("the shipping lookback is 365 days", () => {
    expect(DEFAULT_LOOKBACK_DAYS).toBe(365);
  });
});
