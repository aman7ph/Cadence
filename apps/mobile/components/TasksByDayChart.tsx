import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { DateRange } from "@cadence/shared";
import { Text, View } from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import type { Granularity } from "../lib/insightUtils";
import { TASK_KEYS, taskColors } from "../lib/insightUtils";
import { bucketCountsByWeek, bucketCountsByMonth } from "@cadence/shared";
import { Loading, Empty, XLabels } from "./InsightShared";

export function TasksByDayChart({
  range,
  granularity,
}: {
  range: DateRange;
  granularity: Granularity;
}) {
  const c = useColors();
  const TC = taskColors(c);
  const rawRows = useQuery(api.analyticsTasks.randomTasksByDay, {
    from: range.from,
    to: range.to,
  });

  if (!rawRows) return <Loading />;
  if (rawRows.length === 0) return <Empty msg="No tasks in this window." />;

  type TKRow = { date: string; completed: number; open: number };
  const rows =
    granularity === "weekly"
      ? bucketCountsByWeek(rawRows as unknown as TKRow[], TASK_KEYS)
      : granularity === "monthly"
        ? bucketCountsByMonth(rawRows as unknown as TKRow[], TASK_KEYS)
        : (rawRows as TKRow[]);
  const maxTotal = Math.max(
    ...rows.map((r) => (r.completed ?? 0) + (r.open ?? 0)),
    1,
  );

  return (
    <View>
      <View
        style={{
          height: 130,
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 2,
        }}
      >
        {rows.map((r, i) => {
          const total = (r.completed ?? 0) + (r.open ?? 0);
          const hPct = total > 0 ? (total / maxTotal) * 100 : 0;
          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: `${hPct}%` as `${number}%`,
                flexDirection: "column-reverse",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              {(r.completed ?? 0) > 0 && (
                <View
                  style={{ flex: r.completed, backgroundColor: TC.completed }}
                />
              )}
              {(r.open ?? 0) > 0 && (
                <View style={{ flex: r.open, backgroundColor: TC.open }} />
              )}
            </View>
          );
        })}
      </View>
      <XLabels dates={rows.map((r) => r.date)} granularity={granularity} />
      <View style={{ flexDirection: "row", gap: 14, marginTop: 8 }}>
        {TASK_KEYS.map((k) => (
          <View
            key={k}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: radii.full,
                backgroundColor: TC[k],
              }}
            />
            <Text style={{ fontSize: 11, color: c.t3 }}>
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
