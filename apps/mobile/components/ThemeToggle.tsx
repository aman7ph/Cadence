import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useColors, useTheme } from "../lib/theme";

/**
 * The theme control, mirroring web's `ThemeToggle`: a round button in the
 * shell's top-right that cycles light → dark → system.
 *
 * The glyph follows the RESOLVED scheme rather than the preference — showing a
 * sun while dark, i.e. "tap to go lighter" — which is exactly what web does
 * with its Sun/Moon icons. Text glyphs rather than an icon font because mobile
 * has no icon library and already draws its chrome this way.
 *
 * The three-way picker in Settings stays; this is the quick path through the
 * same states, not a second source of truth.
 */
export function ThemeToggle() {
  const c = useColors();
  const { colorScheme, preference, toggle } = useTheme();

  const s = StyleSheet.create({
    btn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.active,
      alignItems: "center",
      justifyContent: "center",
    },
    glyph: { fontSize: 15, color: c.t2, includeFontPadding: false },
  });

  return (
    <TouchableOpacity
      onPress={toggle}
      hitSlop={10}
      style={s.btn}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Theme: ${preference}. Tap to change.`}
    >
      <Text style={s.glyph}>{colorScheme === "dark" ? "☀" : "☾"}</Text>
    </TouchableOpacity>
  );
}
