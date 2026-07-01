import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { useColors } from "../lib/theme";

interface Props {
  score: number;
  routineWeight: number;
  delta?: number;
  isPast?: boolean;
}

export function ProductivityTile({ score, routineWeight, delta, isPast }: Props) {
  const c = useColors();
  const setWeight = useMutation(api.users.setRoutineWeight);
  const pct = Math.round(routineWeight * 100);

  const adjust = (dir: 1 | -1) => {
    const next = Math.min(100, Math.max(0, pct + dir * 5));
    void setWeight({ routineWeight: next / 100 });
  };

  const s = StyleSheet.create({
    card:      { flex: 1, backgroundColor: c.card, borderWidth: 1, borderColor: c.bd1,
                 borderRadius: 14, padding: 11 },
    lbl:       { fontSize: 10, fontWeight: "700", textTransform: "uppercase",
                 letterSpacing: 0.6, color: c.t2, marginBottom: 3 },
    val:       { fontSize: 21, fontWeight: "700", letterSpacing: -0.5, color: c.t1, lineHeight: 24 },
    unit:      { fontSize: 12, fontWeight: "500", color: c.t2 },
    delta:     { fontSize: 11, color: c.t3, marginTop: 2 },
    deltaUp:   { color: c.cplt },
    wtRow:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                 marginTop: 6, borderTopWidth: 1, borderTopColor: c.bd1, paddingTop: 6 },
    wtLbl:     { fontSize: 10, color: c.t3 },
    wtCtrl:    { flexDirection: "row", alignItems: "center", gap: 6 },
    adjBtn:    { width: 20, height: 20, borderRadius: 6, borderWidth: 1,
                 borderColor: c.bd2, justifyContent: "center", alignItems: "center" },
    adjTxt:    { fontSize: 14, color: c.t2, lineHeight: 18, includeFontPadding: false },
    wtVal:     { fontSize: 11, fontWeight: "700", color: c.t1, minWidth: 30, textAlign: "center" },
  });

  return (
    <View style={s.card}>
      <Text style={s.lbl}>Today's score</Text>
      <Text style={s.val}>{score}<Text style={s.unit}> pts</Text></Text>
      {delta != null && (
        <Text style={[s.delta, delta > 0 && s.deltaUp]}>
          {delta >= 0 ? "+" : ""}{delta} vs yesterday
        </Text>
      )}
      {!isPast && (
        <View style={s.wtRow}>
          <Text style={s.wtLbl}>Routine weight</Text>
          <View style={s.wtCtrl}>
            <TouchableOpacity onPress={() => adjust(-1)} hitSlop={8} style={s.adjBtn}>
              <Text style={s.adjTxt}>−</Text>
            </TouchableOpacity>
            <Text style={s.wtVal}>{pct}%</Text>
            <TouchableOpacity onPress={() => adjust(1)} hitSlop={8} style={s.adjBtn}>
              <Text style={s.adjTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {isPast && <Text style={s.delta}>On this day</Text>}
    </View>
  );
}
