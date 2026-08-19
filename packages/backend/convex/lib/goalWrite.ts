import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export type GoalPatch = {
  title?: string;
  description?: string;
  targetValue?: number;
  unit?: string;
  dueDate?: string;
};

// Only the fields the caller actually sent are patched. `undefined` means "not
// supplied" and must leave the stored value alone, whereas an empty string
// means "clear it" — collapsing those two would make every partial edit wipe
// the fields it did not mention.
export function buildGoalPatch(args: {
  title?: string;
  description?: string;
  targetValue?: number;
  unit?: string;
  dueDate?: string;
}): GoalPatch {
  const patch: GoalPatch = {};
  if (args.title !== undefined) patch.title = args.title.trim();
  if (args.description !== undefined)
    patch.description = args.description.trim() || undefined;
  if (args.targetValue !== undefined) patch.targetValue = args.targetValue;
  if (args.unit !== undefined) patch.unit = args.unit.trim() || undefined;
  if (args.dueDate !== undefined) patch.dueDate = args.dueDate || undefined;
  return patch;
}

// Detaches every task and routine pointing at a goal, so deleting it cannot
// leave rows referencing an id that no longer resolves.
//
// goalContribution is cleared alongside goalId: a contribution weight with no
// goal to contribute to is meaningless, and leaving it behind would silently
// re-apply if the row were later linked to a different goal.
export async function unlinkGoalEverywhere(
  ctx: MutationCtx,
  goalId: Id<"goals">,
): Promise<void> {
  const tasks = await ctx.db
    .query("dailyTasks")
    .withIndex("by_goal", (q) => q.eq("goalId", goalId))
    .collect();
  for (const task of tasks) {
    await ctx.db.patch(task._id, {
      goalId: undefined,
      goalContribution: undefined,
    });
  }

  const routines = await ctx.db
    .query("routines")
    .withIndex("by_goal", (q) => q.eq("goalId", goalId))
    .collect();
  for (const routine of routines) {
    await ctx.db.patch(routine._id, {
      goalId: undefined,
      goalContribution: undefined,
    });
  }
}
