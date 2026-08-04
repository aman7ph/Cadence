import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

// Routine counterparts of lib/taskRepeat.ts. Kept separate rather than
// generic: the two entities read different tables and Convex's index typing
// gives nothing useful to abstract over here.

// Guards the plain complete/uncomplete mutations. A repeat routine must go
// through routineRepeats.logRep/undoRep, which is where the interval gate is.
export function assertPlainRoutine(routine: Doc<"routines">): void {
  if (routine.repeatTarget) {
    throw new Error("This routine repeats — use the repeat controls");
  }
}

// How many reps each of the user's routines logged on `date`. One indexed
// read for the whole day rather than one per routine.
export async function countRepsByRoutine(
  ctx: QueryCtx,
  userId: Id<"users">,
  date: string,
): Promise<Map<Id<"routines">, number>> {
  const reps = await ctx.db
    .query("routineReps")
    .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
    .collect();
  const counts = new Map<Id<"routines">, number>();
  for (const rep of reps) {
    counts.set(rep.routineId, (counts.get(rep.routineId) ?? 0) + 1);
  }
  return counts;
}

// Removes a routine's rep log, so permanently deleting a routine leaves no
// orphaned rows behind.
export async function deleteRoutineReps(
  ctx: MutationCtx,
  routineId: Id<"routines">,
): Promise<void> {
  const reps = await ctx.db
    .query("routineReps")
    .withIndex("by_routine", (q) => q.eq("routineId", routineId))
    .collect();
  for (const rep of reps) {
    await ctx.db.delete(rep._id);
  }
}
