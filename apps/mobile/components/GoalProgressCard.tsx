import { StyleSheet, Text, View } from "react-native";
import { goalProgress } from "@cadence/shared";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";

/** The oversized running total — `128 / 1000 pages` with the bar beneath. */
export function GoalProgressCard({
  currentValue,
  targetValue,
  unit,
}: {
  currentValue: number;
  targetValue: number;
  unit?: string;
}) {
  const c = useColors();
  const { pct, reached } = goalProgress(currentValue, targetValue);

  const s = StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginBottom: 10,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.bd1,
      borderRadius: radii.lg,
      padding: 14,
    },
    pRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    numRow: { flexDirection: "row", alignItems: "flex-end" },
    bigNum: {
      fontSize: 44,
      fontWeight: "700",
      color: c.t1,
      letterSpacing: -1.5,
      lineHeight: 48,
    },
    pOfTxt: { fontSize: 15, color: c.t2, marginBottom: 7, marginLeft: 4 },
    pPct: { fontSize: 16, fontWeight: "700", marginBottom: 7, color: c.prim },
    track: {
      height: 5,
      backgroundColor: c.active,
      borderRadius: radii.full,
      overflow: "hidden",
    },
    fill: { height: "100%", borderRadius: radii.full, backgroundColor: c.prim },
  });

  return (
    <View style={s.card}>
      <View style={s.pRow}>
        <View style={s.numRow}>
          <Text style={s.bigNum}>{currentValue}</Text>
          <Text style={s.pOfTxt}>
            / {targetValue}
            {unit ? ` ${unit}` : ""}
          </Text>
        </View>
        {/* The tick is how "target reached" reads — see the note in web's
            goal-detail-progress. It was a colour change until the palette
            collapsed complete and primary onto the same gold. */}
        <Text style={s.pPct}>
          {reached ? "✓ " : ""}
          {pct}%
        </Text>
      </View>
      <View style={s.track}>
        <View style={[s.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}
