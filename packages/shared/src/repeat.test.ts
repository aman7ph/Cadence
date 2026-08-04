import { describe, expect, it } from "vitest";
import {
  MAX_REPEAT_INTERVAL_MINUTES,
  MAX_REPEAT_TARGET,
  MIN_REPEAT_TARGET,
  formatCountdown,
  formatIntervalMinutes,
  isRepAllowed,
  isValidRepeatIntervalMinutes,
  isValidRepeatTarget,
  nextAllowedAt,
  remainingMs,
} from "./repeat";

// Local wall-clock helper so the scenarios read like the spec.
const at = (h: number, m = 0) => Date.UTC(2026, 7, 4, h, m);
const HOUR = 60;

describe("nextAllowedAt", () => {
  it("is undefined before the first rep", () => {
    expect(nextAllowedAt(undefined, HOUR)).toBeUndefined();
  });

  it("is undefined when no interval is configured", () => {
    expect(nextAllowedAt(at(2), undefined)).toBeUndefined();
    expect(nextAllowedAt(at(2), 0)).toBeUndefined();
  });

  it("adds the interval to the last rep", () => {
    expect(nextAllowedAt(at(2), HOUR)).toBe(at(3));
    expect(nextAllowedAt(at(2), 30)).toBe(at(2, 30));
  });
});

describe("the gate does not compound", () => {
  // The scenario from the spec: interval 1h, reps at 2:00 then a late 3:35.
  // The third rep must wait a full hour from 3:35 — being late does not bank
  // credit toward the next one.
  it("re-anchors on the actual last rep, not on a schedule", () => {
    expect(nextAllowedAt(at(2, 0), HOUR)).toBe(at(3, 0));
    expect(nextAllowedAt(at(3, 35), HOUR)).toBe(at(4, 35));
  });

  it("blocks at 4:00 after a 3:35 rep and allows at 4:35", () => {
    expect(isRepAllowed(at(3, 35), HOUR, at(4, 0))).toBe(false);
    expect(isRepAllowed(at(3, 35), HOUR, at(4, 34))).toBe(false);
    expect(isRepAllowed(at(3, 35), HOUR, at(4, 35))).toBe(true);
    expect(isRepAllowed(at(3, 35), HOUR, at(5, 0))).toBe(true);
  });

  it("never grants a burst of catch-up reps", () => {
    // Ten hours after a single rep, exactly one rep is due — the gate is a
    // boolean, not an accrued allowance.
    expect(isRepAllowed(at(2), HOUR, at(12))).toBe(true);
    // …and logging it re-closes the gate for another full hour.
    expect(isRepAllowed(at(12), HOUR, at(12, 30))).toBe(false);
  });
});

describe("the gate ignores day boundaries", () => {
  it("still blocks after midnight, when the day's count has reset", () => {
    const lastRep = Date.UTC(2026, 7, 4, 23, 50);
    const justAfterMidnight = Date.UTC(2026, 7, 5, 0, 5);
    const fiftyPastMidnight = Date.UTC(2026, 7, 5, 0, 50);
    expect(isRepAllowed(lastRep, HOUR, justAfterMidnight)).toBe(false);
    expect(isRepAllowed(lastRep, HOUR, fiftyPastMidnight)).toBe(true);
  });
});

describe("isRepAllowed", () => {
  it("allows the first rep", () => {
    expect(isRepAllowed(undefined, HOUR, at(2))).toBe(true);
  });

  it("allows every rep when there is no interval", () => {
    expect(isRepAllowed(at(2), 0, at(2))).toBe(true);
    expect(isRepAllowed(at(2), undefined, at(2))).toBe(true);
  });

  it("allows a rep exactly on the deadline", () => {
    expect(isRepAllowed(at(2), HOUR, at(3))).toBe(true);
  });
});

