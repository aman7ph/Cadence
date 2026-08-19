// "Fetch it and prove it is mine" — the three lines that open nearly every
// mutation in this codebase:
//
//   const user = await requireUser(ctx);
//   const doc = await ctx.db.get(id);
//   if (!doc || doc.userId !== user._id) throw new Error("… not found");
//
// Written out fifteen times across six files, which is fifteen chances to
// forget the ownership half and turn a mutation into one that edits anyone's
// row. Centralising it makes the check impossible to omit.
//
// "Not found" rather than "not yours" is deliberate and preserved from the
// original sites: telling a caller that someone else's id exists is itself a
// disclosure.
//
// These are the WRITE path and they THROW. Three read sites — goals.get and
// goalLinks' two queries — deliberately keep their own inline check, because
// they pair `resolveUser` (null when signed out) with `return null` rather than
// throwing. A query that throws at a signed-out caller instead of returning
// nothing is a different behaviour, so they are not a gap in this adoption.

import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { requireUser } from "./auth";

export async function requireOwnedRoutine(
  ctx: QueryCtx | MutationCtx,
  routineId: Id<"routines">,
): Promise<Doc<"routines">> {
  const user = await requireUser(ctx);
  const routine = await ctx.db.get(routineId);
  if (!routine || routine.userId !== user._id)
    throw new Error("Routine not found");
  return routine;
}

export async function requireOwnedGoal(
  ctx: QueryCtx | MutationCtx,
  goalId: Id<"goals">,
): Promise<Doc<"goals">> {
  const user = await requireUser(ctx);
  const goal = await ctx.db.get(goalId);
  if (!goal || goal.userId !== user._id) throw new Error("Goal not found");
  return goal;
}

export async function requireOwnedTask(
  ctx: QueryCtx | MutationCtx,
  taskId: Id<"dailyTasks">,
): Promise<Doc<"dailyTasks">> {
  const user = await requireUser(ctx);
  const task = await ctx.db.get(taskId);
  if (!task || task.userId !== user._id) throw new Error("Task not found");
  return task;
}

export async function requireOwnedStagedTask(
  ctx: QueryCtx | MutationCtx,
  stagedTaskId: Id<"stagedTasks">,
): Promise<Doc<"stagedTasks">> {
  const user = await requireUser(ctx);
  const staged = await ctx.db.get(stagedTaskId);
  if (!staged || staged.userId !== user._id)
    throw new Error("Staged task not found");
  return staged;
}
