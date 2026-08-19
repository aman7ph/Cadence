import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { addDays, daysBetween, todayLocal } from "@cadence/shared";
import type { DateRange, Granularity } from "@cadence/shared";
import { DOW_LABELS } from "./insights-chart-card";
import { MomentumChart } from "./insights-momentum-chart";

function mean(ns: number[]): number | null {
  return ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : null;
}

/**
 * Momentum hero — the score, its movement against the preceding window, and
 * the best / worst weekday, wrapped around the existing chart.
 *
 * The delta compares this range to the window of the same length immediately
 * before it, which is what "vs. the N days before that" in the design means.
 */
export function MomentumHero({
  range,
  granularity,
}: {
  range: DateRange;
  granularity: Granularity;
}) {
  const today = todayLocal();
  const span = Math.max(1, daysBetween(range.from, range.to));

  const rows = useQuery(api.analyticsProductivity.dayStatsRange, {
    from: range.from,
    to: range.to,
  });
  const prevRows = useQuery(api.analyticsProductivity.dayStatsRange, {
    from: addDays(range.from, -span),
    to: addDays(range.from, -1),
  });
  const dow = useQuery(api.analyticsProductivity.dayOfWeekStats, {
    from: range.from,
    to: range.to,
    today,
  });

  const score = mean((rows ?? []).map((r) => r.productivityScore));
  const prev = mean((prevRows ?? []).map((r) => r.productivityScore));
  const delta =
    score !== null && prev !== null ? Math.round(score - prev) : null;

  const ranked = [...(dow ?? [])]
    .filter((d) => d.rate !== null)
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));
  const best = ranked[0];
  const worst = ranked.length > 1 ? ranked[ranked.length - 1] : undefined;

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-[var(--border-subtle)] bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="font-display text-[10px] uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
            Momentum score
          </span>
          <div className="mt-1 flex items-baseline gap-2.5">
            <span className="font-display text-[34px] font-semibold leading-none text-foreground">
              {score === null ? "—" : Math.round(score)}
            </span>
            {delta !== null && delta !== 0 && (
              <span
                className={`text-[12px] font-semibold ${
                  delta > 0
                    ? "text-[var(--status-complete)]"
                    : "text-[var(--status-danger)]"
                }`}
              >
                {delta > 0 ? "+" : ""}
                {delta} pts
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">
            vs. the {span} days before that
            {granularity === "daily" ? " — 7-day rolling average" : ""}
          </p>
        </div>

        <div className="flex flex-col items-end gap-0.5 text-[11px]">
          {best && (
            <span className="text-[var(--text-tertiary)]">
              Best day:{" "}
              <span className="font-semibold text-foreground">
                {DOW_LABELS[best.weekday]}
              </span>{" "}
              ({Math.round(best.rate ?? 0)}%)
            </span>
          )}
          {worst && (
            <span className="text-[var(--text-tertiary)]">
              Needs attention:{" "}
              <span className="font-semibold text-foreground">
                {DOW_LABELS[worst.weekday]}
              </span>{" "}
              ({Math.round(worst.rate ?? 0)}%)
            </span>
          )}
        </div>
      </div>

      <MomentumChart range={range} granularity={granularity} />
    </section>
  );
}
