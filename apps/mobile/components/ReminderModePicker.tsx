import { StyleSheet, View } from "react-native";
import type { ReminderAlertMode } from "@cadence/shared";
import { Button } from "./ui/Button";

const MODES: { label: string; value: ReminderAlertMode }[] = [
  { label: "Sound", value: "sound" },
  { label: "Vibrate", value: "vibration" },
  { label: "Both", value: "both" },
];

/**
 * How a reminder announces itself.
 *
 * Uses the shared `segment` variant rather than its own copy — it had drifted
 * only in its unselected border (`bd2` against the variant's `bd1`), which is
 * the kind of difference nobody chose.
 */
export function ReminderModePicker({
  value,
  onChange,
}: {
  value: ReminderAlertMode;
  onChange: (mode: ReminderAlertMode) => void;
}) {
  const s = StyleSheet.create({
    row: { flexDirection: "row", gap: 8 },
  });

  return (
    <View style={s.row}>
      {MODES.map((m) => (
        <Button
          key={m.value}
          variant="segment"
          selected={value === m.value}
          title={m.label}
          onPress={() => onChange(m.value)}
          style={{ flex: 1 }}
        />
      ))}
    </View>
  );
}
