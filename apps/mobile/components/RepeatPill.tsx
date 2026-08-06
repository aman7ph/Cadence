import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useColors } from "../lib/theme";

// Labelled repeat toggle for the routine sheet, which has room for words.
// AddTaskBar uses a bare ↻ icon button instead — see RepeatFields.
export function RepeatPill({
  enabled,
  onToggle,
  disabled,
  label = "Repeat several times a day",
}: {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
  label?: string;
}) {
  const c = useColors();

  const s = StyleSheet.create({
    pill:   { flexDirection: "row", alignItems: "center", alignSelf: "flex-start",
              borderWidth: 1, borderColor: c.bd2, borderRadius: 999,
              paddingHorizontal: 12, paddingVertical: 6, marginTop: 10 },
    on:     { borderColor: c.prim, backgroundColor: c.accBg },
    txt:    { fontSize: 12, color: c.t3 },
    txtOn:  { color: c.tacc, fontWeight: "600" },
  });

  return (
    <TouchableOpacity onPress={onToggle} disabled={disabled}
      style={[s.pill, enabled && s.on]}>
      <Text style={[s.txt, enabled && s.txtOn]}>↻  {label}</Text>
    </TouchableOpacity>
  );
}
