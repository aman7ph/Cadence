import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../lib/theme";

interface Props {
  title: string; status: "active" | "completed" | "abandoned";
  description?: string; targetValue?: number; currentValue?: number;
  unit?: string; dueDate?: string; taskCount: number; routineCount: number;
  onPress: () => void;
}

export function GoalCard({ title, description, targetValue, currentValue, unit, dueDate, taskCount, routineCount, onPress }: Props) {
  const c = useColors();
  const pct = targetValue ? Math.min(100, Math.round(((currentValue ?? 0) / targetValue) * 100)) : null;
  const barColor = pct === 100 ? c.success : c.prim;

  const s = StyleSheet.create({
    card:    { backgroundColor: c.card, borderWidth: 1, borderColor: c.bd1, borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 8 },
    title:   { fontSize: 15, fontWeight: "600", color: c.t1, marginBottom: 4 },
    desc:    { fontSize: 12, color: c.t2, lineHeight: 18, marginBottom: 8 },
    pRow:    { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    pTxt:    { fontSize: 11, color: c.t3 },
    track:   { height: 3, backgroundColor: c.active, borderRadius: 2, overflow: "hidden", marginBottom: 8 },
    row:     { flexDirection: "row", alignItems: "center", gap: 6 },
    pill:    { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
    pillTxt: { fontSize: 11, fontWeight: "600" },
    due:     { fontSize: 11, color: c.t3, marginLeft: "auto" },
  });

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.75}>
      <Text style={s.title} numberOfLines={2}>{title}</Text>
      {description ? <Text style={s.desc} numberOfLines={2}>{description}</Text> : null}
      {pct !== null && (
        <>
          <View style={s.pRow}>
            <Text style={s.pTxt}>{currentValue ?? 0}{unit ? ` ${unit}` : ""} / {targetValue}{unit ? ` ${unit}` : ""}</Text>
            <Text style={[s.pTxt, { color: barColor }]}>{pct}%</Text>
          </View>
          <View style={s.track}>
            <View style={{ height: "100%", borderRadius: 2, width: `${pct}%`, backgroundColor: barColor }} />
          </View>
        </>
      )}
      <View style={s.row}>
        {taskCount > 0 && (
          <View style={[s.pill, { backgroundColor: "rgba(99,102,241,0.14)" }]}>
            <Text style={[s.pillTxt, { color: "#818cf8" }]}>{taskCount} task{taskCount !== 1 ? "s" : ""}</Text>
          </View>
        )}
        {routineCount > 0 && (
          <View style={[s.pill, { backgroundColor: "rgba(34,197,94,0.14)" }]}>
            <Text style={[s.pillTxt, { color: "#4ade80" }]}>{routineCount} routine{routineCount !== 1 ? "s" : ""}</Text>
          </View>
        )}
        {dueDate && <Text style={s.due}>Due {dueDate}</Text>}
      </View>
    </TouchableOpacity>
  );
}
