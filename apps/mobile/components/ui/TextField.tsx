import { forwardRef } from "react";
import { StyleSheet, TextInput, type TextInputProps } from "react-native";
import { useColors } from "../../lib/theme";
import type { Colors } from "../../lib/colors";
import { radii } from "../../lib/radii";

/**
 * The field box itself, for the controls that must LOOK like a field without
 * being one — the schedule sheet's date button, for instance. Exported so that
 * case reuses this definition instead of copying it back.
 */
export const fieldBox = (c: Colors) => ({
  backgroundColor: c.card,
  borderWidth: 1,
  borderColor: c.bd2,
  borderRadius: radii.sm,
  paddingHorizontal: 14,
  paddingVertical: 11,
});

/**
 * The text input every form sheet uses.
 *
 * Five sheets declared this style **byte-identically** — the placeholder colour
 * included, which is the part each one had to remember to pass. One definition
 * now, so a change to the field reaches every form.
 */
export const TextField = forwardRef<TextInput, TextInputProps>(
  function TextField({ style, ...props }, ref) {
    const c = useColors();
    const s = StyleSheet.create({
      input: { ...fieldBox(c), fontSize: 14, color: c.t1 },
    });
    return (
      <TextInput
        ref={ref}
        placeholderTextColor={c.t3}
        style={[s.input, style]}
        {...props}
      />
    );
  },
);
