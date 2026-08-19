import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatCountdown } from "@cadence/shared";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";

interface Props {
  doneToday: number;
  target: number;
  remaining: number;
  onUndo: () => void;
  readOnly?: boolean;
}

// Progress + live countdown + undo for a repeat task or routine. The rep
// action itself is the row's main toggle; this is status, matching web.
export function RepeatControl({
  doneToday,
  target,
  remaining,
  onUndo,
  readOnly,
}: Props) {
  const c = useColors();
  const complete = doneToday >= target;

  const s = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 6 },
    badge: {
      backgroundColor: c.accBg,
      borderRadius: radii.full,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    badgeDone: { backgroundColor: c.successBg },
    badgeTxt: { fontSize: 10, fontWeight: "700", color: c.tacc },
    badgeTxtDone: { color: c.cplt },
    wait: {
      backgroundColor: c.active,
      borderRadius: radii.full,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    waitTxt: { fontSize: 10, fontWeight: "600", color: c.t3 },
    undo: { fontSize: 14, color: c.t3, paddingHorizontal: 2 },
  });

  return (
    <View style={s.row}>
      <View style={[s.badge, complete && s.badgeDone]}>
        <Text style={[s.badgeTxt, complete && s.badgeTxtDone]}>
          {doneToday}/{target}
        </Text>
      </View>
      {remaining > 0 && (
        <View style={s.wait}>
          <Text style={s.waitTxt}>{formatCountdown(remaining)}</Text>
        </View>
      )}
      {!readOnly && doneToday > 0 && (
        <TouchableOpacity
          onPress={onUndo}
          hitSlop={8}
          accessibilityLabel="Undo the last check-in"
        >
          <Text style={s.undo}>↺</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
