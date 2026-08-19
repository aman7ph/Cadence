import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatMonthYear } from "@cadence/shared";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";

interface Props {
  viewMonth: string;
  currentMonth: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

/** `‹  August 2026  ›` plus the Today escape hatch, shown only off-month. */
export function HistoryMonthNav({
  viewMonth,
  currentMonth,
  onPrev,
  onNext,
  onToday,
}: Props) {
  const c = useColors();
  const atCurrent = viewMonth >= currentMonth;

  const s = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    btn: {
      width: 28,
      height: 28,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: c.bd1,
      backgroundColor: c.card,
      alignItems: "center",
      justifyContent: "center",
    },
    btnTxt: { fontSize: 15, color: c.t1, fontWeight: "500" },
    month: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: c.t1,
      textAlign: "center",
    },
    todayBtn: { paddingHorizontal: 10, paddingVertical: 6 },
    todayTxt: {
      fontSize: 12,
      fontWeight: "600",
      color: c.t3,
      textDecorationLine: "underline",
    },
  });

  return (
    <View style={s.row}>
      <TouchableOpacity style={s.btn} onPress={onPrev} activeOpacity={0.7}>
        <Text style={s.btnTxt}>‹</Text>
      </TouchableOpacity>
      <Text style={s.month}>{formatMonthYear(viewMonth + "-01")}</Text>
      <TouchableOpacity
        style={s.btn}
        onPress={onNext}
        disabled={atCurrent}
        activeOpacity={0.7}
      >
        <Text style={[s.btnTxt, atCurrent && { opacity: 0.25 }]}>›</Text>
      </TouchableOpacity>
      {viewMonth !== currentMonth && (
        <TouchableOpacity
          style={s.todayBtn}
          onPress={onToday}
          activeOpacity={0.7}
        >
          <Text style={s.todayTxt}>Today</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
