// Thin adapter over @cadence/shared schedule logic. The shared module takes
// a plain Schedule object; this file resolves the Convex Doc into one and
// delegates. Re-exports addDays/weekdayOf so existing imports keep working.
import { isScheduledOn as sharedIsScheduledOn } from "@cadence/shared";
import type { Doc } from "../_generated/dataModel";

export { addDays, weekdayOf } from "@cadence/shared";

export function isScheduledOn(routine: Doc<"routines">, date: string): boolean {
  return sharedIsScheduledOn(
    {
      scheduleType: routine.scheduleType,
      customDays: routine.customDays,
      createdDate: routine.createdDate,
      archivedDate: routine.archivedDate,
    },
    date,
  );
}
