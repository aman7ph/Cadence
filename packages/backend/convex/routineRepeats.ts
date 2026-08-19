import {
  formatCountdown,
  isRepAllowed,
  nextAllowedAt,
  remainingMs,
} from "@cadence/shared";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireOwnedRoutine } from "./lib/ownership";
import { clearStatus, setStatus } from "./lib/routineSetStatus";

// Reps for a repeat routine — the routine counterpart of dailyTaskRepeats.
//
// Completion is delegated to setStatus rather than reimplemented: it already
// writes the single routineCompletions row, applies goal credit, recomputes
// the streak, and refreshes dayStats. That delegation is the whole reason
// repeat routines need no changes to streaks, scoring, history, or insights.

export const logRep = mutation({
  args: {
    routineId: v.id("routines"),
    date: v.string(),
    today: v.string(),
  },
  handler: async (ctx, { routineId, date, today }) => {
    const routine = await requireOwnedRoutine(ctx, routineId);
    if (!routine.repeatTarget) throw new Error("This routine does not repeat");

    const completion = await ctx.db
      .query("routineCompletions")
      .withIndex("by_routine_date", (q) =>
        q.eq("routineId", routineId).eq("date", date),
      )
      .unique();
    if (completion?.status === "completed") {
      throw new Error("Already complete for this day");
    }

    const now = Date.now();
    if (!isRepAllowed(routine.lastRepAt, routine.repeatIntervalMinutes, now)) {
      const wait = remainingMs(
        nextAllowedAt(routine.lastRepAt, routine.repeatIntervalMinutes),
        now,
      );
      throw new Error(
        `Too soon — wait ${formatCountdown(wait)} before the next one`,
      );
    }

    const repsOnDate = await ctx.db
      .query("routineReps")
      .withIndex("by_routine_date", (q) =>
        q.eq("routineId", routineId).eq("date", date),
      )
      .collect();
    const doneToday = repsOnDate.length + 1;
    const reachedTarget = doneToday >= routine.repeatTarget;

    await ctx.db.insert("routineReps", {
      // routine.userId, not a separately-fetched user: requireOwnedRoutine has
      // already proved the two are equal, and reading it off the routine keeps
      // the rep scoped to whoever owns the routine it belongs to.
      userId: routine.userId,
      routineId,
      date,
      completedAt: now,
    });
    await ctx.db.patch(routineId, { lastRepAt: now });
    if (reachedTarget) {
      await setStatus(ctx, { routineId, date, today, status: "completed" });
    }

    return {
      doneToday,
      target: routine.repeatTarget,
      completed: reachedTarget,
    };
  },
});

// Reverses the newest rep on `date`. Not gated — an undo is a correction.
export const undoRep = mutation({
  args: {
    routineId: v.id("routines"),
    date: v.string(),
    today: v.string(),
  },
  handler: async (ctx, { routineId, date, today }) => {
    const routine = await requireOwnedRoutine(ctx, routineId);
    if (!routine.repeatTarget) throw new Error("This routine does not repeat");

    const newest = await ctx.db
      .query("routineReps")
      .withIndex("by_routine_date", (q) =>
        q.eq("routineId", routineId).eq("date", date),
      )
      .order("desc")
      .first();
    if (!newest) return { doneToday: 0, target: routine.repeatTarget };

    await ctx.db.delete(newest._id);
    // Restore the gate to where it stood before the undone rep — the reason
    // reps are a log and not a counter.
    const previous = await ctx.db
      .query("routineReps")
      .withIndex("by_routine", (q) => q.eq("routineId", routineId))
      .order("desc")
      .first();
    await ctx.db.patch(routineId, { lastRepAt: previous?.completedAt });

    // Dropping below the target un-completes the day, streak and all — but
    // only a *completion* is reversed here. A skipped day stays skipped;
    // undoing a rep says nothing about the user's intent to skip.
    const completion = await ctx.db
      .query("routineCompletions")
      .withIndex("by_routine_date", (q) =>
        q.eq("routineId", routineId).eq("date", date),
      )
      .unique();
    if (completion?.status === "completed") {
      await clearStatus(ctx, { routineId, date, today });
    }

    const repsOnDate = await ctx.db
      .query("routineReps")
      .withIndex("by_routine_date", (q) =>
        q.eq("routineId", routineId).eq("date", date),
      )
      .collect();
    return { doneToday: repsOnDate.length, target: routine.repeatTarget };
  },
});
