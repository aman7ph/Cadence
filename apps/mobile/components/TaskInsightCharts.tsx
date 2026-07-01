import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { DateRange } from "@cadence/shared";
import { Text, View } from "react-native";
import { useColors } from "../lib/theme";
import type { Granularity, TK } from "../lib/insightUtils";
import { CC, TASK_KEYS, TASK_COLORS, bucketCountsByWeek, bucketCountsByMonth, bucketByWeek, bucketByMonth } from "../lib/insightUtils";
import { SimpleLineChart } from "./SimpleLineChart";
import { Loading, Empty, XLabels } from "./InsightShared";

const CARRY_LABELS = ["0×", "1×", "2×", "3+"];

export function TasksByDayChart({ range, granularity }: { range: DateRange; granularity: Granularity }) {
  const c = useColors();
  const rawRows = useQuery(api.analyticsTasks.randomTasksByDay, { from: range.from, to: range.to });

  if (!rawRows) return <Loading />;
  if (rawRows.length === 0) return <Empty msg="No tasks in this window." />;

  type TKRow = { date: string; completed: number; dismissed: number; open: number };
  const rows = granularity === "weekly"
    ? bucketCountsByWeek(rawRows as unknown as TKRow[], TASK_KEYS)
    : granularity === "monthly"
    ? bucketCountsByMonth(rawRows as unknown as TKRow[], TASK_KEYS)
    : rawRows as TKRow[];
  const maxTotal = Math.max(...rows.map((r) => (r.completed ?? 0) + (r.dismissed ?? 0) + (r.open ?? 0)), 1);

  return (
    <View>
      <View style={{ height: 130, flexDirection: "row", alignItems: "flex-end", gap: 2 }}>
        {rows.map((r, i) => {
          const total = (r.completed ?? 0) + (r.dismissed ?? 0) + (r.open ?? 0);
          const hPct = total > 0 ? (total / maxTotal) * 100 : 0;
          return (
            <View key={i} style={{ flex: 1, height: `${hPct}%` as `${number}%`, flexDirection: "column-reverse", borderRadius: 2, overflow: "hidden" }}>
              {(r.completed ?? 0) > 0 && <View style={{ flex: r.completed, backgroundColor: TASK_COLORS.completed }} />}
              {(r.dismissed ?? 0) > 0 && <View style={{ flex: r.dismissed, backgroundColor: TASK_COLORS.dismissed }} />}
              {(r.open ?? 0) > 0 && <View style={{ flex: r.open, backgroundColor: TASK_COLORS.open }} />}
            </View>
          );
        })}
      </View>
      <XLabels dates={rows.map((r) => r.date)} granularity={granularity} />
      <View style={{ flexDirection: "row", gap: 14, marginTop: 8 }}>
        {TASK_KEYS.map((k) => (
          <View key={k} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: TASK_COLORS[k] }} />
            <Text style={{ fontSize: 11, color: c.t3 }}>{k.charAt(0).toUpperCase() + k.slice(1)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function TaskBreakdownChart({ range }: { range: DateRange }) {
  const c = useColors();
  const stats = useQuery(api.analyticsTasks.randomStats, { from: range.from, to: range.to });

  if (!stats) return <Loading />;
  if (stats.total === 0) return <Empty msg="No resolved tasks in this window." />;

  const total = stats.onTime + stats.afterCarryover + stats.never;
  const segs = [
    { label: "On time",         value: stats.onTime,         color: c.chart2 },
    { label: "After carryover", value: stats.afterCarryover, color: c.chart3 },
    { label: "Dismissed",       value: stats.never,          color: c.chart4 },
  ].filter((s) => s.value > 0);

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", height: 22, borderRadius: 8, overflow: "hidden", gap: 2 }}>
        {segs.map((s) => <View key={s.label} style={{ flex: s.value, backgroundColor: s.color }} />)}
      </View>
      <View style={{ gap: 8 }}>
        {segs.map((s) => (
          <View key={s.label} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
              <Text style={{ fontSize: 13, color: c.t2 }}>{s.label}</Text>
            </View>
            <Text style={{ fontSize: 13, color: c.t1 }}>
              {s.value}<Text style={{ color: c.t3 }}> ({Math.round((s.value / total) * 100)}%)</Text>
            </Text>
          </View>
        ))}
        <View style={{ height: 1, backgroundColor: c.bd1, marginTop: 2 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 13, color: c.t2, fontWeight: "500" }}>Total resolved</Text>
          <Text style={{ fontSize: 13, fontWeight: "600", color: c.t1 }}>{total}</Text>
        </View>
      </View>
    </View>
  );
}

export function CarryoverCard({ range }: { range: DateRange }) {
  const c = useColors();
  const result = useQuery(api.analyticsTasks.avgCarryover, { from: range.from, to: range.to });

  if (!result) return <Loading />;
  const total = result.distribution.reduce((s, b) => s + b.count, 0);
  if (total === 0) return <Empty msg="No completed tasks in this window." />;

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
        <Text style={{ fontSize: 44, fontWeight: "700", color: c.t1, letterSpacing: -1.5, lineHeight: 48 }}>
          {result.avg.toFixed(1)}
        </Text>
        <Text style={{ fontSize: 13, color: c.t3, marginBottom: 8 }}>avg carryovers before completion</Text>
      </View>
      <View style={{ gap: 8 }}>
        {result.distribution.map((b, i) => {
          const pct = total > 0 ? (b.count / total) * 100 : 0;
          return (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={{ width: 26, textAlign: "right", fontSize: 12, color: c.t3 }}>{CARRY_LABELS[i]}</Text>
              <View style={{ flex: 1, height: 18, backgroundColor: c.active, borderRadius: 6, overflow: "hidden" }}>
                <View style={{ height: "100%", width: `${pct}%` as `${number}%`, backgroundColor: CC[1], borderRadius: 6 }} />
              </View>
              <Text style={{ width: 64, textAlign: "right", fontSize: 12, color: c.t1 }}>
                {b.count}<Text style={{ color: c.t3 }}> ({Math.round(pct)}%)</Text>
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function OpenTasksTrendChart({ range, granularity }: { range: DateRange; granularity: Granularity }) {
  const rawRows = useQuery(api.analyticsTasks.openTasksByOriginDate, { from: range.from, to: range.to });

  if (!rawRows) return <Loading />;
  if (rawRows.length === 0) return <Empty msg="No tasks still open from this window — all resolved!" />;

  const daily = rawRows.map((r) => ({ date: r.date, value: r.count }));
  const bucketed = granularity === "weekly" ? bucketByWeek(daily) : granularity === "monthly" ? bucketByMonth(daily) : daily;
  const maxVal = Math.max(...bucketed.map((r) => r.value), 1);

  return (
    <View>
      <SimpleLineChart
        series={[{ data: bucketed.map((r) => r.value), color: CC[3]!, strokeWidth: 2 }]}
        height={140} domainY={[0, maxVal]}
      />
      <XLabels dates={bucketed.map((r) => r.date)} granularity={granularity} />
    </View>
  );
}
