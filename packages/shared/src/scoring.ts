// Score formulas — adapted from docs/implementation-plan.md §3.3 with two
// deliberate deviations:
//
//   1. Open tasks DO count against the score (the plan originally excluded
//      them). Seeing 100% productivity while a carried-over task sits open
//      did not match the intuitive read of "productive."
//   2. The routines-vs-tasks weight is per-user (was hard-coded 60/40).
//      Stored on users.routineWeight (0..1). Absent → DEFAULT_ROUTINE_WEIGHT.
//
// A day with nothing on its plate scores a neutral 100 — a deliberately
// empty day is not a failure.

export const DEFAULT_ROUTINE_WEIGHT = 0.6;

export function completionRate(args: {
  completed: number;
  scheduled: number;
}): number {
  if (args.scheduled <= 0) return 1;
  return args.completed / args.scheduled;
}

export type DayScoreInputs = {
  routineCompleted: number;
  routineScheduled: number;
  randomCompleted: number;
  // Total random tasks on the day's plate: completed + open + dismissed.
  // Open tasks count against the score — completing or dismissing them
  // resolves their status but the task's existence on the day is what
  // anchors the denominator.
  randomTotal: number;
};

export function productivityScore(
  inputs: DayScoreInputs,
  routineWeight: number = DEFAULT_ROUTINE_WEIGHT,
): number {
  const w = clamp01(routineWeight);
  const routineRate = completionRate({
    completed: inputs.routineCompleted,
    scheduled: inputs.routineScheduled,
  });
  const randomRate = completionRate({
    completed: inputs.randomCompleted,
    scheduled: inputs.randomTotal,
  });
  return Math.round(100 * (w * routineRate + (1 - w) * randomRate));
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_ROUTINE_WEIGHT;
  return Math.max(0, Math.min(1, n));
}

// Recency-weighted completion rate over a list of scheduled days.
// Weight day i days ago by exp(-i / tau). Default tau = 14 days.
// Returns 0..100. Entries with hit=false but on a skipped day should be
// excluded by the caller (skips are neutral per plan §3.3).
export function consistencyScore(
  entries: ReadonlyArray<{ daysAgo: number; hit: boolean }>,
  tau = 14,
): number {
  if (entries.length === 0) return 0;
  let weightedHits = 0;
  let weightSum = 0;
  for (const e of entries) {
    const w = Math.exp(-e.daysAgo / tau);
    weightSum += w;
    if (e.hit) weightedHits += w;
  }
  if (weightSum === 0) return 0;
  return Math.round(100 * (weightedHits / weightSum));
}
