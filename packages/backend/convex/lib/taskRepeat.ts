import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

// `validateRepeatArgs` used to live here; it moved to packages/shared once
// routines needed it too (RD3), since it is pure and entity-agnostic.

// Guards the plain complete/uncomplete mutations. A repeat task must go
// through logRep/undoRep, which is where the interval gate lives — otherwise
// any client holding the old mutation could mark one done and skip the wait.
export function assertPlainTask(task: Doc<"dailyTasks">): void {
  if (task.repeatTarget) {
    throw new Error("This task repeats — use the repeat controls");
  }
}

// How many reps each of the user's tasks logged on `date`. One indexed read
// for the whole day rather than one per task — the same shape as the
// completions map days.getDay already builds for routines.
export async function countRepsByTask(
  ctx: QueryCtx,
  userId: Id<"users">,
  date: string,
): Promise<Map<Id<"dailyTasks">, number>> {
  const reps = await ctx.db
    .query("taskCompletions")
    .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
    .collect();
  const counts = new Map<Id<"dailyTasks">, number>();
  for (const rep of reps) {
    counts.set(rep.taskId, (counts.get(rep.taskId) ?? 0) + 1);
  }
  return counts;
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
