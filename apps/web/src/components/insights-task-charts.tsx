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
import { bucketCountsByWeek, bucketCountsByMonth, formatXLabel } from "@/lib/chartUtils";
import type { Granularity } from "@/lib/chartUtils";
import type { DateRange } from "@cadence/shared";
import { tooltipStyle, axisStyle, numFmt, Loading, Empty } from "./insights-chart-card";

export function RandomTasksByDayChart({ range, granularity }: { range: DateRange; granularity: Granularity }) {
  const rawRows = useQuery(api.analyticsTasks.randomTasksByDay, { from: range.from, to: range.to });
  if (!rawRows) return <Loading />;
  if (rawRows.length === 0) return <Empty>No tasks in this window.</Empty>;

  type TaskCountKeys = "completed" | "dismissed" | "open";
  const countKeys: TaskCountKeys[] = ["completed", "dismissed", "open"];

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
        <YAxis allowDecimals={false} tick={axisStyle} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(v) => formatXLabel(String(v), granularity)}
          formatter={(v, name) => [
            `${numFmt(v)}`,
            String(name).charAt(0).toUpperCase() + String(name).slice(1),
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
        <Bar dataKey="completed" stackId="a" fill="var(--chart-2)" name="completed" />
        <Bar dataKey="dismissed" stackId="a" fill="var(--chart-3)" name="dismissed" />
        <Bar dataKey="open" stackId="a" fill="var(--chart-5)" radius={[4, 4, 0, 0]} name="open" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RandomBreakdownChart({ range }: { range: DateRange }) {
  const stats = useQuery(api.analyticsTasks.randomStats, { from: range.from, to: range.to });
  if (!stats) return <Loading />;
  if (stats.total === 0) return <Empty>No resolved tasks in this window.</Empty>;

  const total = stats.onTime + stats.afterCarryover + stats.never;
  const segments = [
    { label: "On time", value: stats.onTime, color: "var(--chart-2)" },
    { label: "After carryover", value: stats.afterCarryover, color: "var(--chart-3)" },
    { label: "Dismissed", value: stats.never, color: "var(--chart-4)" },
  ].filter((s) => s.value > 0);

  return (
    <div className="flex flex-col gap-4 mt-1">
      <div className="flex h-7 w-full overflow-hidden rounded-md gap-0.5">
        {segments.map((s) => (
          <div
            key={s.label}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center justify-between text-[13px]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-muted-foreground">{s.label}</span>
            </div>
            <span className="font-mono text-foreground">
              {s.value}{" "}
              <span className="text-muted-foreground/70">({Math.round((s.value / total) * 100)}%)</span>
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between text-[13px] border-t border-border pt-2 mt-0.5">
          <span className="text-muted-foreground font-medium">Total resolved</span>
          <span className="font-mono font-semibold text-foreground">{total}</span>
        </div>
      </div>
    </div>
  );
}
