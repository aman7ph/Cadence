import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { addDays, todayLocal } from "@cadence/shared";
import {
  ChartCard,
  DOW_LABELS,
  Empty,
  Loading,
  Meter,
} from "./insights-chart-card";

const LOOKBACK_DAYS = 90;

/**
 * This week's rhythm — days ranked by average completion.
 *
 * Filed apart from the routine panels on purpose: it reads
 * `analyticsProductivity.dayOfWeekStats`, not routine consistency, and it ranks
 * *days of the week* rather than routines.
 */
export function WeekRhythmPanel() {
  const today = todayLocal();
  const rows = useQuery(api.analyticsProductivity.dayOfWeekStats, {
    from: addDays(today, -LOOKBACK_DAYS),
    to: today,
    today,
  });

  // `rate` is null for a weekday with nothing scheduled — excluded rather than
  // ranked as 0%, which would read as failure instead of absence.
  const sorted = [...(rows ?? [])]
    .filter((r) => r.rate !== null)
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));
  const max = Math.max(...sorted.map((r) => r.rate ?? 0), 1);

  return (
    <ChartCard
      title="This week's rhythm"
      subtitle="Days ranked by average completion"
    >
      {rows === undefined ? (
        <Loading />
      ) : sorted.length === 0 ? (
        <Empty>Not enough tracked days yet.</Empty>
      ) : (
        <div className="flex flex-col gap-1.5">
          {sorted.map((r, i) => (
            <div key={r.weekday} className="flex items-center gap-2.5">
              <span className="w-[10px] shrink-0 font-mono text-[9px] text-[var(--text-tertiary)]">
                {i + 1}
              </span>
              <span className="w-[30px] shrink-0 text-[11.5px] text-foreground">
                {DOW_LABELS[r.weekday]}
              </span>
              <Meter
                percent={((r.rate ?? 0) / max) * 100}
                className="h-[9px] flex-1"
              />
              <span className="w-[34px] shrink-0 text-right font-mono text-[10px] tabular-nums text-[var(--text-tertiary)]">
                {Math.round(r.rate ?? 0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
