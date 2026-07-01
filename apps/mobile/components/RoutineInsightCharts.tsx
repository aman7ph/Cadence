import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import type { DateRange } from "@cadence/shared";
import { startOfWeek } from "@cadence/shared";
import { Text, View } from "react-native";
import { useColors } from "../lib/theme";
import type { Granularity, LineSeries } from "../lib/insightUtils";
import { CC } from "../lib/insightUtils";
import { SimpleLineChart } from "./SimpleLineChart";
import { Loading, Empty, XLabels } from "./InsightShared";

type RoutineDay = { date: string; status: string };
type RoutineTimelineRow = { routineId: Id<"routines">; name: string; days: RoutineDay[] };

function buildRoutineData(rows: RoutineTimelineRow[], g: Granularity) {
  if (g === "daily") {
    const allDates = new Set<string>();
    rows.forEach((r) => r.days.forEach((d) => allDates.add(d.date)));
    const sorted = Array.from(allDates).sort();
    return {
      dates: sorted,
      series: rows.map((r) => {
        const byDate = new Map(r.days.map((d) => [d.date, d.status]));
        return {
          id: r.routineId, name: r.name,
          data: sorted.map((_, i) => {
            const last7 = sorted.slice(Math.max(0, i - 6), i + 1)
              .map((d) => byDate.get(d)).filter((s) => s === "completed" || s === "missed");
            const done = last7.filter((s) => s === "completed").length;
            return last7.length > 0 ? Math.round((done / last7.length) * 100) : 0;
          }),
        };
      }),
    };
  }
  const keyFn = g === "weekly" ? (d: string) => startOfWeek(d) : (d: string) => d.slice(0, 7) + "-01";
  const allKeys = new Set<string>();
  const rBuckets = rows.map((r) => {
    const buckets = new Map<string, { completed: number; total: number }>();
    for (const d of r.days) {
      if (d.status !== "completed" && d.status !== "missed") continue;
      const key = keyFn(d.date); allKeys.add(key);
      const b = buckets.get(key) ?? { completed: 0, total: 0 };
      b.total += 1; if (d.status === "completed") b.completed += 1;
      buckets.set(key, b);
    }
    return { id: r.routineId, name: r.name, buckets };
  });
  const sortedKeys = Array.from(allKeys).sort();
  return {
    dates: sortedKeys,
    series: rBuckets.map((r) => ({
      id: r.id, name: r.name,
      data: sortedKeys.map((key) => {
        const b = r.buckets.get(key);
        return b && b.total > 0 ? Math.round((b.completed / b.total) * 100) : 0;
      }),
    })),
  };
}

export function RoutineComparisonChart({ range }: { range: DateRange }) {
  const c = useColors();
  const rows = useQuery(api.analyticsRoutines.routineConsistency, { from: range.from, to: range.to });

  if (!rows) return <Loading />;
  if (rows.length === 0) return <Empty msg="No active routines." />;

  const data = rows.filter((r) => r.rate !== null)
    .map((r, i) => ({ id: r.routineId as string, name: r.name, rate: r.rate ?? 0, color: CC[i % CC.length]! }));

  if (data.length === 0) return <Empty msg="No scheduled days in this window." />;

  return (
    <View style={{ gap: 10, marginTop: 4 }}>
      {data.map((row) => (
        <View key={row.id} style={{ gap: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 12, color: c.t1 }} numberOfLines={1}>
              {row.name.length > 20 ? row.name.slice(0, 20) + "…" : row.name}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: c.t2 }}>{row.rate}%</Text>
          </View>
          <View style={{ height: 8, backgroundColor: c.active, borderRadius: 4, overflow: "hidden" }}>
            <View style={{ height: "100%", width: `${row.rate}%` as `${number}%`, backgroundColor: row.color, borderRadius: 4 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function RoutineCompletionLines({ range, granularity, today }: { range: DateRange; granularity: Granularity; today: string }) {
  const c = useColors();
  const rows = useQuery(api.analyticsRoutines.routineTimeline, { from: range.from, to: range.to, today });

  if (!rows) return <Loading />;
  if (rows.length === 0) return <Empty msg="No active routines." />;

  const { dates, series } = buildRoutineData(rows as RoutineTimelineRow[], granularity);
  if (dates.length === 0) return <Empty msg="No data in this window." />;

  const lineSeries: LineSeries[] = series.map((s, i) => ({ data: s.data, color: CC[i % CC.length]!, strokeWidth: 2 }));

  return (
    <View>
      <SimpleLineChart series={lineSeries} height={180} domainY={[0, 100]} />
      <XLabels dates={dates} granularity={granularity} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
        {series.map((s, i) => (
          <View key={s.id} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: CC[i % CC.length] }} />
            <Text style={{ fontSize: 11, color: c.t3 }} numberOfLines={1}>{s.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
