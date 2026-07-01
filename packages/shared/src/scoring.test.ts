import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROUTINE_WEIGHT,
  completionRate,
  consistencyScore,
  productivityScore,
} from "./scoring";

describe("completionRate", () => {
  it("returns 1.0 when nothing is scheduled (empty-day neutrality)", () => {
    expect(completionRate({ completed: 0, scheduled: 0 })).toBe(1);
  });

  it("returns the fraction otherwise", () => {
    expect(completionRate({ completed: 1, scheduled: 2 })).toBe(0.5);
    expect(completionRate({ completed: 3, scheduled: 4 })).toBe(0.75);
  });
});

describe("productivityScore", () => {
  it("a fully completed day scores 100", () => {
    expect(
      productivityScore({
        routineCompleted: 2,
        routineScheduled: 2,
        randomCompleted: 1,
        randomTotal: 1,
      }),
    ).toBe(100);
  });

  it("a fully empty day scores a neutral 100, not 0", () => {
    expect(
      productivityScore({
        routineCompleted: 0,
        routineScheduled: 0,
        randomCompleted: 0,
        randomTotal: 0,
      }),
    ).toBe(100);
  });

  it("weights routines 60 / random 40", () => {
    // 100% routines + 0% randoms → 0.6 * 100 = 60
    expect(
      productivityScore({
        routineCompleted: 1,
        routineScheduled: 1,
        randomCompleted: 0,
        randomTotal: 1,
      }),
    ).toBe(60);
    // 0% routines + 100% randoms → 0.4 * 100 = 40
    expect(
      productivityScore({
        routineCompleted: 0,
        routineScheduled: 1,
        randomCompleted: 1,
        randomTotal: 1,
      }),
    ).toBe(40);
  });

  it("an open task counts against the score (open tasks are not exempt)", () => {
    // 1 routine done, 1 task on the plate but still open
    // → routines 1.0, randoms 0/1 = 0 → 0.6*1.0 + 0.4*0 = 60
    expect(
      productivityScore({
        routineCompleted: 1,
        routineScheduled: 1,
        randomCompleted: 0,
        randomTotal: 1,
      }),
    ).toBe(60);
  });

  it("a dismissed task counts against the random rate the same as an open task", () => {
    // Dismissed and open both contribute to randomTotal but not randomCompleted
    expect(
      productivityScore({
        routineCompleted: 1,
        routineScheduled: 1,
        randomCompleted: 0,
        randomTotal: 1,
      }),
    ).toBe(60);
  });

  it("DEFAULT_ROUTINE_WEIGHT matches the implicit default", () => {
    expect(DEFAULT_ROUTINE_WEIGHT).toBe(0.6);
    const inputs = {
      routineCompleted: 1,
      routineScheduled: 1,
      randomCompleted: 0,
      randomTotal: 1,
    };
    expect(productivityScore(inputs)).toBe(
      productivityScore(inputs, DEFAULT_ROUTINE_WEIGHT),
    );
  });

  it("custom routine weight shifts the balance", () => {
    const inputs = {
      routineCompleted: 1,
      routineScheduled: 1,
      randomCompleted: 0,
      randomTotal: 1,
    };
    // 100% routine weight → only routines count → 100
    expect(productivityScore(inputs, 1)).toBe(100);
    // 0% routine weight → only tasks count → 0
    expect(productivityScore(inputs, 0)).toBe(0);
    // 80% routine weight → 0.8 * 1 + 0.2 * 0 = 0.8 → 80
    expect(productivityScore(inputs, 0.8)).toBe(80);
  });

  it("clamps an out-of-range weight rather than blowing up", () => {
    const inputs = {
      routineCompleted: 1,
      routineScheduled: 1,
      randomCompleted: 0,
      randomTotal: 1,
    };
    // 1.5 clamps to 1 → behaves like 100% routines
    expect(productivityScore(inputs, 1.5)).toBe(100);
    // -0.2 clamps to 0 → behaves like 0% routines
    expect(productivityScore(inputs, -0.2)).toBe(0);
    // NaN falls back to default
    expect(productivityScore(inputs, NaN)).toBe(
      productivityScore(inputs, DEFAULT_ROUTINE_WEIGHT),
    );
  });
});

describe("consistencyScore", () => {
  it("returns 0 with no entries", () => {
    expect(consistencyScore([])).toBe(0);
  });

  it("returns 100 when every entry is a hit", () => {
    expect(
      consistencyScore([
        { daysAgo: 0, hit: true },
        { daysAgo: 1, hit: true },
        { daysAgo: 14, hit: true },
      ]),
    ).toBe(100);
  });

  it("returns 0 when no entry is a hit", () => {
    expect(
      consistencyScore([
        { daysAgo: 0, hit: false },
        { daysAgo: 7, hit: false },
      ]),
    ).toBe(0);
  });

  it("weights recent hits more than older ones", () => {
    // One recent hit, one old miss: should score above 50.
    const recentHitOldMiss = consistencyScore([
      { daysAgo: 0, hit: true },
      { daysAgo: 30, hit: false },
    ]);
    // One old hit, one recent miss: should score below 50.
    const oldHitRecentMiss = consistencyScore([
      { daysAgo: 30, hit: true },
      { daysAgo: 0, hit: false },
    ]);
    expect(recentHitOldMiss).toBeGreaterThan(50);
    expect(oldHitRecentMiss).toBeLessThan(50);
  });
});
