import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import {
  daysInMonth,
  endOfMonth,
  firstWeekdayOfMonth,
  formatMonthYear,
  nextMonth,
  prevMonth,
  scoreToHeatBand,
  startOfMonth,
  todayLocal,
} from "@cadence/shared";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppBar } from "../../components/AppBar";
import { HistoryDayModal } from "../../components/HistoryDayModal";
import { useColors } from "../../lib/theme";
import { display } from "../../lib/fonts";
import { radii } from "../../lib/radii";

const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

// Both the band thresholds and the swatch colours used to be re-declared here,
// duplicating lib/insightUtils.ts and disagreeing with web's calendar. The
// bands now come from @cadence/shared and the colours from insightUtils, so
// each value is written down exactly once.

export default function HistoryScreen() {
  const c = useColors();
  const heat = [c.heat0, c.heat1, c.heat2, c.heat3, c.heat4];

  const today = todayLocal();
  const currentMonth = today.slice(0, 7);
  const yd = new Date(today + "T12:00:00");
  yd.setDate(yd.getDate() - 1);
  const yesterday = yd.toISOString().slice(0, 10);

  const [viewMonth, setViewMonth] = useState(yesterday.slice(0, 7));
  const [modalDate, setModalDate] = useState<string | null>(null);

  const statsRows = useQuery(api.analyticsProductivity.dayStatsRange, {
    from: startOfMonth(viewMonth + "-01"),
    to: endOfMonth(viewMonth + "-01"),
  });
  const scoreMap = new Map(
    (statsRows ?? []).map((r) => [r.date, r.productivityScore]),
  );

  const count = daysInMonth(viewMonth);
  const offset = (firstWeekdayOfMonth(viewMonth) + 6) % 7; // Mon-start grid
  const totalCells = Math.ceil((offset + count) / 7) * 7;
  const rows: (number | null)[][] = [];
  for (let i = 0; i < totalCells; i += 7) {
    rows.push(
      Array.from({ length: 7 }, (_, j) => {
        const d = i + j - offset + 1;
        return d >= 1 && d <= count ? d : null;
      }),
    );
  }

  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { paddingHorizontal: 16, paddingBottom: 40 },
    hdr: { paddingTop: 8, paddingBottom: 14 },
    hSub: { fontSize: 11.5, color: c.t2, marginTop: 3 },
    navRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    navBtn: {
      width: 28,
      height: 28,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: c.bd1,
      backgroundColor: c.card,
      alignItems: "center",
      justifyContent: "center",
    },
    navTxt: { fontSize: 15, color: c.t1, fontWeight: "500" },
    monthTxt: {
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
    cellDot: { width: 6, height: 6, borderRadius: radii.full, marginTop: 3 },
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
    <SafeAreaView style={s.screen} edges={["top"]}>
      <AppBar title="History" />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.hdr}>
          <Text style={s.hSub}>Tap any day to see its routines and tasks</Text>
        </View>

        {/* Month navigation */}
        <View style={s.navRow}>
          <TouchableOpacity
            style={s.navBtn}
            onPress={() => {
              setViewMonth((m) => prevMonth(m));
              setModalDate(null);
            }}
            activeOpacity={0.7}
          >
            <Text style={s.navTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={s.monthTxt}>{formatMonthYear(viewMonth + "-01")}</Text>
          <TouchableOpacity
            style={s.navBtn}
            onPress={() => {
              setViewMonth((m) => nextMonth(m));
              setModalDate(null);
            }}
            disabled={viewMonth >= currentMonth}
            activeOpacity={0.7}
          >
            <Text
              style={[s.navTxt, viewMonth >= currentMonth && { opacity: 0.25 }]}
            >
              ›
            </Text>
          </TouchableOpacity>
          {viewMonth !== currentMonth && (
            <TouchableOpacity
              style={s.todayBtn}
              onPress={() => {
                setViewMonth(currentMonth);
                setModalDate(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={s.todayTxt}>Today</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Heat legend */}
        <View style={s.legend}>
          <Text style={s.legendTxt}>Less</Text>
          {([0, 1, 2, 3, 4] as const).map((l) => (
            <View key={l} style={[s.legendDot, { backgroundColor: heat[l] }]} />
          ))}
          <Text style={s.legendTxt}>More</Text>
        </View>

        {/* Day-of-week header */}
        <View style={s.dowRow}>
          {DOW.map((d) => (
            <View key={d} style={s.dowCell}>
              <Text style={s.dowTxt}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar rows */}
        {rows.map((row, ri) => (
          <View key={ri} style={s.calRow}>
            {row.map((dayNum, di) => {
              if (!dayNum) return <View key={di} style={s.cell} />;
              const dd = String(dayNum).padStart(2, "0");
              const date = `${viewMonth}-${dd}`;
              const isFuture = date > today;
              const isToday = date === today;
              const isSel = date === modalDate;
              const heatLvl = scoreToHeatBand(scoreMap.get(date));
              return (
                <TouchableOpacity
                  key={di}
                  style={[
                    s.cell,
                    isSel && s.cellSel,
                    isFuture && { opacity: 0.25 },
                  ]}
                  onPress={() => !isFuture && setModalDate(date)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.cellNum, (isToday || isSel) && s.cellNumAcc]}>
                    {dayNum}
                  </Text>
                  <View
                    style={[s.cellDot, { backgroundColor: heat[heatLvl] }]}
                  />
                  {isToday && <View style={s.todayBar} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <HistoryDayModal
        date={modalDate}
        today={today}
        onClose={() => setModalDate(null)}
      />
    </SafeAreaView>
  );
}
