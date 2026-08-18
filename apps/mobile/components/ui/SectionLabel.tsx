import { Text, type StyleProp, type TextStyle } from "react-native";
import { useColors } from "../../lib/theme";
import { display } from "../../lib/fonts";

interface Props {
  children: string;
  /** Rendered inline after a middot — "ROUTINES · 3/11". */
  count?: string;
  style?: StyleProp<TextStyle>;
}

/**
 * The section heading used across every page.
 *
 * Measured from the prototype and matched to the web's section-label.tsx: Lora,
 * 11px, regular weight, 0.55px tracking (the web's 0.05em at 11px), with the
 * count inline after a middot rather than pushed to the right.
 *
 * One component so seven pages cannot drift apart — which they currently do.
 */
export function SectionLabel({ children, count, style }: Props) {
  const c = useColors();
  return (
    <Text
      accessibilityRole="header"
      style={[
        { ...display("regular"), fontSize: 11, letterSpacing: 0.55, color: c.t3 },
        style,
      ]}
    >
      {children.toUpperCase()}
      {count ? ` · ${count}` : ""}
    </Text>
  );
}
