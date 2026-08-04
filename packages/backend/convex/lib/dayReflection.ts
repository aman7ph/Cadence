import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// Extracted from days.ts to keep that file within the project's 150-line
// limit. Behavior is unchanged — this is the same read it always was.
export type DayReflection = {
  text: string;
  taggedRoutineIds: Id<"routines">[];
  taggedTaskIds: Id<"dailyTasks">[];
  updatedAt: number;
};

// The day's reflection with its @mention tags resolved, or null when nothing
// was written that day.
export async function loadDayReflection(
  ctx: QueryCtx,
  userId: Id<"users">,
  date: string,
): Promise<DayReflection | null> {
  const doc = await ctx.db
    .query("dailyReflections")
    .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
    .unique();
  if (!doc) return null;

  const tags = await ctx.db
    .query("reflectionTags")
    .withIndex("by_reflection", (q) => q.eq("reflectionId", doc._id))
    .collect();

  return {
    text: doc.text,
    taggedRoutineIds: tags
      .map((t) => t.routineId)
      .filter((id): id is Id<"routines"> => id !== undefined),
    taggedTaskIds: tags
      .map((t) => t.taskId)
      .filter((id): id is Id<"dailyTasks"> => id !== undefined),
    updatedAt: doc.updatedAt,
  };
}
