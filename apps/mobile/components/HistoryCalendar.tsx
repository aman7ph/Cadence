import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { scoreToHeatBand } from "@cadence/shared";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";

const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

interface Props {
  /** Monday-start grid; `null` is a leading/trailing blank. */
  rows: (number | null)[][];
  viewMonth: string;
  today: string;
  selected: string | null;
  scoreMap: Map<string, number>;
  onSelect: (date: string) => void;
}

/**
 * The heat legend, the day-of-week header and the month grid.
 *
 * The band thresholds come from @cadence/shared and the swatch colours from the
 * token layer's `heat0..4`, so neither is written down here — both used to be
 * re-declared on this screen and disagreed with web's calendar.
 */
export function HistoryCalendar({
  rows,
  viewMonth,
  today,
  selected,
  scoreMap,
  onSelect,
}: Props) {
  const c = useColors();
  const heat = [c.heat0, c.heat1, c.heat2, c.heat3, c.heat4];

  const s = StyleSheet.create({
    legend: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginBottom: 14,
    },
    legendTxt: { fontSize: 10, color: c.t2 },
    legendDot: { width: 10, height: 10, borderRadius: radii.full },
    dowRow: { flexDirection: "row", marginBottom: 2 },
    dowCell: { flex: 1, alignItems: "center", paddingVertical: 4 },
    dowTxt: {
      fontSize: 10,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: c.t2,
    },
    calRow: { flexDirection: "row" },
    cell: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 8,
      borderRadius: radii.sm,
      position: "relative",
    },
    cellSel: { backgroundColor: c.accBg },
    cellNum: { fontSize: 13, fontWeight: "700", color: c.t1 },
    cellNumAcc: { color: c.tacc },
    cellDot: {
      width: 6,
      height: 6,
      borderRadius: radii.full,
      marginTop: 3,
    },
    todayBar: {
      position: "absolute",
      bottom: 3,
      width: 12,
      height: 2,
      borderRadius: 1,
      backgroundColor: c.tacc,
    },
  });

  return (
    <>
      <View style={s.legend}>
        <Text style={s.legendTxt}>Less</Text>
        {([0, 1, 2, 3, 4] as const).map((l) => (
          <View key={l} style={[s.legendDot, { backgroundColor: heat[l] }]} />
        ))}
        <Text style={s.legendTxt}>More</Text>
      </View>

      <View style={s.dowRow}>
        {DOW.map((d) => (
          <View key={d} style={s.dowCell}>
            <Text style={s.dowTxt}>{d}</Text>
          </View>
        ))}
      </View>

      {rows.map((row, ri) => (
        <View key={ri} style={s.calRow}>
          {row.map((dayNum, di) => {
            if (!dayNum) return <View key={di} style={s.cell} />;
            const date = `${viewMonth}-${String(dayNum).padStart(2, "0")}`;
            const isFuture = date > today;
            const isToday = date === today;
            const isSel = date === selected;
            const heatLvl = scoreToHeatBand(scoreMap.get(date));
            return (
              <TouchableOpacity
                key={di}
                style={[
                  s.cell,
                  isSel && s.cellSel,
                  isFuture && { opacity: 0.25 },
                ]}
                onPress={() => !isFuture && onSelect(date)}
                activeOpacity={0.75}
              >
                <Text style={[s.cellNum, (isToday || isSel) && s.cellNumAcc]}>
                  {dayNum}
                </Text>
                <View style={[s.cellDot, { backgroundColor: heat[heatLvl] }]} />
                {isToday && <View style={s.todayBar} />}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </>
  );
}
