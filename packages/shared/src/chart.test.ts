import { describe, expect, it } from "vitest";
import {
  MAX_DAILY_RANGE_DAYS,
  MAX_WEEKLY_RANGE_DAYS,
  fillDailyGaps,
  getGranularity,
  granularityLabel,
} from "./chart";
import { addDays, startOfMonth, startOfWeek, startOfYear } from "./date";

const TODAY = "2026-08-08";

// A range ending on TODAY that measures exactly `days` inclusive — the shape
// every shipping preset has.
const lastNDays = (days: number) => ({
  from: addDays(TODAY, -(days - 1)),
  to: TODAY,
});

describe("getGranularity — boundaries", () => {
  it("stays daily up to and including the daily maximum", () => {
    const { from, to } = lastNDays(MAX_DAILY_RANGE_DAYS);
    expect(getGranularity(from, to)).toBe("daily");
  });

  it("switches to weekly one day past the daily maximum", () => {
    const { from, to } = lastNDays(MAX_DAILY_RANGE_DAYS + 1);
    expect(getGranularity(from, to)).toBe("weekly");
  });

  it("stays weekly up to and including the weekly maximum", () => {
    const { from, to } = lastNDays(MAX_WEEKLY_RANGE_DAYS);
    expect(getGranularity(from, to)).toBe("weekly");
  });

  it("switches to monthly one day past the weekly maximum", () => {
    const { from, to } = lastNDays(MAX_WEEKLY_RANGE_DAYS + 1);
    expect(getGranularity(from, to)).toBe("monthly");
  });

  // Pinned as literals on purpose: these are the values that ship, and
  // asserting them only through the constants would let a change to either
  // constant pass silently. See D13 in the implementation plan.
  it("the shipping thresholds are 90 and 365 days", () => {
    expect(MAX_DAILY_RANGE_DAYS).toBe(90);
    expect(MAX_WEEKLY_RANGE_DAYS).toBe(365);
  });
});

describe("getGranularity — degenerate ranges", () => {
  it("a single day is daily", () => {
    expect(getGranularity(TODAY, TODAY)).toBe("daily");
  });

  it("an inverted range does not throw and stays daily", () => {
    // daysBetween goes negative here; the first branch catches it rather than
    // falling through to monthly, which would be a nonsense answer.
    expect(getGranularity(TODAY, addDays(TODAY, -30))).toBe("daily");
  });
});

describe("getGranularity — every shipping range preset", () => {
  // Mirrors PRESETS in apps/web/src/components/ui/date-range-picker-presets.ts
  // and RANGE_PRESETS in apps/mobile/lib/insightUtils.ts, which are identical
  // lists. Both clients call this one function after Step 11, so each preset
  // must resolve to exactly one granularity across platforms — the drift this
  // module exists to end.
  const presets: Array<[string, string, string]> = [
    ["Last 7 days", addDays(TODAY, -6), "daily"],
    ["Last 30 days", addDays(TODAY, -29), "daily"],
    ["Last 90 days", addDays(TODAY, -89), "daily"],
    ["Last 6 months", addDays(TODAY, -181), "weekly"],
    ["Last year", addDays(TODAY, -364), "weekly"],
    ["This week", startOfWeek(TODAY), "daily"],
    ["This month", startOfMonth(TODAY), "daily"],
    ["This year", startOfYear(TODAY), "weekly"],
    ["All time", "2020-01-01", "monthly"],
  ];

  it.each(presets)("%s → %s", (_label, from, expected) => {
    expect(getGranularity(from, TODAY)).toBe(expected);
  });

  it("Last 90 days sits exactly on the daily boundary, not near it", () => {
    // The preset is today-89 … today, which is 90 inclusive days. If daysBetween
    // were ever made exclusive this test fails rather than the chart quietly
    // re-bucketing for every user on that preset.
    const from = addDays(TODAY, -89);
    expect(getGranularity(from, TODAY)).toBe("daily");
    expect(getGranularity(addDays(from, -1), TODAY)).toBe("weekly");
  });
});

describe("fillDailyGaps", () => {
  const zero = (date: string) => ({ date, count: 0 });

  it("emits one row per calendar day in the range", () => {
    const filled = fillDailyGaps([], "2026-06-01", "2026-06-07", zero);
    expect(filled).toHaveLength(7);
    expect(filled[0]!.date).toBe("2026-06-01");
    expect(filled.at(-1)!.date).toBe("2026-06-07");
  });

  it("keeps real rows and fills only the holes", () => {
    const rows = [
      { date: "2026-06-01", count: 3 },
      { date: "2026-06-04", count: 5 },
    ];
    const filled = fillDailyGaps(rows, "2026-06-01", "2026-06-05", zero);
    expect(filled.map((r) => r.count)).toEqual([3, 0, 0, 5, 0]);
  });

  it("a count series that skipped quiet days now shows them as zero", () => {
    // The defect: a backend query grouping by date emits nothing for a day with
    // no open tasks, so on a categorical axis that day vanishes rather than
    // reading zero, and the line closes over it.
    const sparse = [{ date: "2026-06-03", count: 2 }];
    const filled = fillDailyGaps(sparse, "2026-06-01", "2026-06-05", zero);
    expect(filled).toHaveLength(5);
    expect(filled.filter((r) => r.count === 0)).toHaveLength(4);
  });

  it("preserves the caller's row shape, not just a value field", () => {
    type Row = { date: string; completed: number; open: number };
    const rows: Row[] = [{ date: "2026-06-02", completed: 1, open: 4 }];
    const filled = fillDailyGaps<Row>(
      rows,
      "2026-06-01",
      "2026-06-03",
      (date) => ({
        date,
        completed: 0,
        open: 0,
      }),
    );
    expect(filled).toEqual([
      { date: "2026-06-01", completed: 0, open: 0 },
      { date: "2026-06-02", completed: 1, open: 4 },
      { date: "2026-06-03", completed: 0, open: 0 },
    ]);
  });

  it("an inverted range yields nothing rather than looping forever", () => {
    expect(fillDailyGaps([], "2026-06-07", "2026-06-01", zero)).toEqual([]);
  });
});

describe("granularityLabel", () => {
  it("names the bucket, and never claims a rolling window", () => {
    expect(granularityLabel("daily")).toBe("daily");
    expect(granularityLabel("weekly")).toBe("weekly buckets");
    expect(granularityLabel("monthly")).toBe("monthly buckets");
  });

  it("the daily label does not mention rolling — that was the web bug", () => {
    // Web returned "7-day rolling" here and hung it on two plain per-day count
    // charts; mobile returned "daily" and hung it on the one rolling chart.
    expect(granularityLabel("daily")).not.toMatch(/rolling/i);
  });
});
