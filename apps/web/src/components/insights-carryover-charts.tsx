import { useQuery } from "convex/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "@cadence/backend/convex/_generated/api";
import { bucketByWeek, bucketByMonth, formatXLabel } from "@/lib/chartUtils";
import type { Granularity } from "@/lib/chartUtils";
import type { DateRange } from "@cadence/shared";
import { tooltipStyle, axisStyle, numFmt, Loading, Empty } from "./insights-chart-card";

const BUCKET_LABELS = ["0×", "1×", "2×", "3+"];

export function AvgCarryoverCard({ range }: { range: DateRange }) {
  const result = useQuery(api.analyticsTasks.avgCarryover, { from: range.from, to: range.to });
  if (!result) return <Loading />;

  const total = result.distribution.reduce((s, b) => s + b.count, 0);
  if (total === 0) return <Empty>No completed tasks in this window.</Empty>;

  return (
    <div className="flex flex-col gap-5 mt-1">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[40px] font-bold leading-none tracking-tight text-foreground">
          {result.avg.toFixed(1)}
        </span>
        <span className="text-sm text-muted-foreground">avg carryovers before completion</span>
      </div>

      <div className="flex flex-col gap-2">
        {result.distribution.map((b, i) => {
          const pct = total > 0 ? (b.count / total) * 100 : 0;
          return (
            <div key={i} className="flex items-center gap-3 text-[13px]">
              <span className="w-6 shrink-0 text-right font-mono text-muted-foreground">
                {BUCKET_LABELS[i]}
              </span>
              <div className="flex-1 h-5 rounded-md bg-[var(--surface-hover)] overflow-hidden">
                <div
                  className="h-full rounded-md transition-all"
                  style={{ width: `${pct}%`, background: "var(--chart-2)" }}
                />
              </div>
              <span className="w-14 text-right font-mono text-foreground">
                {b.count}
                <span className="text-muted-foreground/70"> ({Math.round(pct)}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function NeverDoneTrendChart({ range, granularity }: { range: DateRange; granularity: Granularity }) {
  const rawRows = useQuery(api.analyticsTasks.openTasksByOriginDate, { from: range.from, to: range.to });
  if (!rawRows) return <Loading />;
  if (rawRows.length === 0) {
    return <Empty>No tasks still open from this window — all resolved!</Empty>;
  }

  const valueRows = rawRows.map((r) => ({ date: r.date, value: r.count }));
  const bucketed =
    granularity === "weekly" ? bucketByWeek(valueRows) :
    granularity === "monthly" ? bucketByMonth(valueRows) :
    valueRows;

  const data = bucketed.map((r) => ({ date: r.date, count: Math.round(r.value) }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
          formatter={(v) => [`${numFmt(v)}`, "Still open"]}
        />
        <Line type="monotone" dataKey="count" stroke="var(--chart-4)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
