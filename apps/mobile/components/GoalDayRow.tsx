import { StyleSheet, Text, View } from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";

/**
 * One linked item on a goal's day: a status dot, its name, and what it is.
 *
 * Rendered identically for routines and tasks — only the trailing word differs,
 * which is why it is one row with a `kind` rather than two loops.
 */
export function GoalDayRow({
  name,
  kind,
  completed,
}: {
  name: string;
  kind: "routine" | "task";
  completed: boolean;
}) {
  const c = useColors();

  const s = StyleSheet.create({
    item: {
      marginHorizontal: 16,
      marginBottom: 10,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.bd1,
      borderRadius: radii.sm,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 10 },
    dot: { width: 8, height: 8, borderRadius: radii.full },
    name: { flex: 1, fontSize: 13, color: c.t1 },
    tag: { fontSize: 11, color: c.t3 },
  });

  return (
    <View style={s.item}>
      <View style={s.row}>
        <View
          style={[s.dot, { backgroundColor: completed ? c.cplt : c.bd3 }]}
        />
        <Text style={s.name}>{name}</Text>
        <Text style={s.tag}>{kind}</Text>
      </View>
    </View>
  );
}
