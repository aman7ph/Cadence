import { v } from "convex/values";
import { query } from "./_generated/server";
import { resolveUser } from "./lib/resolveUser";

/**
 * Check-in timing — "when you actually check in on spread-out tasks".
 *
 * Returns raw `completedAt` timestamps rather than server-side hour buckets.
 * That is deliberate: `date` on these rows is a client-local YYYY-MM-DD while
 * `completedAt` is server epoch ms (see the comment in tables/tasks.ts). Hour
 * bucketing has to happen in the VIEWER's timezone, so bucketing here with
 * `getHours()` would silently shift the whole histogram by the UTC offset.
 *
 * Both rep logs are included: a "check-in" is a rep, whether the thing being
 * repeated is a task or a routine.
 */
export const checkinTimestamps = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, { from, to }): Promise<number[]> => {
    const user = await resolveUser(ctx);
    if (!user) return [];

    const taskReps = await ctx.db
      .query("taskCompletions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).gte("date", from).lte("date", to),
      )
      .collect();

    const routineReps = await ctx.db
      .query("routineReps")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).gte("date", from).lte("date", to),
      )
      .collect();

    return [...taskReps, ...routineReps].map((r) => r.completedAt);
  },
});
