import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addDays, todayLocal } from "@cadence/shared";
import type { DateRange } from "@cadence/shared";
import { AppBar } from "../../components/AppBar";
import { RangePickerSheet } from "../../components/RangePickerSheet";
import { MomentumChart, DowHeatmap } from "../../components/ProductivityCharts";
import { RoutineComparisonChart, RoutineCompletionLines } from "../../components/RoutineInsightCharts";
import { TasksByDayChart, TaskBreakdownChart, CarryoverCard, OpenTasksTrendChart } from "../../components/TaskInsightCharts";
import { ChartCard } from "../../components/InsightShared";
import { getGranularity, granLabel } from "../../lib/insightUtils";
import { useColors } from "../../lib/theme";

export default function InsightsScreen() {
  const c = useColors();
  const today = todayLocal();
  const [range, setRange]           = useState<DateRange>(() => ({ from: addDays(today, -29), to: today }));
  const [rangeLabel, setRangeLabel] = useState("Last 30 days");
  const [pickerOpen, setPickerOpen] = useState(false);
  const g = getGranularity(range.from, range.to);

  const s = StyleSheet.create({
    screen:    { flex: 1, backgroundColor: c.bg },
    content:   { paddingHorizontal: 16, paddingBottom: 48 },
    hdr:       { paddingTop: 6, paddingBottom: 14 },
    hTitle:    { fontSize: 22, fontWeight: "700", color: c.t1, letterSpacing: -0.4 },
    hSub:      { fontSize: 13, color: c.t2, marginTop: 3 },
    rangeRow:  { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginBottom: 20 },
    rangeBtn:  { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8,
                 backgroundColor: c.card, borderWidth: 1, borderColor: c.bd2, borderRadius: 10 },
    rangeTxt:  { fontSize: 13, fontWeight: "600", color: c.t1 },
    rangeArrow:{ fontSize: 11, color: c.t3 },
  });

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <AppBar title="Insights" />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.hdr}>
          <Text style={s.hTitle}>Insights</Text>
          <Text style={s.hSub}>Patterns and trends across your routines and tasks</Text>
        </View>
        <View style={s.rangeRow}>
          <TouchableOpacity style={s.rangeBtn} onPress={() => setPickerOpen(true)} activeOpacity={0.7}>
            <Text style={{ fontSize: 14 }}>📅</Text>
            <Text style={s.rangeTxt}>{rangeLabel}</Text>
            <Text style={s.rangeArrow}>▾</Text>
          </TouchableOpacity>
        </View>

        <ChartCard title="Productivity momentum" label={g === "daily" ? "7-day EMA" : granLabel(g)}>
          <MomentumChart range={range} granularity={g} />
        </ChartCard>
        <ChartCard title="Day-of-week consistency">
          <DowHeatmap range={range} />
        </ChartCard>
        <ChartCard title="Routine comparison" label="completion %">
          <RoutineComparisonChart range={range} />
        </ChartCard>
        <ChartCard title="Routine completion rate" label={granLabel(g)}>
          <RoutineCompletionLines range={range} granularity={g} today={today} />
        </ChartCard>
        <ChartCard title="Tasks added per day" label={granLabel(g)}>
          <TasksByDayChart range={range} granularity={g} />
        </ChartCard>
        <ChartCard title="Task resolution breakdown">
          <TaskBreakdownChart range={range} />
        </ChartCard>
        <ChartCard title="Carryover distribution" label="completed tasks">
          <CarryoverCard range={range} />
        </ChartCard>
        <ChartCard title="Tasks still open, by creation date" label={granLabel(g)}>
          <OpenTasksTrendChart range={range} granularity={g} />
        </ChartCard>
      </ScrollView>

      <RangePickerSheet
        visible={pickerOpen} range={range} label={rangeLabel} today={today}
        onChange={(r, l) => { setRange(r); setRangeLabel(l); setPickerOpen(false); }}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
}
