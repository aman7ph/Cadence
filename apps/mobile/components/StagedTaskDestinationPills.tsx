import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../lib/theme";

export type StagedTaskDestination = "task" | "routine";

interface Props {
  value: StagedTaskDestination;
  disabled?: boolean;
  onChange: (d: StagedTaskDestination) => void;
}

// Pill toggle styled like SchedulePicker's schedule-type pills.
export function StagedTaskDestinationPills({ value, disabled, onChange }: Props) {
  const c = useColors();

  const s = StyleSheet.create({
    row:   { flexDirection: "row", gap: 8 },
    btn:   { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
             borderWidth: 1, borderColor: c.bd2, backgroundColor: c.card },
    btnOn: { borderColor: c.prim, backgroundColor: c.accBg },
    txt:   { fontSize: 12, fontWeight: "600", color: c.t2 },
    txtOn: { color: c.tacc },
  });

  return (
    <View style={s.row}>
      {(["task", "routine"] as StagedTaskDestination[]).map((d) => (
        <TouchableOpacity key={d} onPress={() => onChange(d)} disabled={disabled}
          style={[s.btn, value === d && s.btnOn]}>
          <Text style={[s.txt, value === d && s.txtOn]}>
            {d === "task" ? "Daily task" : "Routine"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
