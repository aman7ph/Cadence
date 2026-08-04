import type { Doc, Id } from "../_generated/dataModel";

// The shapes days.getDay returns. Extracted from days.ts to keep that file
// within the project's 150-line limit; days.ts re-exports them, so importers
// such as goalLinks.ts are unaffected.
//
// Repeat state is optional on both: absent means an ordinary entity, which is
// why no existing caller had to change. `repeatDoneToday` is scoped to *this*
// view's date — that is what makes a carried-over task or a new day read 0/N.
// `nextRepAllowedAt` is a fixed epoch-ms deadline rather than a remaining
// duration, so the query result stays stable and the client owns the ticking.

export type RepeatState = {
  repeatTarget?: number;
  repeatIntervalMinutes?: number;
  repeatDoneToday?: number;
  nextRepAllowedAt?: number;
};

export type DayRoutine = RepeatState & {
  routineId: Id<"routines">;
  name: string;
  description?: string;
  scheduleType: Doc<"routines">["scheduleType"];
  customDays?: number[];
  status: "completed" | "skipped" | "pending";
  currentStreak: number;
  longestStreak: number;
  goalId?: Id<"goals">;
  goalTitle?: string;
};

export type DayTask = RepeatState & {
  taskId: Id<"dailyTasks">;
  title: string;
  description?: string;
  category?: string;
  status: Doc<"dailyTasks">["status"];
  isCarriedOver: boolean;
  originalDate: string;
  carryoverCount: number;
  completedDate?: string;
  goalTitle?: string;
};
