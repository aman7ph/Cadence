import { describe, expect, it } from "vitest";
import { isScheduledOn, type Schedule } from "./schedule";

const daily: Schedule = {
  scheduleType: "daily",
  createdDate: "2026-06-01",
};

const weekdays: Schedule = {
  scheduleType: "weekdays",
  createdDate: "2026-06-01",
};

const customMonWed: Schedule = {
  scheduleType: "custom",
  customDays: [1, 3], // Mon, Wed
  createdDate: "2026-06-01",
};

describe("isScheduledOn", () => {
  it("daily: any day on or after createdDate is scheduled", () => {
    expect(isScheduledOn(daily, "2026-06-25")).toBe(true);
    expect(isScheduledOn(daily, "2026-06-01")).toBe(true);
  });

  it("daily: any day before createdDate is not scheduled", () => {
    expect(isScheduledOn(daily, "2026-05-31")).toBe(false);
  });

  it("weekdays: Mon-Fri true, Sat-Sun false", () => {
    // 2026-06-22 is a Monday
    expect(isScheduledOn(weekdays, "2026-06-22")).toBe(true); // Mon
    expect(isScheduledOn(weekdays, "2026-06-26")).toBe(true); // Fri
    expect(isScheduledOn(weekdays, "2026-06-27")).toBe(false); // Sat
    expect(isScheduledOn(weekdays, "2026-06-28")).toBe(false); // Sun
  });

  it("custom: only the listed weekdays are scheduled", () => {
    expect(isScheduledOn(customMonWed, "2026-06-22")).toBe(true); // Mon
    expect(isScheduledOn(customMonWed, "2026-06-24")).toBe(true); // Wed
    expect(isScheduledOn(customMonWed, "2026-06-23")).toBe(false); // Tue
    expect(isScheduledOn(customMonWed, "2026-06-26")).toBe(false); // Fri
  });

  it("archive boundary: archivedDate is inclusive, beyond it is not scheduled", () => {
    const archived: Schedule = {
      ...daily,
      archivedDate: "2026-06-20",
    };
    expect(isScheduledOn(archived, "2026-06-20")).toBe(true);
    expect(isScheduledOn(archived, "2026-06-21")).toBe(false);
  });

  it("custom without customDays returns false", () => {
    const broken: Schedule = {
      scheduleType: "custom",
      createdDate: "2026-06-01",
    };
    expect(isScheduledOn(broken, "2026-06-25")).toBe(false);
  });
});
