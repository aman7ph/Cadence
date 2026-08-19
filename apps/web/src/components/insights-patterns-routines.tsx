import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { addDays, todayLocal } from "@cadence/shared";
import { ChartCard, Empty, Loading, Meter } from "./insights-chart-card";

const LOOKBACK_DAYS = 90;

// Both panels here rank the same rows, so they share one query rather than
// issuing it twice — Convex dedupes identical subscriptions, but writing it
// once also means the lookback cannot drift between the two cards.
function useConsistency() {
  const today = todayLocal();
  return useQuery(api.analyticsRoutines.routineConsistency, {
    from: addDays(today, -LOOKBACK_DAYS),
    to: today,
    today,
  });
}

/** Streak longevity — current streak against the longest run, per routine. */
export function StreakLongevityPanel() {
  const rows = useConsistency();
  const sorted = [...(rows ?? [])].sort(
    (a, b) => b.longestStreak - a.longestStreak,
  );
  const max = Math.max(...sorted.map((r) => r.longestStreak), 1);

  return (
    <ChartCard
      title="Streak longevity"
      subtitle="Current streak vs. your longest run, per routine"
    >
      {rows === undefined ? (
        <Loading />
      ) : sorted.length === 0 ? (
        <Empty>Add a routine to start building streaks.</Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((r) => (
            <div key={r.routineId} className="flex items-center gap-3">
              <span className="w-[38%] truncate text-[11.5px] text-[var(--text-secondary)]">
                {r.name}
              </span>
              {/* Not a Meter: this one overlays two bars from the same origin
                  rather than filling a track, so the dashed outline stays
                  visible past the end of the solid run. */}
              <span className="relative h-[9px] flex-1">
                <span
                  className="absolute inset-y-0 left-0 rounded-pill border border-dashed border-[var(--border-strong)]"
                  style={{ width: `${(r.longestStreak / max) * 100}%` }}
                />
                <span
                  className="absolute inset-y-0 left-0 rounded-pill bg-[var(--action-primary)]"
                  style={{ width: `${(r.currentStreak / max) * 100}%` }}
                />
              </span>
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--text-tertiary)]">
                {r.currentStreak}d / best {r.longestStreak}d
              </span>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

/** Routine leaderboard — strongest habits, and the ones slipping. */
export function RoutineLeaderboardPanel() {
  const rows = useConsistency();
  const sorted = [...(rows ?? [])].sort(
    (a, b) => b.consistency - a.consistency,
  );

  return (
    <ChartCard
      title="Routine leaderboard"
      subtitle="Strongest habits, and the ones slipping"
    >
      {rows === undefined ? (
        <Loading />
      ) : sorted.length === 0 ? (
        <Empty>Add a routine to see the leaderboard.</Empty>
      ) : (
        <div className="flex flex-col gap-1.5">
          {sorted.map((r, i) => (
            <div key={r.routineId} className="flex items-center gap-2.5">
              <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--surface-active)] font-mono text-[9px] tabular-nums text-[var(--text-tertiary)]">
                {i + 1}
              </span>
              <span className="flex-1 truncate text-[11.5px] text-foreground">
                {r.name}
              </span>
              <Meter percent={r.consistency} className="h-[5px] w-[70px]" />
              <span className="w-[34px] shrink-0 text-right font-mono text-[10px] tabular-nums text-[var(--text-tertiary)]">
                {r.consistency}%
              </span>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
