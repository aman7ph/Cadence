import { useMutation, useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { DEFAULT_ROUTINE_WEIGHT } from "@cadence/shared";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";

/**
 * `Routine weight  −  60%  +` — how much routines count toward the day's score.
 *
 * Lives on the Today tile and in Settings. Both hand-rolled it, including the
 * ±5 step and the 0–100 clamp; the two sizes are a real difference (one sits
 * inside a stat card) so they are a prop rather than a second component.
 */
export function RoutineWeightControl({
  size = "default",
}: {
  size?: "compact" | "default";
}) {
  const c = useColors();
  const me = useQuery(api.users.getMe);
  const setWeight = useMutation(api.users.setRoutineWeight);

  const pct = Math.round((me?.routineWeight ?? DEFAULT_ROUTINE_WEIGHT) * 100);
  const adjust = (dir: 1 | -1) =>
    void setWeight({
      routineWeight: Math.min(100, Math.max(0, pct + dir * 5)) / 100,
    });

  const small = size === "compact";

  const s = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      ...(small
        ? {
            marginTop: 6,
            borderTopWidth: 1,
            borderTopColor: c.bd1,
            paddingTop: 6,
          }
        : { padding: 14 }),
    },
    lbl: small
      ? { fontSize: 10, color: c.t3 }
      : { fontSize: 14, fontWeight: "500" as const, color: c.t1 },
    ctrl: { flexDirection: "row", alignItems: "center", gap: small ? 6 : 10 },
    btn: {
      width: small ? 20 : 28,
      height: small ? 20 : 28,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: c.bd2,
      justifyContent: "center",
      alignItems: "center",
    },
    btnTxt: {
      fontSize: small ? 14 : 16,
      color: c.t2,
      lineHeight: small ? 18 : 20,
      includeFontPadding: false,
    },
    val: {
      fontSize: small ? 11 : 14,
      fontWeight: "700",
      color: c.t1,
      minWidth: small ? 30 : 40,
      textAlign: "center",
    },
  });

  return (
    <View style={s.row}>
      <Text style={s.lbl}>Routine weight</Text>
      <View style={s.ctrl}>
        <TouchableOpacity onPress={() => adjust(-1)} hitSlop={8} style={s.btn}>
          <Text style={s.btnTxt}>−</Text>
        </TouchableOpacity>
        <Text style={s.val}>{pct}%</Text>
        <TouchableOpacity onPress={() => adjust(1)} hitSlop={8} style={s.btn}>
          <Text style={s.btnTxt}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
