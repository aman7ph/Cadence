import { addDays, bestStreakOf, productivityScore } from "@cadence/shared";

type Statused = { status?: string };
type DayStat = { date: string; productivityScore: number };

/**
 * Everything the Today screen counts, in one place.
 *
 * Pure on purpose: the screen was computing seven interdependent numbers inline
 * between its queries and its markup, which is the part of that file that was
 * genuinely logic rather than layout.
 *
 * Skipped routines are excused and every task on the plate counts — the same
 * denominators the backend scores with (convex/lib/dayStatsFold.foldDayStats),
 * so the tile agrees with the heatmap and with web.
 */
export function deriveTodayStats(args: {
  routines: Statused[];
  tasks: Statused[];
  allRoutines: Parameters<typeof bestStreakOf>[0];
  range: DayStat[] | undefined;
  viewedDate: string;
  routineWeight: number | undefined;
}) {
  const { routines, tasks, allRoutines, range, viewedDate, routineWeight } =
    args;

  const countedRoutines = routines.filter((r) => r.status !== "skipped");
  const rDone = countedRoutines.filter((r) => r.status === "completed").length;
  const tDone = tasks.filter((t) => t.status === "completed").length;

  const score = productivityScore(
    {
      routineCompleted: rDone,
      routineScheduled: countedRoutines.length,
      randomCompleted: tDone,
      randomTotal: tasks.length,
    },
    routineWeight,
  );

  const rate30 =
    range && range.length > 0
      ? Math.round(
          range.reduce((sum, r) => sum + r.productivityScore, 0) / range.length,
        )
      : undefined;

  const yesterday = range?.find((r) => r.date === addDays(viewedDate, -1));
  const scoreDelta = yesterday
    ? Math.round(score - yesterday.productivityScore)
    : undefined;

  return {
    rDone,
    tDone,
    countedTotal: countedRoutines.length + tasks.length,
    routineScheduled: countedRoutines.length,
    best: bestStreakOf(allRoutines),
    score,
    scoreDelta,
    rate30,
  };
}
