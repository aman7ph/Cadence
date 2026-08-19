import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import type { DateRange, RoutineChartDay } from "@cadence/shared";
import {
  countsTowardRate,
  rollingCompletionRate,
  startOfWeek,
} from "@cadence/shared";
import { Text, View } from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import type { Granularity, LineSeries } from "../lib/insightUtils";
import { seriesColors } from "../lib/insightUtils";
import { SimpleLineChart } from "./SimpleLineChart";
import { Loading, Empty, XLabels } from "./InsightShared";

type RoutineTimelineRow = {
  routineId: Id<"routines">;
  name: string;
  days: RoutineChartDay[];
};

function buildRoutineData(rows: RoutineTimelineRow[], g: Granularity) {
  if (g === "daily") {
    // Shared x-axis, but each routine's rate comes from ITS OWN scheduled days
    // — see shared/routineChart.ts. Same computation the web chart uses.
    const allDates = new Set<string>();
    rows.forEach((r) => r.days.forEach((d) => allDates.add(d.date)));
    const sorted = Array.from(allDates).sort();
    return {
      dates: sorted,
      series: rows.map((r) => ({
        id: r.routineId,
        name: r.name,
        data: rollingCompletionRate(r.days, sorted),
      })),
    };
  }
  const keyFn =
    g === "weekly"
      ? (d: string) => startOfWeek(d)
      : (d: string) => d.slice(0, 7) + "-01";
  const allKeys = new Set<string>();
  const rBuckets = rows.map((r) => {
    const buckets = new Map<string, { completed: number; total: number }>();
    for (const d of r.days) {
      if (!countsTowardRate(d.status)) continue;
      const key = keyFn(d.date);
      allKeys.add(key);
      const b = buckets.get(key) ?? { completed: 0, total: 0 };
      b.total += 1;
      if (d.status === "completed") b.completed += 1;
      buckets.set(key, b);
    }
    return { id: r.routineId, name: r.name, buckets };
  });
  const sortedKeys = Array.from(allKeys).sort();
  return {
    dates: sortedKeys,
    series: rBuckets.map((r) => ({
      id: r.id,
      name: r.name,
      // null, not 0 — a bucket with no scheduled days is a gap, not a failure.
      data: sortedKeys.map((key) => {
        const b = r.buckets.get(key);
        return b && b.total > 0
          ? Math.round((b.completed / b.total) * 100)
          : null;
      }),
    })),
  };
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
  const c = useColors();
  const SC = seriesColors(c);
  const rows = useQuery(api.analyticsRoutines.routineTimeline, {
    from: range.from,
    to: range.to,
    today,
  });

  if (!rows) return <Loading />;
  if (rows.length === 0) return <Empty msg="No active routines." />;

  const { dates, series } = buildRoutineData(
    rows as RoutineTimelineRow[],
    granularity,
  );
  if (dates.length === 0) return <Empty msg="No data in this window." />;

  const lineSeries: LineSeries[] = series.map((s, i) => ({
    data: s.data,
    color: SC[i % SC.length]!,
    strokeWidth: 2,
  }));

  return (
    <View>
      <SimpleLineChart series={lineSeries} height={180} domainY={[0, 100]} />
      <XLabels dates={dates} granularity={granularity} />
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 10,
        }}
      >
        {series.map((s, i) => (
          <View
            key={s.id}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: radii.full,
                backgroundColor: SC[i % SC.length],
              }}
            />
            <Text style={{ fontSize: 11, color: c.t3 }} numberOfLines={1}>
              {s.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
