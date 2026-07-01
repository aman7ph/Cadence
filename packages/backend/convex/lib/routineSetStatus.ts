import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { requireUser } from "./auth";
import { recomputeStreak } from "./streak";
import { upsertDayStats } from "./dayStats";

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

  if (routine.goalId && routine.goalContribution && wasCompleted !== willBeCompleted) {
    const goal = await ctx.db.get(routine.goalId);
    if (goal) {
      const delta = willBeCompleted ? routine.goalContribution : -routine.goalContribution;
      await ctx.db.patch(routine.goalId, {
        currentValue: Math.max(0, (goal.currentValue ?? 0) + delta),
      });
    }
  }

  await recomputeStreak(ctx, args.routineId, args.today);
  await upsertDayStats(ctx, user._id, args.date);
}
