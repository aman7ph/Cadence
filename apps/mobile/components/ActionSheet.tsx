import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useColors } from "../lib/theme";
import { Sheet } from "./ui/Sheet";

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

/**
 * The row menu behind every `⋯`. Actions only — anything destructive should
 * open a `ConfirmSheet` from here rather than firing on the tap.
 *
 * No grab handle: the title row reads as the top edge.
 */
export function ActionSheet({ visible, title, actions, onCancel }: Props) {
  const c = useColors();

  const s = StyleSheet.create({
    title: {
      textAlign: "center", fontSize: 11, fontWeight: "700", letterSpacing: 0.8,
      textTransform: "uppercase", paddingVertical: 14, borderBottomWidth: 1,
      color: c.t2, borderBottomColor: c.bd1,
    },
    btn: { paddingHorizontal: 20, paddingVertical: 16 },
    btnTxt: { fontSize: 16, fontWeight: "500", textAlign: "center" },
    divider: { borderBottomWidth: 1, borderBottomColor: c.bd1 },
    cancelBtn: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: c.bd2 },
    cancelTxt: { fontSize: 16, textAlign: "center", color: c.t3 },
  });

  return (
    <Sheet visible={visible} onClose={onCancel} handle={false}>
      {title ? <Text style={s.title}>{title}</Text> : null}
      {actions.map((a, i) => (
        <TouchableOpacity
          key={i}
          style={[s.btn, i < actions.length - 1 && s.divider]}
          onPress={() => { a.onPress(); onCancel(); }}
          activeOpacity={0.7}
        >
          <Text style={[s.btnTxt, { color: a.style === "destructive" ? c.danger : c.t1 }]}>
            {a.label}
          </Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={s.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
        <Text style={s.cancelTxt}>Cancel</Text>
      </TouchableOpacity>
    </Sheet>
  );
}
