import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { DateRange } from "@cadence/shared";
import { Text, View } from "react-native";
import { useColors } from "../lib/theme";
import type { Granularity, LineSeries } from "../lib/insightUtils";
import { computeEMA, bucketByWeek, bucketByMonth, HEAT_DARK, HEAT_LIGHT, DOW } from "../lib/insightUtils";
import { SimpleLineChart } from "./SimpleLineChart";
import { Loading, Empty, XLabels } from "./InsightShared";

export function MomentumChart({ range, granularity }: { range: DateRange; granularity: Granularity }) {
  const c = useColors();
  const rawRows = useQuery(api.analyticsProductivity.dayStatsRange, { from: range.from, to: range.to });

  if (!rawRows) return <Loading />;
  if (rawRows.length === 0) return <Empty msg="Complete some routines or tasks to see momentum." />;

  const daily = rawRows.map((r) => ({ date: r.date, value: r.productivityScore }));
  const bucketed = granularity === "weekly" ? bucketByWeek(daily) : granularity === "monthly" ? bucketByMonth(daily) : daily;
  const vals = bucketed.map((r) => r.value);
  const ema = granularity === "daily" ? computeEMA(vals, 7) : null;

  const series: LineSeries[] = [
    { data: vals.map(Math.round), color: "#818cf8", strokeWidth: 1.5, opacity: 0.35 },
    ...(ema ? [{ data: ema.map(Math.round), color: "#818cf8", strokeWidth: 2.5 }] : []),
  ];

  return (
    <View>
      <SimpleLineChart series={series} height={160} domainY={[0, 100]} />
      <XLabels dates={bucketed.map((r) => r.date)} granularity={granularity} />
      {ema && (
        <View style={{ flexDirection: "row", gap: 14, marginTop: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 16, height: 1.5, backgroundColor: "#818cf8", opacity: 0.4 }} />
            <Text style={{ fontSize: 11, color: c.t3 }}>Score</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 16, height: 2.5, backgroundColor: "#818cf8" }} />
            <Text style={{ fontSize: 11, color: c.t3 }}>7-day EMA</Text>
          </View>
        </View>
      )}
    </View>
  );
}

export function DowHeatmap({ range }: { range: DateRange }) {
  const c = useColors();
  const stats = useQuery(api.analyticsProductivity.dayOfWeekStats, { from: range.from, to: range.to });

  if (!stats) return <Loading />;

  const isDark = c.bg === "#0e0f14" || c.bg.startsWith("#0") || c.bg.startsWith("#1");
  const heat = isDark ? HEAT_DARK : HEAT_LIGHT;

  return (
    <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
      {stats.map((s) => {
        const rate = s.rate ?? 0;
        const lvl = s.scheduled === 0 ? 0 : rate >= 80 ? 4 : rate >= 60 ? 3 : rate >= 40 ? 2 : 1;
        return (
          <View key={s.weekday} style={{ flex: 1, alignItems: "center", gap: 5 }}>
            <View style={{ width: "100%", aspectRatio: 1, borderRadius: 8, backgroundColor: heat[lvl] }} />
            <Text style={{ fontSize: 10, color: c.t3, fontWeight: "500" }}>{DOW[s.weekday]}</Text>
            <Text style={{ fontSize: 11, fontWeight: "600", color: c.t1 }}>{s.rate !== null ? `${s.rate}%` : "—"}</Text>
          </View>
        );
      })}
    </View>
  );
}
