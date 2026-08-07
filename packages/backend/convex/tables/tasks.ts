import { defineTable } from "convex/server";
import { v } from "convex/values";

// Task table definitions, lifted out of schema.ts to keep that file within the
// project's 150-line limit. They are plain TableDefinition values — schema.ts
// still owns defineSchema and remains the single place the schema is assembled.

export const dailyTasks = defineTable({
  userId: v.id("users"),
  title: v.string(),
  description: v.optional(v.string()),
  category: v.optional(v.string()),
  originalDate: v.string(),
  currentDate: v.string(),
  status: v.union(
    v.literal("open"),
    v.literal("completed"),
    v.literal("dismissed"),
  ),
  carryoverCount: v.number(),
  completedAt: v.optional(v.number()),
  completedDate: v.optional(v.string()),
  createdAt: v.number(),
  goalId: v.optional(v.id("goals")),
  goalContribution: v.optional(v.number()),
  // Repeatable tasks — all absent ⇒ an ordinary single-completion task, which
  // is why no existing row needs migrating. See packages/shared/src/repeat.ts.
  repeatTarget: v.optional(v.number()),          // reps needed in a day (2..100)
  repeatIntervalMinutes: v.optional(v.number()), // min gap between reps; 0 ⇒ none
  lastRepAt: v.optional(v.number()),             // epoch ms of the newest rep, any day
})
  .index("by_user_current", ["userId", "currentDate", "status"])
  .index("by_user_original", ["userId", "originalDate"])
  .index("by_user_status", ["userId", "status"])
  .index("by_goal", ["goalId"]);

// One row per completion ("rep") of a repeat task — the same shape as
// routineCompletions. Two different clocks meet here on purpose:
//   date        — client-local YYYY-MM-DD the rep is credited to. Counting by
//                 date is what makes a partially-done task restart at 0/N the
//                 next day, with no reset logic anywhere.
//   completedAt — server epoch ms. The interval gate compares against this and
//                 nothing else, so it measures real elapsed time and ignores
//                 day boundaries (a 23:50 rep still blocks at 00:05).
export const taskCompletions = defineTable({
  userId: v.id("users"),
  taskId: v.id("dailyTasks"),
  date: v.string(),
  completedAt: v.number(),
})
  .index("by_task_date", ["taskId", "date"])
  .index("by_task", ["taskId"])
  .index("by_user_date", ["userId", "date"]);

// One row per (task, day the task sat on the user's plate). A dailyTasks row is
// mutable — rolloverOpenTasks moves currentDate forward — so the row alone can
// never answer "which days was this on?", and a day view keyed on currentDate
// loses every task that has since rolled over. This log is that answer, in the
// same shape and with the same index set as taskCompletions above.
//
// Deliberately status-free. The status a task had on a given day is derived
// (completedDate === date ⇒ completed; dismissed && currentDate === date ⇒
// dismissed; otherwise open), because a stored second copy would drift the
// first time uncomplete runs.
export const taskDays = defineTable({
  userId: v.id("users"),
  taskId: v.id("dailyTasks"),
  date: v.string(), // client-local YYYY-MM-DD, same convention as the rest of the schema
})
  .index("by_task_date", ["taskId", "date"])
  .index("by_task", ["taskId"])
  .index("by_user_date", ["userId", "date"]);
