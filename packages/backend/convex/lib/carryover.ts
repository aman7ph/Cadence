import { daysBetween } from "@cadence/shared";
import type { Doc } from "../_generated/dataModel";

// How many times a task was actually carried before it stopped moving.
//
// The stored `carryoverCount` field cannot answer this. It counts rollover
// *events*, and `rolloverOpenTasks` only fires when the app is opened — leave a
// task open on the 1st, next open the app on the 8th, and `currentDate` jumps
// straight there with `carryoverCount + 1`, recording a single carry for seven
// days of waiting. lib/taskDay.ts:117-127 documents this and notes that
// analyticsTasks reads the field directly, calling it "a separate defect with
// its own blast radius". This module is that defect's fix.
//
// The presence log has the real answer because presence is contiguous — every
// writer fills its whole span — so the days a task sat on the plate are exactly
// [originalDate … endDate], and the number of *carries* is one less than the
// number of days. `daysBetween` is inclusive, which is what makes that a
// subtraction of one rather than a loop over the log.
//
// The end of a task's life is `completedDate` when it finished and `currentDate`
// when it did not — the same pair the backfill in taskDays.ts:84-85 uses to
// reconstruct a span, so a derived count and a reconstructed span always agree.
//
// Deliberately NOT used by the Today badge: lib/taskDay.carryoverOn keeps the
// stored value for the current day so the badge does not shift under the user
// mid-day. Only analytics changes here.
export function carryoverForTask(task: Doc<"dailyTasks">): number {
  const endDate = task.completedDate ?? task.currentDate;
  // Clamped because a malformed row (endDate before originalDate) should read
  // as "never carried" rather than as a negative that would skew an average.
  return Math.max(0, daysBetween(task.originalDate, endDate) - 1);
}
