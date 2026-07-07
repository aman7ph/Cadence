import { daysBetween } from "@cadence/shared";
import type { MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

// Materializes a scheduled staged task into its destination table and deletes
// the staged row. Late promotion (today > scheduledDate) mirrors what the
// existing systems would have produced had the item existed on its scheduled
// date: tasks arrive carried-over (originalDate = scheduledDate), routines
// start from today so isScheduledOn can't backfill "missed" days.
export async function promoteStagedTask(
  ctx: MutationCtx,
  staged: Doc<"stagedTasks">,
  today: string,
): Promise<void> {
  if (!staged.scheduledDate || !staged.targetType) {
    throw new Error("Staged task is not scheduled");
  }
  if (staged.targetType === "task") {
    await ctx.db.insert("dailyTasks", {
      userId: staged.userId,
      title: staged.title,
      description: staged.description,
      originalDate: staged.scheduledDate,
      currentDate: today,
      status: "open",
      carryoverCount: daysBetween(staged.scheduledDate, today) - 1,
      createdAt: Date.now(),
      goalId: staged.goalId,
      goalContribution: staged.goalContribution,
    });
  } else {
    if (!staged.routineScheduleType) {
      throw new Error("Staged routine is missing its schedule");
    }
    await ctx.db.insert("routines", {
      userId: staged.userId,
      name: staged.title,
      description: staged.description,
      scheduleType: staged.routineScheduleType,
      customDays:
        staged.routineScheduleType === "custom"
          ? staged.routineCustomDays
          : undefined,
      isActive: true,
      createdDate: today,
      currentStreak: 0,
      longestStreak: 0,
      goalId: staged.goalId,
      goalContribution: staged.goalContribution,
    });
  }
  await ctx.db.delete(staged._id);
}
