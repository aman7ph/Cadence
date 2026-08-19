import { describe, expect, it } from "vitest";
import {
  DEFAULT_REMINDER,
  MAX_REMINDER_INTERVAL_MINUTES,
  MAX_REMINDER_SLOTS,
  MIN_REMINDER_INTERVAL_MINUTES,
  type ReminderSettings,
  computeReminderSlots,
  formatMinuteOfDay,
  isValidReminderInterval,
  isValidReminderWindow,
  reminderSlotCount,
  reminderValidationError,
  reminderWindowLength,
  validateReminder,
} from "./reminder";

// Local wall-clock helper so the scenarios read like the spec.
const at = (hour: number, minute = 0) => hour * 60 + minute;

const settings = (over: Partial<ReminderSettings> = {}): ReminderSettings => ({
  ...DEFAULT_REMINDER,
  ...over,
});

describe("reminderWindowLength", () => {
  it("measures a same-day window", () => {
    expect(reminderWindowLength(at(9), at(22))).toBe(780);
  });

  it("treats an end before the start as crossing midnight", () => {
    // 22:00 → 06:00 is 8h, not −16h.
    expect(reminderWindowLength(at(22), at(6))).toBe(480);
  });

  it("handles a one-minute window across the boundary", () => {
    expect(reminderWindowLength(at(23, 59), at(0))).toBe(1);
  });
});

describe("formatMinuteOfDay", () => {
  it("pads both halves to two digits", () => {
    expect(formatMinuteOfDay(at(0))).toBe("00:00");
    expect(formatMinuteOfDay(at(9))).toBe("09:00");
    expect(formatMinuteOfDay(at(9, 5))).toBe("09:05");
    expect(formatMinuteOfDay(at(22))).toBe("22:00");
    expect(formatMinuteOfDay(at(23, 59))).toBe("23:59");
  });

  it("wraps rather than throwing on out-of-range input", () => {
    expect(formatMinuteOfDay(1440)).toBe("00:00");
    expect(formatMinuteOfDay(-60)).toBe("23:00");
  });
});

describe("computeReminderSlots", () => {
  it("enumerates the window inclusive of both endpoints", () => {
    // The worked example from the plan: 09:00–21:00 every 90m.
    const slots = computeReminderSlots(at(9), at(21), 90);
    expect(slots).toHaveLength(9);
    expect(slots[0]).toEqual({ hour: 9, minute: 0 });
    expect(slots[4]).toEqual({ hour: 15, minute: 0 });
    expect(slots[8]).toEqual({ hour: 21, minute: 0 });
  });

  it("stops short when the interval does not divide the window", () => {
    // 09:00–22:00 is 780m; every 120m fits 6 whole steps, so the last slot is
    // 21:00 and the window's own end is never reached.
    const slots = computeReminderSlots(at(9), at(22), 120);
    expect(slots).toHaveLength(7);
    expect(slots[slots.length - 1]).toEqual({ hour: 21, minute: 0 });
  });

  it("walks across midnight", () => {
    const slots = computeReminderSlots(at(22), at(6), 120);
    expect(slots).toEqual([
      { hour: 22, minute: 0 },
      { hour: 0, minute: 0 },
      { hour: 2, minute: 0 },
      { hour: 4, minute: 0 },
      { hour: 6, minute: 0 },
    ]);
  });

  it("keeps minutes that are not on the hour", () => {
    const slots = computeReminderSlots(at(9, 20), at(10, 50), 45);
    expect(slots).toEqual([
      { hour: 9, minute: 20 },
      { hour: 10, minute: 5 },
      { hour: 10, minute: 50 },
    ]);
  });

  it("returns nothing for a non-positive or non-finite interval", () => {
    // Guards the loop: a zero or negative step would never terminate.
    expect(computeReminderSlots(at(9), at(22), 0)).toEqual([]);
    expect(computeReminderSlots(at(9), at(22), -30)).toEqual([]);
    expect(computeReminderSlots(at(9), at(22), Number.NaN)).toEqual([]);
  });
});

describe("reminderSlotCount", () => {
  it("agrees with computeReminderSlots for every shape of window", () => {
    const cases: [number, number, number][] = [
      [at(9), at(21), 90],
      [at(9), at(22), 120],
      [at(22), at(6), 120],
      [at(9, 20), at(10, 50), 45],
      [at(0), at(23), 15],
      [at(23, 59), at(0), 15],
      [at(6), at(6, 30), 480],
    ];
    for (const [start, end, interval] of cases) {
      expect(reminderSlotCount(start, end, interval)).toBe(
        computeReminderSlots(start, end, interval).length,
      );
    }
  });

  it("is 0 for a non-positive interval, matching the empty slot list", () => {
    expect(reminderSlotCount(at(9), at(22), 0)).toBe(0);
  });
});

