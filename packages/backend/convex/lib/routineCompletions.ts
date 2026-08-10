import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// One indexed read of the completion log for a date range, folded into
// status-by-date, per routine.
//
// Extracted because four callers were each rebuilding this map by hand and had
// already drifted into two different shapes — a pair of Sets in
// routineConsistency, a flat `${routineId}:${date}` string key in
// routineTimeline and dayOfWeekStats. Both answer the same question, and a
// single loader is what lets the streak derivation, the consistency score and
// the timeline chart agree about what the log says.
//
// The read is one range scan: by_user_date is ["userId", "date"], so `from`
// and `to` are served by the index rather than filtered in memory.

export type CompletionStatus = "completed" | "skipped";

export type CompletionsByRoutine = Map<
  Id<"routines">,
  Map<string, CompletionStatus>
>;

export async function loadCompletionsByRoutine(
  ctx: QueryCtx,
  userId: Id<"users">,
  from: string,
  to: string,
): Promise<CompletionsByRoutine> {
  const rows = await ctx.db
    .query("routineCompletions")
    .withIndex("by_user_date", (q) =>
      q.eq("userId", userId).gte("date", from).lte("date", to),
    )
    .collect();

  const byRoutine: CompletionsByRoutine = new Map();
  for (const row of rows) {
    let entry = byRoutine.get(row.routineId);
    if (!entry) {
      entry = new Map();
      byRoutine.set(row.routineId, entry);
    }
    entry.set(row.date, row.status);
  }
  return byRoutine;
}
