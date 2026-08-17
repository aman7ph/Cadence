import { defineTable } from "convex/server";
import { v } from "convex/values";

// Split out of schema.ts for the same reason ./tasks.ts was: the reminder
// object below pushed the assembled schema over the project's 150-line limit.
// schema.ts still owns defineSchema and remains the one place the schema is
// put together.

// Exported so users.setReminder can validate its argument with the *same*
// definition the table is declared with — one shape, no drift. The settings
// themselves are documented in packages/shared/src/reminder.ts.
export const reminderValidator = v.object({
  enabled: v.boolean(),
  intervalMinutes: v.number(),
  // Minutes from local midnight (0..1439). endMinute may be < startMinute,
  // which means the window crosses midnight.
  startMinute: v.number(),
  endMinute: v.number(),
  alertMode: v.union(
    v.literal("sound"),
    v.literal("vibration"),
    v.literal("both"),
  ),
});

// Exported for the same reason as reminderValidator: users.setListColumns
// validates its argument with the same definition the table declares, so the
// accepted shape and the stored shape cannot drift. Bounds are NOT expressed
// here — Convex validators check types, and the 1..5 range lives in
// packages/shared/src/listColumns.ts so the server and the form share it.
export const listColumnsValidator = v.object({
  today: v.number(),
  routines: v.number(),
  staging: v.number(),
  goals: v.number(),
});

export const users = defineTable({
  tokenIdentifier: v.string(),
  email: v.string(),
  name: v.optional(v.string()),
  timezone: v.optional(v.string()),
  // 0..1 — how much routines outweigh random tasks in productivityScore.
  // Absent → use the default (see packages/shared scoring.ts).
  routineWeight: v.optional(v.number()),
  // The nudge reminder (mobile only). Absent ⇒ never configured; clients fall
  // back to DEFAULT_REMINDER, which is disabled, so absence means no reminder.
  reminder: v.optional(reminderValidator),
  // Columns per list page (web only). Absent ⇒ never configured; clients fall
  // back to DEFAULT_LIST_COLUMNS, which reproduces the pre-feature layout, so
  // absence renders exactly as before.
  listColumns: v.optional(listColumnsValidator),
}).index("by_token", ["tokenIdentifier"]);
