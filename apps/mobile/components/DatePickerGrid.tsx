import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

interface Props {
  rows: (number | null)[][];
  /** `YYYY-MM-DD` for a cell in the displayed month. */
  toDateStr: (day: number) => string;
  value: string;
  min?: string;
  max?: string;
  onPick: (date: string) => void;
}

/**
 * The month grid for the date picker.
 *
 * Deliberately NOT shared with `HistoryCalendar`: that one carries heat dots, a
 * today marker and future-dimming, and tints its selection, while this one
 * fills the selection and disables out-of-range days. Merging them would take
 * four boolean props, which is worse than two components.
 */
export function DatePickerGrid({
  rows,
  toDateStr,
  value,
  min,
  max,
  onPick,
}: Props) {
  const c = useColors();

  const s = StyleSheet.create({
    dayRow: { flexDirection: "row", paddingHorizontal: 12, marginBottom: 6 },
    dayLbl: {
      flex: 1,
      textAlign: "center",
      fontSize: 11,
      fontWeight: "600",
      color: c.t3,
      letterSpacing: 0.3,
    },
    row: { flexDirection: "row", paddingHorizontal: 12, marginBottom: 4 },
    cell: {
      flex: 1,
      height: 40,
      borderRadius: radii.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    cellSel: { backgroundColor: c.prim },
    cellTxt: { fontSize: 14, color: c.t1 },
    cellSelTxt: { fontSize: 14, color: c.onPrim, fontWeight: "700" },
    cellDim: { opacity: 0.22 },
  });

  return (
    <>
      <View style={s.dayRow}>
        {DAY_LABELS.map((d, i) => (
          <Text key={i} style={s.dayLbl}>
            {d}
          </Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={s.row}>
          {row.map((day, di) => {
            if (!day) return <View key={di} style={s.cell} />;
            const dateStr = toDateStr(day);
            const isSel = dateStr === value;
            const disabled =
              (min != null && dateStr < min) || (max != null && dateStr > max);
            return (
              <TouchableOpacity
                key={di}
                style={[s.cell, isSel && s.cellSel, disabled && s.cellDim]}
                activeOpacity={0.7}
                onPress={() => !disabled && onPick(dateStr)}
              >
                <Text style={isSel ? s.cellSelTxt : s.cellTxt}>{day}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </>
  );
}
