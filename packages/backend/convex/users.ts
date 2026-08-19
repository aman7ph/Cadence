import { v } from "convex/values";
import { validateListColumns, validateReminder } from "@cadence/shared";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { listColumnsValidator, reminderValidator } from "./tables/users";

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
    if (
      !Number.isFinite(routineWeight) ||
      routineWeight < 0 ||
      routineWeight > 1
    ) {
      throw new Error("routineWeight must be a finite number in [0, 1]");
    }
    const user = await requireUser(ctx);
    await ctx.db.patch(user._id, { routineWeight });
  },
});

// The nudge reminder's settings (mobile only — see
// .agent/nudge-reminder-implementation-plan.md). Validation is the shared
// helper rather than a local copy, so the server rejects exactly what the
// settings form rejects. `enabled` is part of the object rather than its own
// mutation: the form saves the whole thing at once, and validating the values
// even while disabled stops bad settings being stored to fail later.
export const setReminder = mutation({
  args: { reminder: reminderValidator },
  handler: async (ctx, { reminder }) => {
    validateReminder(reminder);
    const user = await requireUser(ctx);
    await ctx.db.patch(user._id, { reminder });
  },
});

// Columns per list page (web only — see D16 of
// .agent/ui-redesign-implementation-plan.md). Validation is the shared helper
// rather than a local copy, so the server rejects exactly what the settings
// form rejects. The whole object is saved at once, like setReminder, because
// the form persists on change and a per-page mutation would multiply round
// trips for no benefit.
export const setListColumns = mutation({
  args: { listColumns: listColumnsValidator },
  handler: async (ctx, { listColumns }) => {
    validateListColumns(listColumns);
    const user = await requireUser(ctx);
    await ctx.db.patch(user._id, { listColumns });
  },
});
