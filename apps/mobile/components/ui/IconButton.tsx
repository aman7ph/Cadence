import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useColors } from "../../lib/theme";
import { radii } from "../../lib/radii";

/**
 * The 34px circular chrome button — `✕` to close, `•••` to open a menu.
 *
 * Declared byte-identically in both full-screen pages (goal detail used it
 * twice, the history day once) down to the border colour and the 13px/600
 * glyph.
 */
export function IconButton({
  glyph,
  onPress,
  accessibilityLabel,
}: {
  glyph: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const c = useColors();

  const s = StyleSheet.create({
    btn: {
      width: 34,
      height: 34,
      borderRadius: radii.full,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.bd2,
      alignItems: "center",
      justifyContent: "center",
    },
    txt: { fontSize: 13, fontWeight: "600", color: c.t2 },
  });

  return (
    <TouchableOpacity
      style={s.btn}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={s.txt}>{glyph}</Text>
    </TouchableOpacity>
  );
}
