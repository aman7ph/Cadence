import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { requireUser } from "./auth";
import { recomputeStreak } from "./streak";
import { upsertDayStats } from "./dayStats";
import { applyGoalContribution } from "./goalContribution";

export async function setStatus(
  ctx: MutationCtx,
  args: {
    routineId: Id<"routines">;
    date: string;
    today: string;
    status: "completed" | "skipped";
  },
) {
  const user = await requireUser(ctx);
  const routine = await ctx.db.get(args.routineId);
  if (!routine || routine.userId !== user._id) throw new Error("Routine not found");
  const existing = await ctx.db
    .query("routineCompletions")
    .withIndex("by_routine_date", (q) =>
      q.eq("routineId", args.routineId).eq("date", args.date),
    )
    .unique();

  const wasCompleted = existing?.status === "completed";
  const willBeCompleted = args.status === "completed";

  if (existing) {
    if (existing.status !== args.status) {
      await ctx.db.patch(existing._id, { status: args.status, completedAt: Date.now() });
    }
  } else {
    await ctx.db.insert("routineCompletions", {
      userId: user._id,
      routineId: args.routineId,
      date: args.date,
      status: args.status,
      completedAt: Date.now(),
    });
  }

  if (wasCompleted !== willBeCompleted) {
    await applyGoalContribution(
      ctx,
      routine.goalId,
      routine.goalContribution,
      willBeCompleted ? 1 : -1,
    );
  }

  await recomputeStreak(ctx, args.routineId, args.today);
  await upsertDayStats(ctx, user._id, args.date);
}

// Reverses whatever status a day holds: drops the completion/skip row, gives
// back any goal credit, and recomputes streak + day stats. Shared by
// routines.uncomplete and the repeat undo, which must not diverge.
export async function clearStatus(
  ctx: MutationCtx,
  args: { routineId: Id<"routines">; date: string; today: string },
): Promise<void> {
  const user = await requireUser(ctx);
  const routine = await ctx.db.get(args.routineId);
  if (!routine || routine.userId !== user._id) throw new Error("Routine not found");
  const existing = await ctx.db
    .query("routineCompletions")
    .withIndex("by_routine_date", (q) =>
      q.eq("routineId", args.routineId).eq("date", args.date),
    )
    .unique();
  if (!existing) return;

  const wasCompleted = existing.status === "completed";
  await ctx.db.delete(existing._id);
  if (wasCompleted) {
    await applyGoalContribution(ctx, routine.goalId, routine.goalContribution, -1);
  }
  await recomputeStreak(ctx, args.routineId, args.today);
  await upsertDayStats(ctx, user._id, args.date);
}
