import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useColors } from "../../lib/theme";
import {
  buttonStyles,
  type ButtonSize,
  type ButtonTone,
  type ButtonVariant,
} from "./buttonStyles";

interface Props {
  /** Text label. Omit and pass `children` for anything richer. */
  title?: string;
  children?: ReactNode;
  variant?: ButtonVariant;
  /** Colour of `outline` only. */
  tone?: ButtonTone;
  size?: ButtonSize;
  /** Selected state of `segment` and `tab`. */
  selected?: boolean;
  disabled?: boolean;
  /** Swaps the label for a spinner and blocks presses. */
  loading?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

/**
 * One button, eight treatments — variants are props, never separate components.
 *
 * Mobile had no shared button at all: 95 hand-styled `TouchableOpacity`s across
 * 30 files, each re-deciding padding, radius and colour. This is where that
 * stops. The variant names match apps/web/src/components/ui/button.tsx exactly,
 * so the two apps describe their buttons the same way.
 *
 * `fab` is the one variant web does not have, and deliberately so — per M5 the
 * prototype's own phone frames use a floating add action where the desktop uses
 * a header button.
 */
export function Button({
  title,
  children,
  variant = "solid",
  tone = "neutral",
  size = "md",
  selected = false,
  disabled = false,
  loading = false,
  onPress,
  style,
  labelStyle,
  accessibilityLabel,
}: Props) {
  const c = useColors();
  const { box, label } = buttonStyles(c, variant, tone, size, selected);
  const off = disabled || loading;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: off, selected }}
      disabled={off}
      onPress={onPress}
      activeOpacity={0.7}
      style={[box, off && { opacity: 0.45 }, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={label.color as string} />
      ) : (
        (children ?? <Text style={[label, labelStyle]}>{title}</Text>)
      )}
    </TouchableOpacity>
  );
}
