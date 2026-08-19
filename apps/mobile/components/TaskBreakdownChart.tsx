import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { DateRange } from "@cadence/shared";
import { Text, View } from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { Loading, Empty } from "./InsightShared";

export function TaskBreakdownChart({ range }: { range: DateRange }) {
  const c = useColors();
  const stats = useQuery(api.analyticsTasks.randomStats, {
    from: range.from,
    to: range.to,
  });

  if (!stats) return <Loading />;
  if (stats.total === 0)
    return <Empty msg="No completed tasks in this window." />;

  const total = stats.onTime + stats.afterCarryover;
  const segs = [
    { label: "On time", value: stats.onTime, color: c.chart2 },
    { label: "After carryover", value: stats.afterCarryover, color: c.chart3 },
  ].filter((s) => s.value > 0);

  return (
    <View style={{ gap: 14 }}>
      <View
        style={{
          flexDirection: "row",
          height: 22,
          borderRadius: radii.sm,
          overflow: "hidden",
          gap: 2,
        }}
      >
        {segs.map((s) => (
          <View
            key={s.label}
            style={{ flex: s.value, backgroundColor: s.color }}
          />
        ))}
      </View>
      <View style={{ gap: 8 }}>
        {segs.map((s) => (
          <View
            key={s.label}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: radii.full,
                  backgroundColor: s.color,
                }}
              />
              <Text style={{ fontSize: 13, color: c.t2 }}>{s.label}</Text>
            </View>
            <Text style={{ fontSize: 13, color: c.t1 }}>
              {s.value}
              <Text style={{ color: c.t3 }}>
                {" "}
                ({Math.round((s.value / total) * 100)}%)
              </Text>
            </Text>
          </View>
        ))}
        <View style={{ height: 1, backgroundColor: c.bd1, marginTop: 2 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 13, color: c.t2, fontWeight: "500" }}>
            Total completed
          </Text>
          <Text style={{ fontSize: 13, fontWeight: "600", color: c.t1 }}>
            {total}
          </Text>
        </View>
      </View>
    </View>
  );
}
