import { useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-expo";
import { api } from "@cadence/backend/convex/_generated/api";
import { productivityScore, todayLocal, addDays } from "@cadence/shared";
import { fmtLong } from "../../lib/dateUtils";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppBar } from "../../components/AppBar";
import { DayNav } from "../../components/DayNav";
import { TodayStats } from "../../components/TodayStats";
import { TodayRoutinesSection } from "../../components/TodayRoutinesSection";
import { TodayTasksSection } from "../../components/TodayTasksSection";
import { ReflectionCard } from "../../components/ReflectionCard";
import { useColors } from "../../lib/theme";

const THIRTY = 30;

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}


export default function Today() {
  const c = useColors();
  const today = todayLocal();
  const { user } = useUser();
  const [viewedDate, setViewedDate] = useState(today);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 600); };

  const me    = useQuery(api.users.getMe);
  const day   = useQuery(api.days.getDay, { date: viewedDate });
  const range = useQuery(api.analyticsProductivity.dayStatsRange, {
    from: addDays(today, -(THIRTY - 1)), to: today,
  });

  const s = StyleSheet.create({
    screen:       { flex: 1, backgroundColor: c.bg },
    scroll:       { flex: 1 },
    content:      { paddingBottom: 48 },
    center:       { flex: 1, alignItems: "center", justifyContent: "center" },
    header:       { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
    greeting:     { fontSize: 21, fontWeight: "700", color: c.t1, letterSpacing: -0.4, marginBottom: 2 },
    date:         { fontSize: 12, color: c.t2 },
    dateHeading:  { fontSize: 19, fontWeight: "700", color: c.t1, letterSpacing: -0.3, marginBottom: 4 },
    pastBadge:    { alignSelf: "flex-start", backgroundColor: "rgba(224,161,0,0.14)",
                    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 2 },
    pastBadgeTxt: { fontSize: 11, fontWeight: "600", color: c.carry },
  });

  if (day === undefined) {
    return (
      <SafeAreaView style={s.screen} edges={["top"]}>
        <AppBar />
        <View style={s.center}><ActivityIndicator color={c.prim} /></View>
      </SafeAreaView>
    );
  }
  if (day === null) return null;

  const isPast = viewedDate < today;
  const firstName = user?.firstName ?? user?.username ?? "friend";
  const routines = day.routines ?? [];
  const allTasks = day.randomTasks ?? [];
  const rDone  = routines.filter((r) => r.status === "completed").length;
  const visible = allTasks.filter((t) => t.status !== "dismissed");
  const tDone  = visible.filter((t) => t.status === "completed").length;
  const tasksDismissed = allTasks.filter((t) => t.status === "dismissed").length;
  const bestR = routines.reduce<typeof routines[0] | null>(
    (best, r) => (!best || r.longestStreak > best.longestStreak) ? r : best, null,
  );
  const score = productivityScore(
    { routineCompleted: rDone, routineScheduled: routines.length,
      randomCompleted: tDone, randomTotal: tDone + visible.filter((t) => t.status === "open").length + tasksDismissed },
    me?.routineWeight,
  );
  const rate30 = range && range.length > 0
    ? Math.round(range.reduce((sum, r) => sum + r.productivityScore, 0) / range.length)
    : undefined;
  const yestRow = range?.find((r) => r.date === addDays(viewedDate, -1));
  const scoreDelta = yestRow ? Math.round(score - yestRow.productivityScore) : undefined;

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <AppBar />
      <ScrollView style={s.scroll} contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={s.header}>
          {isPast ? (
            <>
              <Text style={s.dateHeading}>{fmtLong(viewedDate)}</Text>
              <View style={s.pastBadge}><Text style={s.pastBadgeTxt}>Viewing past day</Text></View>
            </>
          ) : (
            <>
              <Text style={s.greeting}>{greeting()}, {firstName}</Text>
              <Text style={s.date}>{fmtLong(viewedDate)}</Text>
            </>
          )}
          <DayNav date={viewedDate} today={today}
            onPrev={() => setViewedDate((d) => addDays(d, -1))}
            onNext={() => setViewedDate((d) => addDays(d, 1))}
            onToday={() => setViewedDate(today)} />
        </View>
        <TodayStats done={rDone + tDone} total={routines.length + visible.length}
          bestStreak={bestR?.longestStreak ?? 0} bestStreakName={bestR?.name}
          score={score} scoreDelta={scoreDelta} rate30={rate30}
          dayStatsLength={range?.length} routineWeight={me?.routineWeight ?? 0.5} isPast={isPast} />
        <TodayRoutinesSection routines={routines} date={viewedDate} isPast={isPast} />
        <TodayTasksSection tasks={allTasks} viewedDate={viewedDate} isPast={isPast} />
        <ReflectionCard date={viewedDate} reflection={day.reflection}
          routines={routines} tasks={allTasks} isPast={isPast} />
      </ScrollView>
    </SafeAreaView>
  );
}
