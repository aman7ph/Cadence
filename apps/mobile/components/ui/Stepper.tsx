import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "../../lib/theme";
import { radii } from "../../lib/radii";

interface Props {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  /** Rendered after the number, e.g. "min (1h)" or a goal's unit. */
  suffix?: string;
  disabled?: boolean;
}

/**
 * `− [value] +` — the one numeric idiom in the option fields, mirroring web's
 * ui/stepper.tsx.
 *
 * The number is a real field, not a read-only display: a target of 56 pages or
 * 23 check-ins has to be typeable, and button-only would mean 56 taps. The
 * buttons nudge; the field sets.
 *
 * The draft is held as a string while focused so a half-typed value ("" or "1"
 * on the way to "12") is not clamped out from under the caret — the exact bug
 * web hit and fixed. Only in-range values are published; the rest settles on
 * blur.
 */
export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 9999,
  suffix,
  disabled,
}: Props) {
  const c = useColors();
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  // Follow external changes (the buttons, a reset) but never mid-typing.
  if (!focused && draft !== String(value)) setDraft(String(value));

  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const nudge = (dir: 1 | -1) => {
    const next = clamp(value + dir);
    onChange(next);
    setDraft(String(next));
  };

  const commit = (raw: string) => {
    setDraft(raw);
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n)) return;
    if (n >= min && n <= max) onChange(Math.round(n));
  };

  const settle = () => {
    setFocused(false);
    const n = Number(draft);
    const next =
      draft.trim() === "" || !Number.isFinite(n) ? value : clamp(Math.round(n));
    onChange(next);
    setDraft(String(next));
  };

  const s = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    label: { fontSize: 12, color: c.t2, flexShrink: 1 },
    ctrl: { flexDirection: "row", alignItems: "center", gap: 6 },
    btn: {
      width: 26,
      height: 26,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: c.bd2,
      justifyContent: "center",
      alignItems: "center",
    },
    btnTxt: {
      fontSize: 15,
      color: c.t2,
      lineHeight: 19,
      includeFontPadding: false,
    },
    input: {
      minWidth: 46,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: c.bd2,
      backgroundColor: c.card,
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 13,
      color: c.t1,
      textAlign: "center",
    },
    suffix: { fontSize: 11, color: c.t3 },
  });

  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <View style={s.ctrl}>
        <TouchableOpacity
          style={s.btn}
          onPress={() => nudge(-1)}
          disabled={disabled || value <= min}
          hitSlop={6}
          accessibilityLabel={`Decrease ${label}`}
        >
          <Text style={s.btnTxt}>−</Text>
        </TouchableOpacity>
        <TextInput
          style={s.input}
          value={draft}
          onChangeText={commit}
          onFocus={() => setFocused(true)}
          onBlur={settle}
          keyboardType="number-pad"
          editable={!disabled}
          accessibilityLabel={label}
        />
        {suffix ? <Text style={s.suffix}>{suffix}</Text> : null}
        <TouchableOpacity
          style={s.btn}
          onPress={() => nudge(1)}
          disabled={disabled || value >= max}
          hitSlop={6}
          accessibilityLabel={`Increase ${label}`}
        >
          <Text style={s.btnTxt}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
