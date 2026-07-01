import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  daysInMonth,
  endOfMonth,
  endOfWeek,
  endOfYear,
  firstWeekdayOfMonth,
  nextMonth,
  prevMonth,
  startOfMonth,
  startOfWeek,
  startOfYear,
  weekdayOf,
} from "./date";

describe("addDays", () => {
  it("adds positive delta", () => {
    expect(addDays("2026-06-25", 5)).toBe("2026-06-30");
  });
  it("crosses month boundary", () => {
    expect(addDays("2026-06-30", 1)).toBe("2026-07-01");
  });
  it("crosses year boundary", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("subtracts with negative delta", () => {
    expect(addDays("2026-07-01", -1)).toBe("2026-06-30");
  });
  it("handles leap day", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2024-02-29", 1)).toBe("2024-03-01");
  });
});

describe("weekdayOf", () => {
  // 2026-06-25 is a Thursday (4)
  it("returns correct UTC weekday", () => {
    expect(weekdayOf("2026-06-25")).toBe(4);
  });
  // 2026-06-22 is Monday (1)
  it("Monday", () => {
    expect(weekdayOf("2026-06-22")).toBe(1);
  });
  // 2026-06-21 is Sunday (0)
  it("Sunday", () => {
    expect(weekdayOf("2026-06-21")).toBe(0);
  });
});

describe("daysBetween", () => {
  it("same day = 1", () => {
    expect(daysBetween("2026-06-25", "2026-06-25")).toBe(1);
  });
  it("two consecutive days = 2", () => {
    expect(daysBetween("2026-06-24", "2026-06-25")).toBe(2);
  });
  it("full week = 7", () => {
    expect(daysBetween("2026-06-19", "2026-06-25")).toBe(7);
  });
  it("30 days", () => {
    expect(daysBetween("2026-05-26", "2026-06-24")).toBe(30);
  });
  it("crosses year boundary", () => {
    expect(daysBetween("2025-12-31", "2026-01-01")).toBe(2);
  });
});

describe("startOfWeek / endOfWeek (ISO: Monday first)", () => {
  // 2026-06-25 is Thursday — week Mon 2026-06-22 to Sun 2026-06-28
  it("Thursday → Monday of that week", () => {
    expect(startOfWeek("2026-06-25")).toBe("2026-06-22");
  });
  it("Thursday → Sunday of that week", () => {
    expect(endOfWeek("2026-06-25")).toBe("2026-06-28");
  });
  it("Monday → same day", () => {
    expect(startOfWeek("2026-06-22")).toBe("2026-06-22");
  });
  it("Sunday → previous Monday", () => {
    // 2026-06-21 is Sunday; previous Monday = 2026-06-15
    expect(startOfWeek("2026-06-21")).toBe("2026-06-15");
  });
  it("crosses month boundary", () => {
    // 2026-07-01 is Wednesday; Monday = 2026-06-29
    expect(startOfWeek("2026-07-01")).toBe("2026-06-29");
  });
});

describe("startOfMonth / endOfMonth", () => {
  it("June 25 → June 1", () => {
    expect(startOfMonth("2026-06-25")).toBe("2026-06-01");
  });
  it("June 25 → June 30", () => {
    expect(endOfMonth("2026-06-25")).toBe("2026-06-30");
  });
  it("February in leap year → Feb 29", () => {
    expect(endOfMonth("2024-02-15")).toBe("2024-02-29");
  });
  it("February in non-leap year → Feb 28", () => {
    expect(endOfMonth("2026-02-15")).toBe("2026-02-28");
  });
  it("December → Dec 31", () => {
    expect(endOfMonth("2026-12-01")).toBe("2026-12-31");
  });
  it("January → Jan 31", () => {
    expect(endOfMonth("2026-01-01")).toBe("2026-01-31");
  });
});

describe("startOfYear / endOfYear", () => {
  it("any date → Jan 1", () => {
    expect(startOfYear("2026-06-25")).toBe("2026-01-01");
  });
  it("any date → Dec 31", () => {
    expect(endOfYear("2026-06-25")).toBe("2026-12-31");
  });
});

describe("prevMonth / nextMonth", () => {
  it("mid-year prev", () => {
    expect(prevMonth("2026-06")).toBe("2026-05");
  });
  it("January → December of prior year", () => {
    expect(prevMonth("2026-01")).toBe("2025-12");
  });
  it("mid-year next", () => {
    expect(nextMonth("2026-06")).toBe("2026-07");
  });
  it("December → January of next year", () => {
    expect(nextMonth("2026-12")).toBe("2027-01");
  });
  it("round-trips", () => {
    expect(nextMonth(prevMonth("2026-06"))).toBe("2026-06");
  });
});

describe("daysInMonth", () => {
  it("June = 30", () => {
    expect(daysInMonth("2026-06")).toBe(30);
  });
  it("July = 31", () => {
    expect(daysInMonth("2026-07")).toBe(31);
  });
  it("Feb 2024 = 29 (leap)", () => {
    expect(daysInMonth("2024-02")).toBe(29);
  });
  it("Feb 2026 = 28 (non-leap)", () => {
    expect(daysInMonth("2026-02")).toBe(28);
  });
  it("December = 31", () => {
    expect(daysInMonth("2026-12")).toBe(31);
  });
});

describe("firstWeekdayOfMonth", () => {
  // 2026-06-01 is a Monday (1)
  it("June 2026 starts on Monday (1)", () => {
    expect(firstWeekdayOfMonth("2026-06")).toBe(1);
  });
  // 2026-07-01 is a Wednesday (3)
  it("July 2026 starts on Wednesday (3)", () => {
    expect(firstWeekdayOfMonth("2026-07")).toBe(3);
  });
  // 2024-01-01 is a Monday (1)
  it("January 2024 starts on Monday (1)", () => {
    expect(firstWeekdayOfMonth("2024-01")).toBe(1);
  });
  // 2026-01-01 is a Thursday (4)
  it("January 2026 starts on Thursday (4)", () => {
    expect(firstWeekdayOfMonth("2026-01")).toBe(4);
  });
});
