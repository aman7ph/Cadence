import { describe, expect, it } from "vitest";
import {
  HEAT_BAND_MIN_SCORES,
  MIN_ACTIVE_SCORE,
  NO_ACTIVITY_BAND,
  scoreToHeatBand,
} from "./heat";

// The band function the 365-day activity heatmap used before this module
// existed. Reproduced here as the reference the shared version must match, so
// the "adopt the activity map's scale" decision (D9) is pinned rather than
// asserted in a comment.
function legacyActivityBand(score: number | null): 0 | 1 | 2 | 3 | 4 {
  if (score === null) return 0;
  if (score >= 80) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  if (score >= 1) return 1;
  return 0;
}

// The History calendar's competing scale, kept only to prove the divergence it
// caused is real and now gone.
function legacyCalendarBand(score: number | undefined): 0 | 1 | 2 | 3 | 4 {
  if (score === undefined || score === 0) return 0;
  if (score < 25) return 1;
  if (score < 50) return 2;
  if (score < 75) return 3;
  return 4;
}

const ALL_SCORES = Array.from({ length: 101 }, (_, i) => i);

describe("scoreToHeatBand — absent days", () => {
  it("treats null, undefined and NaN alike as no activity", () => {
    expect(scoreToHeatBand(null)).toBe(NO_ACTIVITY_BAND);
    expect(scoreToHeatBand(undefined)).toBe(NO_ACTIVITY_BAND);
    expect(scoreToHeatBand(Number.NaN)).toBe(NO_ACTIVITY_BAND);
    expect(scoreToHeatBand(Number.POSITIVE_INFINITY)).toBe(NO_ACTIVITY_BAND);
  });

  it("a recorded zero shares the swatch but is reached by the score path", () => {
    expect(scoreToHeatBand(0)).toBe(NO_ACTIVITY_BAND);
  });
});

describe("scoreToHeatBand — boundaries", () => {
  // Each band's declared minimum must land in that band, and one point below it
  // must land in the band beneath. This is the whole contract, expressed
  // against the constants so changing a threshold moves the test with it.
  it.each(HEAT_BAND_MIN_SCORES.map((min, i) => [i + 1, min] as const))(
    "band %i starts at %i",
    (band, min) => {
      expect(scoreToHeatBand(min)).toBe(band);
      expect(scoreToHeatBand(min - 1)).toBe(band - 1);
    },
  );

  it("the lowest active band is reached by a single point of progress", () => {
    expect(scoreToHeatBand(MIN_ACTIVE_SCORE)).toBe(1);
    expect(scoreToHeatBand(MIN_ACTIVE_SCORE - 1)).toBe(NO_ACTIVITY_BAND);
  });

  it("a perfect day is the top band", () => {
    expect(scoreToHeatBand(100)).toBe(HEAT_BAND_MIN_SCORES.length);
  });

  it("never returns a band outside 0..4 for any reachable score", () => {
    for (const score of ALL_SCORES) {
      const band = scoreToHeatBand(score);
      expect(band).toBeGreaterThanOrEqual(0);
      expect(band).toBeLessThanOrEqual(HEAT_BAND_MIN_SCORES.length);
    }
  });

  it("is monotonic — a better day is never a paler square", () => {
    for (let score = 1; score <= 100; score++) {
      expect(scoreToHeatBand(score)).toBeGreaterThanOrEqual(
        scoreToHeatBand(score - 1),
      );
    }
  });
});

describe("scoreToHeatBand — the scale that was adopted", () => {
  it("matches the activity heatmap's legacy bands on every score", () => {
    for (const score of ALL_SCORES) {
      expect(scoreToHeatBand(score)).toBe(legacyActivityBand(score));
    }
  });

  it("differs from the History calendar's on exactly the 30 known scores", () => {
    const diverging = ALL_SCORES.filter(
      (score) => scoreToHeatBand(score) !== legacyCalendarBand(score),
    );
    expect(diverging).toHaveLength(30);
    // 25-39, 50-59, 75-79 — the ranges measured during the audit.
    expect(diverging[0]).toBe(25);
    expect(diverging.at(-1)).toBe(79);
    expect(diverging).toEqual(expect.arrayContaining([25, 39, 50, 59, 75, 79]));
    expect(diverging).not.toContain(24);
    expect(diverging).not.toContain(40);
  });
});
