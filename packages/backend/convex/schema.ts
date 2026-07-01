import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    timezone: v.optional(v.string()),
    // 0..1 — how much routines outweigh random tasks in productivityScore.
    // Absent → use the default (see packages/shared scoring.ts).
    routineWeight: v.optional(v.number()),
  }).index("by_token", ["tokenIdentifier"]),

  routines: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    scheduleType: v.union(
      v.literal("daily"),
      v.literal("weekdays"),
      v.literal("custom"),
    ),
    customDays: v.optional(v.array(v.number())),
    isActive: v.boolean(),
    createdDate: v.string(),
    archivedDate: v.optional(v.string()),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastCompletedDate: v.optional(v.string()),
    goalId: v.optional(v.id("goals")),
    goalContribution: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_goal", ["goalId"]),

  routineCompletions: defineTable({
    userId: v.id("users"),
    routineId: v.id("routines"),
    date: v.string(),
    status: v.union(v.literal("completed"), v.literal("skipped")),
    completedAt: v.number(),
  })
    .index("by_routine_date", ["routineId", "date"])
    .index("by_user_date", ["userId", "date"])
    .index("by_user_routine_date", ["userId", "routineId", "date"]),

  dailyTasks: defineTable({
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
  })
    .index("by_user_current", ["userId", "currentDate", "status"])
    .index("by_user_original", ["userId", "originalDate"])
    .index("by_user_status", ["userId", "status"])
    .index("by_goal", ["goalId"]),

  dayStats: defineTable({
    userId: v.id("users"),
    date: v.string(),
    routineScheduled: v.number(),
    routineCompleted: v.number(),
    // Total random tasks credited to this day: completed + open + dismissed.
    // Open tasks count — see packages/shared/src/scoring.ts for rationale.
    randomTotal: v.number(),
    randomCompleted: v.number(),
    productivityScore: v.number(),
  }).index("by_user_date", ["userId", "date"]),

  dailyReflections: defineTable({
    userId: v.id("users"),
    date: v.string(),   // YYYY-MM-DD — same local-date convention as the rest of the schema
    text: v.string(),   // raw markdown; @[Name](id) mentions are inline
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_date", ["userId", "date"]),

  reflectionTags: defineTable({
    userId: v.id("users"),
    reflectionId: v.id("dailyReflections"),
    taskId: v.optional(v.id("dailyTasks")),     // exactly one of these two is set per row
    routineId: v.optional(v.id("routines")),
  })
    .index("by_reflection", ["reflectionId"])
    .index("by_task", ["taskId"])
    .index("by_routine", ["routineId"]),

  goals: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("abandoned"),
    ),
    targetValue: v.optional(v.number()),
    currentValue: v.optional(v.number()),
    unit: v.optional(v.string()),
    dueDate: v.optional(v.string()),    // YYYY-MM-DD
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

});
