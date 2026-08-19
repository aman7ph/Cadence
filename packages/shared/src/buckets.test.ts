import { describe, expect, it } from "vitest";
import {
  bucketByMonth,
  bucketByWeek,
  bucketCountsByMonth,
  bucketCountsByWeek,
  computeEMA,
} from "./buckets";

describe("computeEMA", () => {
  it("returns [] for no values", () => {
    expect(computeEMA([], 7)).toEqual([]);
  });

  it("seeds with the first value rather than zero", () => {
    expect(computeEMA([10, 10, 10], 3)[0]).toBe(10);
  });

  it("is flat for a constant series", () => {
    expect(computeEMA([5, 5, 5, 5], 3)).toEqual([5, 5, 5, 5]);
  });

  it("lags a step change instead of jumping to it", () => {
    const ema = computeEMA([0, 100], 9);
    expect(ema[1]).toBeGreaterThan(0);
    expect(ema[1]).toBeLessThan(100);
  });
});

describe("bucketByWeek / bucketByMonth", () => {
  // 2026-06-01 is a Monday; 2026-06-08 the next.
  const rows = [
    { date: "2026-06-01", value: 10 },
    { date: "2026-06-03", value: 20 },
    { date: "2026-06-08", value: 40 },
  ];

  it("averages within an ISO week, keyed to the Monday", () => {
    expect(bucketByWeek(rows)).toEqual([
      { date: "2026-06-01", value: 15 },
      { date: "2026-06-08", value: 40 },
    ]);
  });

  it("averages within a calendar month, keyed to the 1st", () => {
    expect(
      bucketByMonth([...rows, { date: "2026-07-02", value: 100 }]),
    ).toEqual([
      { date: "2026-06-01", value: 23 }, // (10+20+40)/3 = 23.33 → 23
      { date: "2026-07-01", value: 100 },
    ]);
  });

  it("returns buckets in ascending date order", () => {
    const out = bucketByMonth([
      { date: "2026-08-01", value: 1 },
      { date: "2026-06-01", value: 1 },
      { date: "2026-07-01", value: 1 },
    ]);
    expect(out.map((r) => r.date)).toEqual([
      "2026-06-01",
      "2026-07-01",
      "2026-08-01",
    ]);
  });

  it("handles an empty input", () => {
    expect(bucketByWeek([])).toEqual([]);
  });
});

describe("bucketCountsByWeek / bucketCountsByMonth", () => {
  const rows = [
    { date: "2026-06-01", completed: 1, open: 2 },
    { date: "2026-06-03", completed: 3, open: 4 },
    { date: "2026-06-08", completed: 5, open: 6 },
  ];
  const keys = ["completed", "open"] as const;

  it("SUMS counts rather than averaging them", () => {
    expect(bucketCountsByWeek(rows, [...keys])).toEqual([
      { date: "2026-06-01", completed: 4, open: 6 },
      { date: "2026-06-08", completed: 5, open: 6 },
    ]);
  });

  it("sums by calendar month", () => {
    expect(bucketCountsByMonth(rows, [...keys])).toEqual([
      { date: "2026-06-01", completed: 9, open: 12 },
    ]);
  });

  // The guard one of the two old copies was missing.
  it("treats a missing key as 0 instead of producing NaN", () => {
    const sparse = [
      { date: "2026-06-01", completed: 1 },
      { date: "2026-06-02", completed: 2, open: 5 },
    ] as ({ date: string } & Record<"completed" | "open", number>)[];
    const out = bucketCountsByWeek(sparse, ["completed", "open"]);
    expect(out[0]!.open).toBe(5);
    expect(Number.isNaN(out[0]!.open)).toBe(false);
  });
});