describe("remainingMs", () => {
  it("is 0 when there is no gate", () => {
    expect(remainingMs(undefined, at(2))).toBe(0);
  });

  it("clamps to 0 once the deadline has passed", () => {
    expect(remainingMs(at(3), at(4))).toBe(0);
  });

  it("counts down to the deadline", () => {
    expect(remainingMs(at(3), at(2, 30))).toBe(30 * 60_000);
  });
});

describe("formatCountdown", () => {
  it("uses MM:SS under an hour", () => {
    expect(formatCountdown(0)).toBe("00:00");
    expect(formatCountdown(13_000)).toBe("00:13");
    expect(formatCountdown(4 * 60_000 + 13_000)).toBe("04:13");
    expect(formatCountdown(59 * 60_000 + 59_000)).toBe("59:59");
  });

  it("uses H:MM:SS at an hour and above", () => {
    expect(formatCountdown(60 * 60_000)).toBe("1:00:00");
    expect(formatCountdown(64 * 60_000 + 13_000)).toBe("1:04:13");
    expect(formatCountdown(24 * 60 * 60_000)).toBe("24:00:00");
  });

  it("rounds seconds up so it never reads 00:00 while still gated", () => {
    expect(formatCountdown(1)).toBe("00:01");
    expect(formatCountdown(999)).toBe("00:01");
    expect(formatCountdown(1001)).toBe("00:02");
  });

  it("clamps negatives", () => {
    expect(formatCountdown(-5000)).toBe("00:00");
  });
});

describe("formatIntervalMinutes", () => {
  it("reads back minutes so a free-text input can't be misread as hours", () => {
    expect(formatIntervalMinutes(45)).toBe("45m");
    expect(formatIntervalMinutes(90)).toBe("1h 30m");
    expect(formatIntervalMinutes(120)).toBe("2h");
    expect(formatIntervalMinutes(1440)).toBe("24h");
  });

  it("calls 0 and nonsense 'no wait'", () => {
    expect(formatIntervalMinutes(0)).toBe("no wait");
    expect(formatIntervalMinutes(-5)).toBe("no wait");
    expect(formatIntervalMinutes(NaN)).toBe("no wait");
  });
});

describe("validation", () => {
  it("accepts targets in range", () => {
    expect(isValidRepeatTarget(MIN_REPEAT_TARGET)).toBe(true);
    expect(isValidRepeatTarget(20)).toBe(true);
    expect(isValidRepeatTarget(MAX_REPEAT_TARGET)).toBe(true);
  });

  it("rejects a target of 1 (that is just a normal task)", () => {
    expect(isValidRepeatTarget(1)).toBe(false);
  });

  it("rejects out-of-range and non-integer targets", () => {
    expect(isValidRepeatTarget(0)).toBe(false);
    expect(isValidRepeatTarget(-5)).toBe(false);
    expect(isValidRepeatTarget(MAX_REPEAT_TARGET + 1)).toBe(false);
    expect(isValidRepeatTarget(2.5)).toBe(false);
    expect(isValidRepeatTarget(NaN)).toBe(false);
  });

  it("accepts 0 minutes — N reps with no waiting period is a valid choice", () => {
    expect(isValidRepeatIntervalMinutes(0)).toBe(true);
  });

  it("accepts intervals up to 24h", () => {
    expect(isValidRepeatIntervalMinutes(60)).toBe(true);
    expect(isValidRepeatIntervalMinutes(MAX_REPEAT_INTERVAL_MINUTES)).toBe(true);
  });

  it("rejects negative, oversized, and non-integer intervals", () => {
    expect(isValidRepeatIntervalMinutes(-1)).toBe(false);
    expect(isValidRepeatIntervalMinutes(MAX_REPEAT_INTERVAL_MINUTES + 1)).toBe(false);
    expect(isValidRepeatIntervalMinutes(1.5)).toBe(false);
    expect(isValidRepeatIntervalMinutes(NaN)).toBe(false);
  });
});
