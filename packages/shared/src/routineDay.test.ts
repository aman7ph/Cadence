import { describe, expect, it } from "vitest";
import { countsTowardRate, resolveDayStatus } from "./routineDay";
import type { ScheduledDayStatus } from "./routineDay";
import { consistencyScore } from "./scoring";
import { addDays } from "./date";

const TODAY = "2026-08-08";
const CONSISTENCY_TAU_DAYS = 14; // mirrors analyticsRoutines.ts

describe("resolveDayStatus", () => {
  it("an existing record always wins, whatever the date", () => {
    for (const date of [addDays(TODAY, -5), TODAY, addDays(TODAY, 5)]) {
      expect(resolveDayStatus("completed", date, TODAY)).toBe("completed");
      expect(resolveDayStatus("skipped", date, TODAY)).toBe("skipped");
    }
  });

  it("no record on a finished day is a miss", () => {
    expect(resolveDayStatus(undefined, addDays(TODAY, -1), TODAY)).toBe("missed");
  });

  it("no record on today is pending, not a miss — the bug this fixes", () => {
    expect(resolveDayStatus(undefined, TODAY, TODAY)).toBe("pending");
  });

  it("no record on a future day is pending", () => {
    expect(resolveDayStatus(undefined, addDays(TODAY, 1), TODAY)).toBe("pending");
  });
});

describe("countsTowardRate", () => {
  const cases: Array<[ScheduledDayStatus, boolean]> = [
    ["completed", true],
    ["missed", true],
    ["skipped", false],
    ["pending", false],
  ];
  it.each(cases)("%s → %s", (status, expected) => {
    expect(countsTowardRate(status)).toBe(expected);
  });
});

// ─── The queries' inner loop, both versions ──────────────────────────────────
// Faithful reproductions of the loop in analyticsRoutines.routineConsistency,
// so the assertions below are about shipping behaviour and not about a
// simplified model. `records` maps date → status for one daily routine.

type Records = Map<string, "completed" | "skipped">;

// What the query did before this step: skips neutral, everything else without a
// completion counted as a failure — today included.
function legacyRate(records: Records, to: string, windowDays: number) {
  const entries: Array<{ daysAgo: number; hit: boolean }> = [];
  let scheduled = 0;
  let completed = 0;
  for (let i = 0; i < windowDays; i++) {
    const day = addDays(to, -i);
    if (records.get(day) === "skipped") continue;
    const hit = records.get(day) === "completed";
    entries.push({ daysAgo: i, hit });
    scheduled += 1;
    if (hit) completed += 1;
  }
  return { scheduled, completed, consistency: consistencyScore(entries, CONSISTENCY_TAU_DAYS) };
}

// What it does now.
function currentRate(records: Records, to: string, windowDays: number, today: string) {
  const entries: Array<{ daysAgo: number; hit: boolean }> = [];
  let scheduled = 0;
  let completed = 0;
  for (let i = 0; i < windowDays; i++) {
    const day = addDays(to, -i);
    const status = resolveDayStatus(records.get(day), day, today);
    if (!countsTowardRate(status)) continue;
    const hit = status === "completed";
    entries.push({ daysAgo: i, hit });
    scheduled += 1;
    if (hit) completed += 1;
  }
  return { scheduled, completed, consistency: consistencyScore(entries, CONSISTENCY_TAU_DAYS) };
}

const WINDOW = 30;
const perfectExceptToday = (): Records => {
  const r: Records = new Map();
  for (let i = 1; i < WINDOW; i++) r.set(addDays(TODAY, -i), "completed");
  return r;
};

describe("a perfect record, with today not yet done", () => {
  it("used to read as a miss and drag the score below 100", () => {
    const before = legacyRate(perfectExceptToday(), TODAY, WINDOW);
    expect(before.scheduled).toBe(WINDOW);
    expect(before.completed).toBe(WINDOW - 1);
    expect(before.consistency).toBeLessThan(100);
  });

  it("now leaves the fraction entirely, so the score stays 100", () => {
    const after = currentRate(perfectExceptToday(), TODAY, WINDOW, TODAY);
    expect(after.scheduled).toBe(WINDOW - 1);
    expect(after.completed).toBe(WINDOW - 1);
    expect(after.consistency).toBe(100);
  });

  it("the n/m counter in the rail loses the phantom scheduled day", () => {
    const before = legacyRate(perfectExceptToday(), TODAY, WINDOW);
    const after = currentRate(perfectExceptToday(), TODAY, WINDOW, TODAY);
    expect(before.scheduled - after.scheduled).toBe(1);
    expect(before.completed).toBe(after.completed);
  });
});

describe("the rule is 'pending', not 'ignore today'", () => {
  it("a routine completed today still counts, and still counts as a hit", () => {
    const records = perfectExceptToday();
    records.set(TODAY, "completed");
    const after = currentRate(records, TODAY, WINDOW, TODAY);
    expect(after.scheduled).toBe(WINDOW);
    expect(after.completed).toBe(WINDOW);
    expect(after.consistency).toBe(100);
  });

  it("a routine skipped today stays neutral, exactly as before", () => {
    const records = perfectExceptToday();
    records.set(TODAY, "skipped");
    expect(currentRate(records, TODAY, WINDOW, TODAY).scheduled).toBe(WINDOW - 1);
  });

  it("yesterday missed is still a miss — only today is protected", () => {
    const records = perfectExceptToday();
    records.delete(addDays(TODAY, -1));
    const after = currentRate(records, TODAY, WINDOW, TODAY);
    expect(after.scheduled).toBe(WINDOW - 1);
    expect(after.completed).toBe(WINDOW - 2);
    expect(after.consistency).toBeLessThan(100);
  });
});

describe("ranges that do not include today are untouched", () => {
  it("a fully past window scores identically before and after", () => {
    const to = addDays(TODAY, -1);
    const records: Records = new Map();
    for (let i = 0; i < WINDOW; i++) {
      if (i % 3 !== 0) records.set(addDays(to, -i), "completed");
    }
    const before = legacyRate(records, to, WINDOW);
    const after = currentRate(records, to, WINDOW, TODAY);
    expect(after).toEqual(before);
  });
});
