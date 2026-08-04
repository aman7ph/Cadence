import {
  MAX_REPEAT_INTERVAL_MINUTES,
  MAX_REPEAT_TARGET,
  MIN_REPEAT_TARGET,
  isValidRepeatIntervalMinutes,
  isValidRepeatTarget,
} from "@cadence/shared";
import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

// Rejects repeat settings that the shared validators consider malformed, so
// the mutations and the creation forms agree on what is acceptable.
export function validateRepeatArgs(
  repeatTarget: number | undefined,
  repeatIntervalMinutes: number | undefined,
): void {
  if (repeatTarget === undefined) {
    if (repeatIntervalMinutes) {
      throw new Error("A repeat interval needs a repeat count");
    }
    return;
  }
  if (!isValidRepeatTarget(repeatTarget)) {
    throw new Error(
      `Repeat count must be a whole number from ${MIN_REPEAT_TARGET} to ${MAX_REPEAT_TARGET}`,
    );
  }
  if (
    repeatIntervalMinutes !== undefined &&
    !isValidRepeatIntervalMinutes(repeatIntervalMinutes)
  ) {
    throw new Error(
      `Repeat interval must be a whole number of minutes from 0 to ${MAX_REPEAT_INTERVAL_MINUTES}`,
    );
  }
}

// Guards the plain complete/uncomplete mutations. A repeat task must go
// through logRep/undoRep, which is where the interval gate lives — otherwise
// any client holding the old mutation could mark one done and skip the wait.
export function assertPlainTask(task: Doc<"dailyTasks">): void {
  if (task.repeatTarget) {
    throw new Error("This task repeats — use the repeat controls");
  }
}

// Removes a task's rep log. Called when the task itself is deleted, so no
// orphaned taskCompletions rows are left pointing at a missing task.
export async function deleteTaskCompletions(
  ctx: MutationCtx,
  taskId: Id<"dailyTasks">,
): Promise<void> {
  const reps = await ctx.db
    .query("taskCompletions")
    .withIndex("by_task", (q) => q.eq("taskId", taskId))
    .collect();
  for (const rep of reps) {
    await ctx.db.delete(rep._id);
  }
}
