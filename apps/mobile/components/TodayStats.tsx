import { StyleSheet, Text, View } from "react-native";
import { ProductivityTile } from "./ProductivityTile";
import { useColors } from "../lib/theme";

export interface TodayStatsProps {
  done: number;
  total: number;
  bestStreak: number;
  bestStreakName?: string;
  score: number;
  scoreDelta?: number;
  rate30?: number;
  dayStatsLength?: number;
  routineWeight: number;
  isPast?: boolean;
}

function Card({ label, val, unit, delta, up }: {
  label: string; val: string; unit?: string; delta?: string; up?: boolean;
}) {
  const c = useColors();
  const s = StyleSheet.create({
    card:    { flex: 1, backgroundColor: c.card, borderWidth: 1, borderColor: c.bd1,
               borderRadius: 14, padding: 11 },
    lbl:     { fontSize: 10, fontWeight: "700", textTransform: "uppercase",
               letterSpacing: 0.6, color: c.t2, marginBottom: 3 },
    val:     { fontSize: 21, fontWeight: "700", letterSpacing: -0.5, color: c.t1, lineHeight: 24 },
    unit:    { fontSize: 12, fontWeight: "500", color: c.t2 },
    delta:   { fontSize: 11, color: c.t3, marginTop: 2 },
    deltaUp: { color: c.cplt },
  });
  return (
    <View style={s.card}>
      <Text style={s.lbl}>{label}</Text>
      <Text style={s.val}>{val}{unit ? <Text style={s.unit}> {unit}</Text> : null}</Text>
      {delta ? <Text style={[s.delta, up === true && s.deltaUp]}>{delta}</Text> : null}
    </View>
  );
}

export function TodayStats({
  done, total, bestStreak, bestStreakName,
  score, scoreDelta, rate30,
  dayStatsLength, routineWeight, isPast,
}: TodayStatsProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const streakUnit = bestStreak === 1 ? "day" : "days";
  const rate30Delta = dayStatsLength === undefined
    ? "Loading…"
    : dayStatsLength === 0
    ? "Awaiting activity"
    : `${dayStatsLength} day${dayStatsLength === 1 ? "" : "s"} tracked`;

  return (
    <View style={wrap.r}>
      <View style={wrap.row}>
        <Card label="Day's progress" val={`${pct}`} unit="%"
          delta={total > 0 ? `${done} of ${total} done` : "Nothing yet"} />
        <Card label="Best streak" val={`${bestStreak}`} unit={streakUnit}
          delta={bestStreakName ?? (bestStreak === 0 ? "No streaks yet" : undefined)}
          up={bestStreak > 0} />
      </View>
      <View style={wrap.row}>
        <ProductivityTile score={score} routineWeight={routineWeight} delta={scoreDelta} isPast={isPast} />
        <Card label="30-day rate" val={rate30 != null ? `${rate30}` : "—"}
          unit={rate30 != null ? "%" : undefined} delta={rate30Delta}
          up={rate30 != null && rate30 >= 75} />
      </View>
    </View>
  );
}

const wrap = StyleSheet.create({
  r:   { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 8 },
  row: { flexDirection: "row", gap: 8 },
});
