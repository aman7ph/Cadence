import { describe, expect, it } from "vitest";
import { computeCurrentStreak } from "./streak";

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
