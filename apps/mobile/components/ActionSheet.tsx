import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../lib/theme";

export interface ActionItem {
  label: string;
  style?: "default" | "destructive";
  onPress: () => void;
}

interface Props {
  visible: boolean;
  title?: string;
  actions: ActionItem[];
  onCancel: () => void;
}

export function ActionSheet({ visible, title, actions, onCancel }: Props) {
  const c = useColors();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onCancel} />
      <View style={[s.sheet, { backgroundColor: c.bgE, borderColor: c.bd2 }]}>
        {title && (
          <Text style={[s.title, { color: c.t2, borderBottomColor: c.bd1 }]}>
            {title}
          </Text>
        )}
        {actions.map((a, i) => (
          <TouchableOpacity
            key={i}
            style={[
              s.btn,
              i < actions.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.bd1 },
            ]}
            onPress={() => { a.onPress(); onCancel(); }}
            activeOpacity={0.7}
          >
            <Text style={[s.btnTxt, { color: a.style === "destructive" ? c.danger : c.t1 }]}>
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[s.cancelBtn, { borderTopColor: c.bd2 }]}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Text style={[s.cancelTxt, { color: c.t3 }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet:     { borderTopLeftRadius: 20, borderTopRightRadius: 20,
               borderWidth: 1, borderBottomWidth: 0, paddingBottom: 32 },
  title:     { textAlign: "center", fontSize: 11, fontWeight: "700", letterSpacing: 0.8,
               textTransform: "uppercase", paddingVertical: 14, borderBottomWidth: 1 },
  btn:       { paddingHorizontal: 20, paddingVertical: 16 },
  btnTxt:    { fontSize: 16, fontWeight: "500", textAlign: "center" },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1 },
  cancelTxt: { fontSize: 16, textAlign: "center" },
});
