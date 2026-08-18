import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";

interface Props {
  title: string; status: "active" | "completed" | "abandoned";
  description?: string; targetValue?: number; currentValue?: number;
  unit?: string; dueDate?: string; taskCount: number; routineCount: number;
  onPress: () => void;
}

export function GoalCard({ title, description, targetValue, currentValue, unit, dueDate, taskCount, routineCount, onPress }: Props) {
  const c = useColors();
  const pct = targetValue ? Math.min(100, Math.round(((currentValue ?? 0) / targetValue) * 100)) : null;

  const s = StyleSheet.create({
    card:    { backgroundColor: c.card, borderWidth: 1, borderColor: c.bd1,
               borderRadius: radii.md, padding: 14 },
    title:   { fontSize: 13.5, fontWeight: "600", color: c.t1, marginBottom: 4 },
    desc:    { fontSize: 11, color: c.t2, lineHeight: 17, marginBottom: 8 },
    pRow:    { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    pTxt:    { fontSize: 11, color: c.t2 },
    pPct:    { fontSize: 11.5, fontWeight: "600" },
    track:   { height: 3, backgroundColor: c.bgS, borderRadius: radii.full, overflow: "hidden", marginBottom: 8 },
    row:     { flexDirection: "row", alignItems: "center", gap: 6 },
    // One badge treatment, gold on the accent surface — the prototype shows
    // both counts that way. They were two different chart hues, which read as
    // a data series rather than as tags.
    pill:    { backgroundColor: c.accBg, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 2 },
    pillTxt: { fontSize: 10, fontWeight: "600", color: c.tacc },
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
            <Text style={[s.pPct, { color: c.prim }]}>{pct}%</Text>
          </View>
          <View style={s.track}>
            <View style={{ height: "100%", borderRadius: radii.full, width: `${pct}%`, backgroundColor: c.prim }} />
          </View>
        </>
      )}
      <View style={s.row}>
        {taskCount > 0 && (
          <View style={s.pill}>
            <Text style={s.pillTxt}>{taskCount} task{taskCount !== 1 ? "s" : ""}</Text>
          </View>
        )}
        {routineCount > 0 && (
          <View style={s.pill}>
            <Text style={s.pillTxt}>{routineCount} routine{routineCount !== 1 ? "s" : ""}</Text>
          </View>
        )}
        {dueDate && <Text style={s.due}>Due {dueDate}</Text>}
      </View>
    </TouchableOpacity>
  );
}