describe("isValidReminderInterval", () => {
  it("accepts the inclusive bounds", () => {
    expect(isValidReminderInterval(MIN_REMINDER_INTERVAL_MINUTES)).toBe(true);
    expect(isValidReminderInterval(MAX_REMINDER_INTERVAL_MINUTES)).toBe(true);
    expect(isValidReminderInterval(120)).toBe(true);
  });

  it("rejects anything outside them, and anything not a whole minute", () => {
    expect(isValidReminderInterval(MIN_REMINDER_INTERVAL_MINUTES - 1)).toBe(
      false,
    );
    expect(isValidReminderInterval(MAX_REMINDER_INTERVAL_MINUTES + 1)).toBe(
      false,
    );
    expect(isValidReminderInterval(0)).toBe(false);
    expect(isValidReminderInterval(-15)).toBe(false);
    expect(isValidReminderInterval(15.5)).toBe(false);
    expect(isValidReminderInterval(Number.NaN)).toBe(false);
  });
});

describe("isValidReminderWindow", () => {
  it("accepts a same-day window and one that crosses midnight", () => {
    expect(isValidReminderWindow(at(9), at(22))).toBe(true);
    expect(isValidReminderWindow(at(22), at(6))).toBe(true);
    expect(isValidReminderWindow(0, 1439)).toBe(true);
  });

  it("rejects equal endpoints rather than guessing", () => {
    // 09:00 → 09:00 could mean "zero length" or "all day"; neither is assumed.
    expect(isValidReminderWindow(at(9), at(9))).toBe(false);
  });

  it("rejects values outside a single day, and non-integers", () => {
    expect(isValidReminderWindow(-1, at(9))).toBe(false);
    expect(isValidReminderWindow(at(9), 1440)).toBe(false);
    expect(isValidReminderWindow(540.5, at(22))).toBe(false);
  });
});

describe("reminderValidationError", () => {
  it("passes the default settings", () => {
    expect(reminderValidationError(DEFAULT_REMINDER)).toBeNull();
  });

  it("reports a bad interval with its bounds", () => {
    const error = reminderValidationError(settings({ intervalMinutes: 5 }));
    expect(error).toContain(String(MIN_REMINDER_INTERVAL_MINUTES));
    expect(error).toContain(String(MAX_REMINDER_INTERVAL_MINUTES));
  });

  it("reports equal endpoints", () => {
    const error = reminderValidationError(
      settings({ startMinute: at(9), endMinute: at(9) }),
    );
    expect(error).toMatch(/same/i);
  });

  it("rejects a combination that would schedule too many reminders", () => {
    // 00:00–23:00 every 15m is 93 slots.
    const error = reminderValidationError(
      settings({ startMinute: at(0), endMinute: at(23), intervalMinutes: 15 }),
    );
    expect(error).toContain("93");
    expect(error).toContain(String(MAX_REMINDER_SLOTS));
  });

  it("allows a combination sitting exactly on the cap", () => {
    // 885m at 15m steps is exactly MAX_REMINDER_SLOTS slots.
    const onTheCap = settings({
      startMinute: at(0),
      endMinute: 885,
      intervalMinutes: 15,
    });
    expect(reminderSlotCount(0, 885, 15)).toBe(MAX_REMINDER_SLOTS);
    expect(reminderValidationError(onTheCap)).toBeNull();
  });

  it("does not care whether the reminder is enabled", () => {
    // Settings are validated on their own terms, so a disabled reminder
    // cannot be saved with values that would break once switched on.
    expect(reminderValidationError(settings({ enabled: true }))).toBeNull();
    expect(
      reminderValidationError(settings({ enabled: false, intervalMinutes: 1 })),
    ).not.toBeNull();
  });
});

describe("validateReminder", () => {
  it("is silent for acceptable settings", () => {
    expect(() => validateReminder(DEFAULT_REMINDER)).not.toThrow();
  });

  it("throws the same message the form would show", () => {
    const bad = settings({ intervalMinutes: 1 });
    expect(() => validateReminder(bad)).toThrow(reminderValidationError(bad)!);
  });
});
