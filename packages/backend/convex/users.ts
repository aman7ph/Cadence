import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./lib/auth";

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    return user;
  },
});

export const ensureProvisioned = mutation({
  args: {},
  handler: async (ctx) => {
    return await requireUser(ctx);
  },
});

export const setRoutineWeight = mutation({
  args: { routineWeight: v.number() },
  handler: async (ctx, { routineWeight }) => {
    if (!Number.isFinite(routineWeight) || routineWeight < 0 || routineWeight > 1) {
      throw new Error("routineWeight must be a finite number in [0, 1]");
    }
    const user = await requireUser(ctx);
    await ctx.db.patch(user._id, { routineWeight });
  },
});
