import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { DateRange } from "@cadence/shared";
import { Text, View } from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { seriesColors } from "../lib/insightUtils";
import { Loading, Empty } from "./InsightShared";

export function RoutineComparisonChart({
  range,
  today,
}: {
  range: DateRange;
  today: string;
}) {
  const c = useColors();
  const SC = seriesColors(c);
  const rows = useQuery(api.analyticsRoutines.routineConsistency, {
    from: range.from,
    to: range.to,
    today,
  });

  if (!rows) return <Loading />;
  if (rows.length === 0) return <Empty msg="No active routines." />;

  const data = rows
    .filter((r) => r.rate !== null)
    .map((r, i) => ({
      id: r.routineId as string,
      name: r.name,
      rate: r.rate ?? 0,
      color: SC[i % SC.length]!,
    }));

  if (data.length === 0)
    return <Empty msg="No scheduled days in this window." />;

  return (
    <View style={{ gap: 10, marginTop: 4 }}>
      {data.map((row) => (
        <View key={row.id} style={{ gap: 4 }}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={{ fontSize: 12, color: c.t1 }} numberOfLines={1}>
              {row.name.length > 20 ? row.name.slice(0, 20) + "…" : row.name}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: c.t2 }}>
              {row.rate}%
            </Text>
          </View>
          <View
            style={{
              height: 8,
              backgroundColor: c.active,
              borderRadius: radii.full,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${row.rate}%` as `${number}%`,
                backgroundColor: row.color,
                borderRadius: radii.full,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
