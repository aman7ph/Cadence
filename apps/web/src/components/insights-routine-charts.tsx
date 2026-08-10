import { useQuery } from "convex/react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "@cadence/backend/convex/_generated/api";
import { MIN_ACTIVE_BAND, NO_ACTIVITY_BAND, scoreToHeatBand } from "@cadence/shared";
import type { DateRange } from "@cadence/shared";
import { tooltipStyle, axisStyle, numFmt, DOW_LABELS, CHART_COLORS, Loading, Empty } from "./insights-chart-card";

export function DowHeatmap({ range, today }: { range: DateRange; today: string }) {
  const stats = useQuery(api.analyticsProductivity.dayOfWeekStats, { from: range.from, to: range.to, today });
  if (!stats) return <Loading />;

  return (
    <div className="flex gap-2 mt-1">
      {stats.map((s) => {
        const rate = s.rate ?? 0;
        // Same band scale as both productivity heatmaps, floored so a 0%
        // weekday stays distinct from a weekday with nothing scheduled.
        const heatLevel =
          s.scheduled === 0
            ? NO_ACTIVITY_BAND
            : Math.max(MIN_ACTIVE_BAND, scoreToHeatBand(rate));
        return (
          <div key={s.weekday} className="flex flex-col items-center gap-1.5 flex-1">
            <div
              className="w-full rounded-md aspect-square"
              style={{ background: `var(--heat-${heatLevel})` }}
              title={s.scheduled === 0 ? "Not scheduled" : `${rate}% (${s.completed}/${s.scheduled})`}
            />
            <span className="text-[10px] text-muted-foreground font-mono">{DOW_LABELS[s.weekday]}</span>
            <span className="text-[10px] font-semibold text-foreground">
              {s.rate !== null ? `${s.rate}%` : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function RoutineComparisonChart({ range, today }: { range: DateRange; today: string }) {
  const rows = useQuery(api.analyticsRoutines.routineConsistency, { from: range.from, to: range.to, today });
  if (!rows) return <Loading />;
  if (rows.length === 0) return <Empty>No active routines.</Empty>;

  const data = rows
    .filter((r) => r.rate !== null)
    .map((r, i) => ({ name: r.name, rate: r.rate ?? 0, fill: CHART_COLORS[i % CHART_COLORS.length] }));

  if (data.length === 0) return <Empty>No scheduled days in this window.</Empty>;

  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 44)}>
      <BarChart layout="vertical" data={data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
        <YAxis
          type="category"
          dataKey="name"
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          width={90}
          tickFormatter={(v: string) => (v.length > 12 ? v.slice(0, 12) + "…" : v)}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v) => [`${numFmt(v)}%`, "Completion rate"]}
        />
        <Bar dataKey="rate" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
