import { View, type StyleProp, type ViewStyle } from "react-native";
import { Button } from "./Button";

interface Props {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  /** Blocks both actions and spins the CTA. */
  pending?: boolean;
  /** Blocks the CTA only — Cancel must always stay reachable. */
  invalid?: boolean;
  /** Destructive confirms get the outlined danger CTA, as on web. */
  tone?: "accent" | "danger";
  cancelLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The Cancel / CTA footer every form modal ends with.
 *
 * All four form modals had this hand-written and character-for-character
 * identical — same padding, same 0.45 dim, same spinner — differing only in the
 * CTA's words. The web keeps it inside FormDrawer for the same reason: pending
 * state should not be re-implemented per form, and a destructive confirm must
 * not be able to drift from a create form, since it is this component with a
 * different CTA tone.
 */
export function FormFooter({
  onCancel,
  onSubmit,
  submitLabel,
  pending = false,
  invalid = false,
  tone = "accent",
  cancelLabel = "Cancel",
  style,
}: Props) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 20,
          paddingTop: 12,
        },
        style,
      ]}
    >
      <Button
        variant="ghost"
        size="lg"
        title={cancelLabel}
        onPress={onCancel}
        disabled={pending}
      />
      <Button
        variant={tone === "danger" ? "outline" : "solid"}
        tone={tone === "danger" ? "danger" : "neutral"}
        size="lg"
        title={submitLabel}
        onPress={onSubmit}
        disabled={invalid}
        loading={pending}
      />
    </View>
  );
}
