import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";

interface Props {
  onRequestComplete: () => void;
  onRequestAbandon: () => void;
}

/**
 * The two status actions on an active goal. They only REQUEST — the
 * confirmation is a `ConfirmSheet`, as it is everywhere else in both apps.
 * This component used to render its own inline confirm row, which was the last
 * hand-rolled confirmation on mobile.
 */
export function GoalActionButtons({ onRequestComplete, onRequestAbandon }: Props) {
  const c = useColors();
  const s = StyleSheet.create({
    actRow: { flexDirection: "row", gap: 8 },
    actBtn: { flex: 1, paddingVertical: 9, borderRadius: radii.sm, alignItems: "center", borderWidth: 1 },
    txt: { fontSize: 12, fontWeight: "600" },
  });

  return (
    <View style={s.actRow}>
      <TouchableOpacity
        style={[s.actBtn, { backgroundColor: c.successBg, borderColor: c.cplt }]}
        onPress={onRequestComplete} activeOpacity={0.7}>
        <Text style={[s.txt, { color: c.success }]}>✓ Mark complete</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.actBtn, { borderColor: c.bd2 }]}
        onPress={onRequestAbandon} activeOpacity={0.7}>
        <Text style={[s.txt, { color: c.t2 }]}>Abandon</Text>
      </TouchableOpacity>
    </View>
  );
}
