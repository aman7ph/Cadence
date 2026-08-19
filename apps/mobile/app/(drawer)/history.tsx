import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import {
  daysInMonth,
  endOfMonth,
  firstWeekdayOfMonth,
  nextMonth,
  prevMonth,
  startOfMonth,
  todayLocal,
} from "@cadence/shared";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppBar } from "../../components/AppBar";
import { HistoryCalendar } from "../../components/HistoryCalendar";
import { HistoryDayModal } from "../../components/HistoryDayModal";
import { HistoryMonthNav } from "../../components/HistoryMonthNav";
import { useColors } from "../../lib/theme";

export default function HistoryScreen() {
  const c = useColors();

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

  // Changing month closes the day sheet: it belongs to a date that is no longer
  // on screen.
  const goMonth = (next: (m: string) => string) => {
    setViewMonth((m) => next(m));
    setModalDate(null);
  };

  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { paddingHorizontal: 16, paddingBottom: 40 },
    hdr: { paddingTop: 8, paddingBottom: 14 },
    hSub: { fontSize: 11.5, color: c.t2, marginTop: 3 },
  });

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <AppBar title="History" />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.hdr}>
          <Text style={s.hSub}>Tap any day to see its routines and tasks</Text>
        </View>

        <HistoryMonthNav
          viewMonth={viewMonth}
          currentMonth={currentMonth}
          onPrev={() => goMonth(prevMonth)}
          onNext={() => goMonth(nextMonth)}
          onToday={() => goMonth(() => currentMonth)}
        />

        <HistoryCalendar
          rows={rows}
          viewMonth={viewMonth}
          today={today}
          selected={modalDate}
          scoreMap={scoreMap}
          onSelect={setModalDate}
        />
      </ScrollView>

      <HistoryDayModal
        date={modalDate}
        today={today}
        onClose={() => setModalDate(null)}
      />
    </SafeAreaView>
  );
}
