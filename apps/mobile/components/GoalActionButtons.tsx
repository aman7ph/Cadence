import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../lib/theme";

interface Props {
  confirm: "complete" | "abandon" | null;
  onConfirmChange: (v: "complete" | "abandon" | null) => void;
  onComplete: () => Promise<void>;
  onAbandon: () => Promise<void>;
}

export function GoalActionButtons({ confirm, onConfirmChange, onComplete, onAbandon }: Props) {
  const c = useColors();
  const s = StyleSheet.create({
    confTxt: { fontSize: 13, color: c.t1, marginBottom: 10 },
    confRow: { flexDirection: "row", gap: 8 },
    confBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: c.bd2 },
    actRow:  { flexDirection: "row", gap: 8 },
    actBtn:  { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  });

  if (confirm) {
    return (
      <>
        <Text style={s.confTxt}>
          {confirm === "complete" ? "Mark this goal as complete?" : "Abandon this goal?"}
        </Text>
        <View style={s.confRow}>
          <TouchableOpacity style={s.confBtn} onPress={() => onConfirmChange(null)}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: c.t2 }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.confBtn, { backgroundColor: confirm === "complete" ? c.success : c.danger, borderColor: "transparent" }]}
            onPress={confirm === "complete" ? onComplete : onAbandon}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>
              {confirm === "complete" ? "Mark complete" : "Abandon"}
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <View style={s.actRow}>
      <TouchableOpacity
        style={[s.actBtn, { backgroundColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.3)" }]}
        onPress={() => onConfirmChange("complete")} activeOpacity={0.7}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: c.success }}>✓ Mark complete</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.actBtn, { borderColor: c.bd2 }]}
        onPress={() => onConfirmChange("abandon")} activeOpacity={0.7}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: c.t2 }}>Abandon</Text>
      </TouchableOpacity>
    </View>
  );
}
