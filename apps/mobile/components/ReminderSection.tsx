import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { useReminderSettings } from "../lib/useReminderSettings";
import { ReminderFields } from "./ReminderFields";

// The whole reminder block of the settings screen: a labelled row with an
// on/off control, and the fields panel once it is on.
//
// Deliberately NOT built on RepeatPill, which the routine and staged-task
// sheets use. That component is a standalone pill with a hardcoded ↻ and is
// shaped for a bottom-sheet form; this screen's idiom is a label on the left
// with its control on the right, the way the routine-weight row already reads.
export function ReminderSection() {
  const c = useColors();
  const reminder = useReminderSettings();
  const { draft, ready, update } = reminder;

  const s = StyleSheet.create({
    wrap:     { padding: 14 },
    row:      { flexDirection: "row", alignItems: "center",
                justifyContent: "space-between" },
    lbl:      { fontSize: 14, fontWeight: "500", color: c.t1 },
    hint:     { fontSize: 12, color: c.t3, marginTop: 2 },
    toggle:   { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radii.full,
                borderWidth: 1, borderColor: c.bd2 },
    toggleOn: { borderColor: c.prim, backgroundColor: c.accBg },
    toggleTxt:   { fontSize: 12, fontWeight: "600", color: c.t2 },
    toggleTxtOn: { color: c.tacc },
  });

  return (
    <View style={s.wrap}>
      <View style={s.row}>
        <View>
          <Text style={s.lbl}>Check-in reminder</Text>
          <Text style={s.hint}>A nudge to open Cadence — not tied to any task</Text>
        </View>
        <TouchableOpacity
          // Disabled until the saved settings have loaded, so the first tap
          // cannot persist a default over a value still in flight.
          disabled={!ready}
          onPress={() => update({ enabled: !draft.enabled })}
          style={[s.toggle, draft.enabled && s.toggleOn]}
        >
          <Text style={[s.toggleTxt, draft.enabled && s.toggleTxtOn]}>
            {draft.enabled ? "On" : "Off"}
          </Text>
        </TouchableOpacity>
      </View>

      {draft.enabled && <ReminderFields reminder={reminder} />}
    </View>
  );
}
