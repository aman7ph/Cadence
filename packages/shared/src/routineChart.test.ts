import { describe, expect, it } from "vitest";
import {
  ROLLING_WINDOW_DAYS,
  rollingCompletionRate,
  rollingWindowLabel,
} from "./routineChart";
import type { RoutineChartDay } from "./routineChart";
import { addDays } from "./date";

const START = "2026-06-01";
const days = (n: number) =>
  Array.from({ length: n }, (_, i) => addDays(START, i));

const isMonday = (date: string) =>
  new Date(date + "T00:00:00Z").getUTCDay() === 1;

describe("rollingCompletionRate — the window is the routine's own days", () => {
  // The measured bug: a daily routine and a Monday-only routine charted over the
  // same 28 dates. The old code took the last 7 dates from the union of both
  // routines and then filtered, so the weekly routine got a 1-sample window.
  const axis = days(28);

  it("a daily routine reaches the full window", () => {
    const daily: RoutineChartDay[] = axis.map((date) => ({
      date,
      status: "completed",
    }));
    const values = rollingCompletionRate(daily, axis);
    expect(values.every((v) => v === 100)).toBe(true);
  });

  it("a weekly routine is averaged over its own days, not the shared axis", () => {
    // Missed every Monday. Under the old shared-axis window this produced a
    // 1-sample window and a 0/100 square wave; now it is a steady 0%.
    const weekly: RoutineChartDay[] = axis
      .filter(isMonday)
      .map((date) => ({ date, status: "missed" }));
    const values = rollingCompletionRate(weekly, axis);
    const plotted = values.filter((v): v is number => v !== null);
    expect(plotted.length).toBeGreaterThan(0);
    expect(new Set(plotted)).toEqual(new Set([0]));
  });

  it("a weekly routine hitting every other Monday reads 50%, not 0 or 100", () => {
    const mondays = axis.filter(isMonday);
    const weekly: RoutineChartDay[] = mondays.map((date, i) => ({
      date,
      status: i % 2 === 0 ? "completed" : "missed",
    }));
    // Evaluated after the last Monday, so the whole history is in the window.
    const [value] = rollingCompletionRate(weekly, [mondays.at(-1)!]);
    expect(value).toBe(
      Math.round((Math.ceil(mondays.length / 2) / mondays.length) * 100),
    );
  });
});

describe("rollingCompletionRate — gaps are null, never zero", () => {
  const axis = days(30);

  it("returns null before the routine's first scheduled day", () => {
    const created = addDays(START, 20);
    const late: RoutineChartDay[] = [{ date: created, status: "completed" }];
    const values = rollingCompletionRate(late, axis);
    expect(values.slice(0, 20).every((v) => v === null)).toBe(true);
    expect(values[20]).toBe(100);
  });

  it("a routine with no countable days at all is all null", () => {
    const values = rollingCompletionRate([], axis);
    expect(values.every((v) => v === null)).toBe(true);
  });

  it("a routine whose only days are skipped or pending is all null", () => {
    const neutral: RoutineChartDay[] = [
      { date: axis[0]!, status: "skipped" },
      { date: axis[1]!, status: "pending" },
    ];
    expect(rollingCompletionRate(neutral, axis).every((v) => v === null)).toBe(
      true,
    );
  });
});

describe("rollingCompletionRate — window size and neutrality", () => {
  it("only the last N countable days count", () => {
    const axis = days(10);
    // First 3 missed, last 7 completed → a 7-day window sees only completions.
    const history: RoutineChartDay[] = axis.map((date, i) => ({
      date,
      status: i < 3 ? "missed" : "completed",
    }));
    const values = rollingCompletionRate(history, axis);
    expect(values.at(-1)).toBe(100);
    // One day earlier the window still reaches back into the missed stretch.
    expect(values[ROLLING_WINDOW_DAYS - 1]).toBeLessThan(100);
  });

  it("skips are neutral — they neither help nor hurt the rate", () => {
    const axis = days(4);
    const withSkip: RoutineChartDay[] = [
      { date: axis[0]!, status: "completed" },
      { date: axis[1]!, status: "skipped" },
      { date: axis[2]!, status: "missed" },
      { date: axis[3]!, status: "completed" },
    ];
    // 2 completed of 3 countable — the skip is not in either half.
    expect(rollingCompletionRate(withSkip, [axis[3]!])).toEqual([67]);
  });

  it("the shipping window is 7 days", () => {
    expect(ROLLING_WINDOW_DAYS).toBe(7);
  });
});

describe("rollingWindowLabel", () => {
  it("states the window size, built from the constant the maths uses", () => {
    expect(rollingWindowLabel("daily")).toBe(
      `last ${ROLLING_WINDOW_DAYS} scheduled days`,
    );
  });

  it("says 'scheduled days', because that is what the window counts", () => {
    // The window is N of the routine's OWN scheduled days, not N calendar days
    // — a Monday-only routine's 7-point window spans seven weeks.
    expect(rollingWindowLabel("daily")).toContain("scheduled days");
  });

  it("falls back to the bucket label when the chart is not rolling", () => {
    expect(rollingWindowLabel("weekly")).toBe("weekly buckets");
    expect(rollingWindowLabel("monthly")).toBe("monthly buckets");
  });
});
