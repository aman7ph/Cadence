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
import { tooltipStyle, axisStyle, numFmt, computeEMA, Loading, Empty } from "./insights-chart-card";

export function MomentumChart({ range, granularity }: { range: DateRange; granularity: Granularity }) {
  const rawRows = useQuery(api.analyticsProductivity.dayStatsRange, { from: range.from, to: range.to });

  if (!rawRows) return <Loading />;
  if (rawRows.length === 0) return <Empty>No data yet — complete some routines or tasks to see momentum.</Empty>;

  const dailyData = rawRows.map((r) => ({ date: r.date, value: r.productivityScore }));
  const bucketedData =
    granularity === "weekly" ? bucketByWeek(dailyData) :
    granularity === "monthly" ? bucketByMonth(dailyData) :
    dailyData;

  const values = bucketedData.map((r) => r.value);
  const emaValues = granularity === "daily" ? computeEMA(values, 7) : null;

  const data = bucketedData.map((r, i) => ({
    date: r.date,
    score: Math.round(r.value),
    ...(emaValues ? { ema: Math.round(emaValues[i] ?? 0) } : {}),
  }));

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
        <YAxis domain={[0, 100]} tick={axisStyle} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(v) => formatXLabel(String(v), granularity)}
          formatter={(v, name) => [`${numFmt(v)}`, name === "ema" ? "7-day EMA" : "Score"]}
        />
        <Line type="monotone" dataKey="score" stroke="var(--chart-1)" strokeOpacity={0.35} strokeWidth={1.5} dot={false} name="score" />
        {emaValues && (
          <Line type="monotone" dataKey="ema" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} name="ema" />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
