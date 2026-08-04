import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// Moves a linked goal's currentValue when the thing contributing to it is
// completed (direction 1) or that completion is reversed (direction -1).
// Extracted from the two identical blocks in dailyTasks.ts; the repeat
// mutations need the same behavior, and three hand-rolled copies of a
// clamped read-modify-write is how the clamp eventually goes missing in one.
//
// No-ops unless both a goal and a non-zero contribution are set, so callers
// can pass the task's fields through unguarded.
export async function applyGoalContribution(
  ctx: MutationCtx,
  goalId: Id<"goals"> | undefined,
  contribution: number | undefined,
  direction: 1 | -1,
): Promise<void> {
  if (!goalId || !contribution) return;
  const goal = await ctx.db.get(goalId);
  if (!goal) return;
  await ctx.db.patch(goalId, {
    currentValue: Math.max(
      0,
      (goal.currentValue ?? 0) + direction * contribution,
    ),
  });
}
