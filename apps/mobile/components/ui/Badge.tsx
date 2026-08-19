import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useColors } from "../../lib/theme";
import type { Colors } from "../../lib/colors";
import { radii } from "../../lib/radii";

export type BadgeTone =
  "neutral" | "accent" | "success" | "carryover" | "danger";

/**
 * Tones match apps/web/src/components/ui/badge.tsx one for one.
 *
 * `carryover` is NEUTRAL by design, not amber: a carried task should read as
 * quiet, not as a warning, and amber would collide with the gold accent. Same
 * reasoning as the `carry` token itself.
 */
function toneStyle(c: Colors, tone: BadgeTone) {
  switch (tone) {
    case "accent":
      return { border: c.bdAcc, bg: c.accBg, text: c.tacc };
    case "success":
      return { border: c.cplt, bg: c.successBg, text: c.tSuccess };
    case "carryover":
      return { border: "transparent", bg: c.accBg, text: c.carry };
    case "danger":
      return { border: c.danger, bg: c.dangerBg, text: c.danger };
    default:
      return { border: c.bd1, bg: c.active, text: c.t2 };
  }
}

interface Props {
  children: string;
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
}

/** The small pill used for counts, statuses and tags across every page. */
export function Badge({ children, tone = "neutral", style }: Props) {
  const c = useColors();
  const t = toneStyle(c, tone);

  return (
    <View
      style={[
        {
          alignSelf: "flex-start",
          borderRadius: radii.pill,
          borderWidth: 1,
          borderColor: t.border,
          backgroundColor: t.bg,
          paddingHorizontal: 10,
          paddingVertical: 2,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 12, fontWeight: "500", color: t.text }}>
        {children}
      </Text>
    </View>
  );
}
