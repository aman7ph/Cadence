import { describe, expect, it } from "vitest";
import { goalProgress } from "./goalProgress";

describe("goalProgress", () => {
  it("computes a rounded percentage", () => {
    expect(goalProgress(250, 1000).pct).toBe(25);
    expect(goalProgress(1, 3).pct).toBe(33);
  });

  it("clamps past the target but still reports it reached", () => {
    expect(goalProgress(1500, 1000)).toEqual({ pct: 100, reached: true });
  });

  it("treats an exactly-met target as reached", () => {
    expect(goalProgress(1000, 1000)).toEqual({ pct: 100, reached: true });
  });

  // The reason `reached` is not `pct === 100`: rounding arrives first.
  it("does NOT report reached when rounding alone gets to 100%", () => {
    const p = goalProgress(999.6, 1000);
    expect(p.pct).toBe(100);
    expect(p.reached).toBe(false);
  });

  it("handles a missing current value as zero", () => {
    expect(goalProgress(undefined, 100)).toEqual({ pct: 0, reached: false });
  });

  it("returns 0 rather than NaN/Infinity for a missing or zero target", () => {
    expect(goalProgress(5, undefined)).toEqual({ pct: 0, reached: false });
    expect(goalProgress(5, 0)).toEqual({ pct: 0, reached: false });
    expect(goalProgress(5, -10)).toEqual({ pct: 0, reached: false });
  });

  it("never returns a negative percentage for a negative current", () => {
    expect(goalProgress(-5, 100).pct).toBeLessThanOrEqual(0);
  });
});
