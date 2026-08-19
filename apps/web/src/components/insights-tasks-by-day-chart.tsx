import { useQuery } from "convex/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { api } from "@cadence/backend/convex/_generated/api";
import {
  bucketCountsByWeek,
  bucketCountsByMonth,
  formatXLabel,
} from "@/lib/chartUtils";
import type { Granularity } from "@/lib/chartUtils";
import type { DateRange } from "@cadence/shared";
import {
  tooltipStyle,
  axisStyle,
  numFmt,
  Loading,
  Empty,
} from "./insights-chart-card";

/**
 * The "Tasks added" strip. It has no card of its own — it is passed as
 * children into `TaskResolutionCard`, which owns the heading and the four
 * headline numbers above it.
 */
export function RandomTasksByDayChart({
  range,
  granularity,
}: {
  range: DateRange;
  granularity: Granularity;
}) {
  const rawRows = useQuery(api.analyticsTasks.randomTasksByDay, {
    from: range.from,
    to: range.to,
  });
  if (!rawRows) return <Loading />;
  if (rawRows.length === 0) return <Empty>No tasks in this window.</Empty>;

  type TaskCountKeys = "completed" | "open";
  const countKeys: TaskCountKeys[] = ["completed", "open"];

  const rows =
    granularity === "weekly"
      ? bucketCountsByWeek(rawRows, countKeys)
      : granularity === "monthly"
        ? bucketCountsByMonth(rawRows, countKeys)
        : rawRows;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={rows} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => formatXLabel(String(d), granularity)}
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(v) => formatXLabel(String(v), granularity)}
          formatter={(v, name) => [
            `${numFmt(v)}`,
            String(name).charAt(0).toUpperCase() + String(name).slice(1),
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />
        <Bar
          dataKey="completed"
          stackId="a"
          fill="var(--chart-2)"
          name="completed"
        />
        <Bar
          dataKey="open"
          stackId="a"
          fill="var(--chart-5)"
          radius={[4, 4, 0, 0]}
          name="open"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
