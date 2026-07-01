import { useQuery } from "convex/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { api } from "@cadence/backend/convex/_generated/api";
import { startOfWeek } from "@cadence/shared";
import type { DateRange } from "@cadence/shared";
import { formatXLabel } from "@/lib/chartUtils";
import type { Granularity } from "@/lib/chartUtils";
import { tooltipStyle, axisStyle, numFmt, CHART_COLORS, Loading, Empty } from "./insights-chart-card";

type RoutineDay = { date: string; status: string };
type RoutineRow = { name: string; routineId: string; days: RoutineDay[] };

function buildRoutineChartData(
  rows: RoutineRow[],
  granularity: Granularity,
): Record<string, string | number>[] {
  if (granularity === "daily") {
    const allDates = new Set<string>();
    rows.forEach((r) => r.days.forEach((d) => allDates.add(d.date)));
    const sortedDates = Array.from(allDates).sort();
    const byRoutine = rows.map((r) => ({
      name: r.name,
      byDate: new Map(r.days.map((d) => [d.date, d.status])),
    }));
    return sortedDates.map((date) => {
      const point: Record<string, string | number> = { date };
      for (const r of byRoutine) {
        const last7 = sortedDates
          .filter((d) => d <= date)
          .slice(-7)
          .map((d) => r.byDate.get(d))
          .filter((s) => s === "completed" || s === "missed");
        const completed = last7.filter((s) => s === "completed").length;
        point[r.name] = last7.length > 0 ? Math.round((completed / last7.length) * 100) : 0;
      }
      return point;
    });
  }

  const keyFn =
    granularity === "weekly"
      ? (d: string) => startOfWeek(d)
      : (d: string) => d.slice(0, 7) + "-01";

  const allKeys = new Set<string>();
  const routineBuckets = rows.map((r) => {
    const buckets = new Map<string, { completed: number; total: number }>();
    for (const d of r.days) {
      if (d.status !== "completed" && d.status !== "missed") continue;
      const key = keyFn(d.date);
      allKeys.add(key);
      const b = buckets.get(key) ?? { completed: 0, total: 0 };
      b.total += 1;
      if (d.status === "completed") b.completed += 1;
      buckets.set(key, b);
    }
    return { name: r.name, buckets };
  });

  return Array.from(allKeys)
    .sort()
    .map((key) => {
      const point: Record<string, string | number> = { date: key };
      for (const r of routineBuckets) {
        const b = r.buckets.get(key);
        point[r.name] = b && b.total > 0 ? Math.round((b.completed / b.total) * 100) : 0;
      }
      return point;
    });
}

export function RoutineCompletionLines({
  range,
  granularity,
  today,
}: {
  range: DateRange;
  granularity: Granularity;
  today: string;
}) {
  const rows = useQuery(api.analyticsRoutines.routineTimeline, {
    from: range.from,
    to: range.to,
    today,
  });
  if (!rows) return <Loading />;
  if (rows.length === 0) return <Empty>No active routines.</Empty>;

  const chartData = buildRoutineChartData(rows as RoutineRow[], granularity);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => formatXLabel(String(d), granularity)}
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis domain={[0, 100]} tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(v) => formatXLabel(String(v), granularity)}
          formatter={(v, name) => [`${numFmt(v)}%`, String(name)]}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
        {rows.map((r, i) => (
          <Line
            key={r.routineId}
            type="monotone"
            dataKey={r.name}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

