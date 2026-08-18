import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import {
  MINUTES_PER_DAY,
  formatIntervalMinutes,
  formatMinuteOfDay,
  reminderSlotCount,
} from "@cadence/shared";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import type { useReminderSettings } from "../lib/useReminderSettings";

// Half-hour steps. A nudge window does not need minute precision, and steppers
// match how the routine-weight control on this same screen already works —
// there is no time picker anywhere in the app to reuse.
const STEP = 30;

const MODES = [
  { label: "Sound", value: "sound" },
  { label: "Vibrate", value: "vibration" },
  { label: "Both", value: "both" },
] as const;

export function ReminderFields({
  reminder,
}: {
  reminder: ReturnType<typeof useReminderSettings>;
}) {
  const c = useColors();
  const { draft, settings, error, permissionDenied, update } = reminder;

  // Wraps at midnight so the window can legitimately run 22:00 → 06:00.
  const shift = (key: "startMinute" | "endMinute", dir: 1 | -1) => {
    const next = (draft[key] + dir * STEP + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    update(key === "startMinute" ? { startMinute: next } : { endMinute: next });
  };

  const s = StyleSheet.create({
    panel:   { backgroundColor: c.bgE, borderWidth: 1, borderColor: c.bd1,
               borderRadius: radii.sm, padding: 10, gap: 10, marginTop: 10 },
    row:     { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    lbl:     { fontSize: 12, color: c.t2 },
    num:     { width: 70, backgroundColor: c.card, borderWidth: 1, borderColor: c.bd2,
               borderRadius: radii.sm, paddingHorizontal: 10, paddingVertical: 8,
               fontSize: 13, color: c.t1 },
    echo:    { fontSize: 11, color: c.t3, backgroundColor: c.active,
               borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 2 },
    stepper: { flexDirection: "row", alignItems: "center", gap: 6 },
    adjBtn:  { width: 26, height: 26, borderRadius: radii.sm, borderWidth: 1,
               borderColor: c.bd2, justifyContent: "center", alignItems: "center" },
    adjTxt:  { fontSize: 15, color: c.t2, lineHeight: 18, includeFontPadding: false },
    timeVal: { fontSize: 13, fontWeight: "600", color: c.t1, minWidth: 46,
               textAlign: "center" },
    modeRow: { flexDirection: "row", gap: 8 },
    modeBtn: { flex: 1, paddingVertical: 8, borderRadius: radii.sm, borderWidth: 1,
               borderColor: c.bd2, alignItems: "center" },
    modeOn:  { borderColor: c.prim, backgroundColor: c.accBg },
    modeTxt: { fontSize: 12, fontWeight: "600", color: c.t2 },
    modeTxtOn: { color: c.tacc },
    err:     { fontSize: 12, color: c.danger },
    warn:    { fontSize: 12, color: c.carry },
  });

  const stepper = (key: "startMinute" | "endMinute") => (
    <View style={s.stepper}>
      <TouchableOpacity onPress={() => shift(key, -1)} hitSlop={8} style={s.adjBtn}>
        <Text style={s.adjTxt}>−</Text>
      </TouchableOpacity>
      <Text style={s.timeVal}>{formatMinuteOfDay(draft[key])}</Text>
      <TouchableOpacity onPress={() => shift(key, 1)} hitSlop={8} style={s.adjBtn}>
        <Text style={s.adjTxt}>+</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.panel}>
      <View style={s.row}>
        <Text style={s.lbl}>Every</Text>
        <TextInput
          style={s.num}
          value={draft.intervalText}
          onChangeText={(v) => update({ intervalText: v })}
          placeholder="120"
          placeholderTextColor={c.t3}
          keyboardType="number-pad"
        />
        <Text style={s.lbl}>minutes</Text>
        {/* Suppressed while invalid — a count derived from a rejected value
            would contradict the error sitting right below it. */}
        {!error && (
          <Text style={s.echo}>
            {formatIntervalMinutes(settings.intervalMinutes)} ·{" "}
            {reminderSlotCount(draft.startMinute, draft.endMinute, settings.intervalMinutes)} a day
          </Text>
        )}
      </View>

      <View style={s.row}>
        <Text style={s.lbl}>Between</Text>
        {stepper("startMinute")}
        <Text style={s.lbl}>and</Text>
        {stepper("endMinute")}
      </View>

      <View style={s.modeRow}>
        {MODES.map((m) => (
          <TouchableOpacity
            key={m.value}
            style={[s.modeBtn, draft.alertMode === m.value && s.modeOn]}
            onPress={() => update({ alertMode: m.value })}
          >
            <Text style={[s.modeTxt, draft.alertMode === m.value && s.modeTxtOn]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && <Text style={s.err}>{error}</Text>}
      {permissionDenied && (
        <Text style={s.warn}>
          Notifications are off for Cadence in system settings, so nothing will fire.
        </Text>
      )}
    </View>
  );
}
