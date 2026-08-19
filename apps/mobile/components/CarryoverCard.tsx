import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { DateRange } from "@cadence/shared";
import { Text, View } from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { seriesColors } from "../lib/insightUtils";
import { Loading, Empty } from "./InsightShared";

const CARRY_LABELS = ["0×", "1×", "2×", "3+"];

export function CarryoverCard({ range }: { range: DateRange }) {
  const c = useColors();
  const SC = seriesColors(c);
  const result = useQuery(api.analyticsTasks.avgCarryover, {
    from: range.from,
    to: range.to,
  });

  if (!result) return <Loading />;
  const total = result.distribution.reduce((s, b) => s + b.count, 0);
  if (total === 0) return <Empty msg="No completed tasks in this window." />;

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
        <Text
          style={{
            fontSize: 44,
            fontWeight: "700",
            color: c.t1,
            letterSpacing: -1.5,
            lineHeight: 48,
          }}
        >
          {result.avg.toFixed(1)}
        </Text>
        <Text style={{ fontSize: 13, color: c.t3, marginBottom: 8 }}>
          avg carryovers before completion
        </Text>
      </View>
      <View style={{ gap: 8 }}>
        {result.distribution.map((b, i) => {
          const pct = total > 0 ? (b.count / total) * 100 : 0;
          return (
            <View
              key={i}
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Text
                style={{
                  width: 26,
                  textAlign: "right",
                  fontSize: 12,
                  color: c.t3,
                }}
              >
                {CARRY_LABELS[i]}
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 18,
                  backgroundColor: c.active,
                  borderRadius: radii.sm,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${pct}%` as `${number}%`,
                    backgroundColor: SC[1],
                    borderRadius: radii.sm,
                  }}
                />
              </View>
              <Text
                style={{
                  width: 64,
                  textAlign: "right",
                  fontSize: 12,
                  color: c.t1,
                }}
              >
                {b.count}
                <Text style={{ color: c.t3 }}> ({Math.round(pct)}%)</Text>
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
