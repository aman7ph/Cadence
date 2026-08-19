import { useQuery } from "convex/react";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import { api } from "@cadence/backend/convex/_generated/api";
import { addDays, todayLocal } from "@cadence/shared";
import { CHART_COLORS, ChartCard, Empty, Loading } from "./insights-chart-card";

const LOOKBACK_DAYS = 365;

/**
 * Goal progress — cumulative contribution per goal against its target.
 *
 * Range-independent by design: this sits under "Recurring patterns", which the
 * prototype states is not tied to the date picker. The window is therefore a
 * fixed lookback, not the page range.
 */
export function GoalProgressPanel() {
  const today = todayLocal();
  const series = useQuery(api.analyticsGoals.progressSeries, {
    from: addDays(today, -LOOKBACK_DAYS),
    to: today,
  });

  return (
    <ChartCard
      title="Goal progress"
      subtitle="Contributions from linked tasks and routines, toward each target"
    >
      {series === undefined ? (
        <Loading />
      ) : series.length === 0 ? (
        <Empty>No active goals yet.</Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {series.map((g) => (
            <div key={g.goalId} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12.5px] font-semibold text-foreground">
                  {g.title}
                </span>
                <span className="font-mono text-[11px] tabular-nums text-[var(--text-tertiary)]">
                  {g.points.at(-1)?.value ?? 0}
                  {g.targetValue ? ` / ${g.targetValue}` : ""}
                  {g.unit ? ` ${g.unit}` : ""}
                </span>
              </div>
              <div className="h-[54px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={g.points}
                    margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
                  >
                    <YAxis hide domain={[0, g.targetValue ?? "dataMax"]} />
                    {g.targetValue ? (
                      <ReferenceLine
                        y={g.targetValue}
                        stroke="var(--border-strong)"
                        strokeDasharray="3 3"
                      />
                    ) : null}
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="var(--action-primary)"
                      strokeWidth={1.75}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

/** Goal contribution mix — which habits are actually driving each goal. */
export function GoalMixPanel() {
  const mix = useQuery(api.analyticsGoals.contributionMix, {});

  return (
    <ChartCard
      title="Goal contribution mix"
      subtitle="Which habits are actually driving each goal"
    >
      {mix === undefined ? (
        <Loading />
      ) : mix.length === 0 ? (
        <Empty>Link a task or routine to a goal to see the mix.</Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {mix.map((g) => (
            <div key={g.goalId} className="flex flex-col gap-2">
              <span className="text-[12.5px] font-semibold text-foreground">
                {g.title}
              </span>
              <div className="flex h-2.5 w-full overflow-hidden rounded-pill">
                {g.segments.map((s, i) => (
                  <span
                    key={s.label}
                    style={{
                      width: `${s.pct}%`,
                      background: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                    title={`${s.label} · ${s.pct}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {g.segments.map((s, i) => (
                  <span
                    key={s.label}
                    className="flex items-center gap-1.5 text-[10.5px] text-[var(--text-tertiary)]"
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{
                        background: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                    {s.label} · {s.pct}%
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
