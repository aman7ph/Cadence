import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatMinuteOfDay } from "@cadence/shared";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";

interface Props {
  startMinute: number;
  endMinute: number;
  onShift: (key: "startMinute" | "endMinute", dir: 1 | -1) => void;
}

/** "Between − 09:00 + and − 18:30 +" — the quiet-hours window. */
export function ReminderWindowFields({
  startMinute,
  endMinute,
  onShift,
}: Props) {
  const c = useColors();

  const s = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    lbl: { fontSize: 13, color: c.t2 },
    stepper: { flexDirection: "row", alignItems: "center", gap: 6 },
    adjBtn: {
      width: 26,
      height: 26,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: c.bd2,
      justifyContent: "center",
      alignItems: "center",
    },
    adjTxt: {
      fontSize: 15,
      color: c.t2,
      lineHeight: 19,
      includeFontPadding: false,
    },
    timeVal: {
      fontSize: 13,
      fontWeight: "700",
      color: c.t1,
      minWidth: 44,
      textAlign: "center",
    },
  });

  const stepper = (key: "startMinute" | "endMinute", value: number) => (
    <View style={s.stepper}>
      <TouchableOpacity
        onPress={() => onShift(key, -1)}
        hitSlop={8}
        style={s.adjBtn}
      >
        <Text style={s.adjTxt}>−</Text>
      </TouchableOpacity>
      <Text style={s.timeVal}>{formatMinuteOfDay(value)}</Text>
      <TouchableOpacity
        onPress={() => onShift(key, 1)}
        hitSlop={8}
        style={s.adjBtn}
      >
        <Text style={s.adjTxt}>+</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.row}>
      <Text style={s.lbl}>Between</Text>
      {stepper("startMinute", startMinute)}
      <Text style={s.lbl}>and</Text>
      {stepper("endMinute", endMinute)}
    </View>
  );
}
