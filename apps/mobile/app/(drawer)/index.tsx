import { useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-expo";
import { api } from "@cadence/backend/convex/_generated/api";
import { todayLocal, addDays } from "@cadence/shared";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppBar } from "../../components/AppBar";
import { TodayHeader } from "../../components/TodayHeader";
import { TodayStats } from "../../components/TodayStats";
import { TodayRoutinesSection } from "../../components/TodayRoutinesSection";
import { TodayTasksSection } from "../../components/TodayTasksSection";
import { ReflectionCard } from "../../components/ReflectionCard";
import { useColors } from "../../lib/theme";
import { deriveTodayStats } from "../../lib/todayDerive";
import { display } from "../../lib/fonts";
import { radii } from "../../lib/radii";

const THIRTY = 30;

export default function Today() {
  const c = useColors();
  const today = todayLocal();
  const { user } = useUser();
  const [viewedDate, setViewedDate] = useState(today);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const me = useQuery(api.users.getMe);
  const allRoutines = useQuery(api.routines.list, { today });
  const day = useQuery(api.days.getDay, { date: viewedDate });
  const range = useQuery(api.analyticsProductivity.dayStatsRange, {
    from: addDays(today, -(THIRTY - 1)),
    to: today,
  });

  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    scroll: { flex: 1 },
    content: { paddingBottom: 48 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
  });

  if (day === undefined) {
    return (
      <SafeAreaView style={s.screen} edges={["top"]}>
        <AppBar />
        <View style={s.center}>
          <ActivityIndicator color={c.prim} />
        </View>
      </SafeAreaView>
    );
  }
  if (day === null) return null;

  const isPast = viewedDate < today;
  const firstName = user?.firstName ?? user?.username ?? "friend";
  const routines = day.routines ?? [];
  const allTasks = day.randomTasks ?? [];
  const stats = deriveTodayStats({
    routines,
    tasks: allTasks,
    allRoutines,
    range,
    viewedDate,
    routineWeight: me?.routineWeight,
  });

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <AppBar />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <TodayHeader
          viewedDate={viewedDate}
          today={today}
          isPast={isPast}
          firstName={firstName}
          onChangeDate={setViewedDate}
        />
        <TodayStats
          done={stats.rDone + stats.tDone}
          total={stats.countedTotal}
          bestStreak={stats.best.days}
          bestStreakName={stats.best.name}
          score={stats.score}
          scoreDelta={stats.scoreDelta}
          rate30={stats.rate30}
          dayStatsLength={range?.length}
          routineWeight={me?.routineWeight}
          isPast={isPast}
        />
        <TodayRoutinesSection
          routines={routines}
          date={viewedDate}
          isPast={isPast}
        />
        <TodayTasksSection
          tasks={allTasks}
          viewedDate={viewedDate}
          isPast={isPast}
        />
        <ReflectionCard
          date={viewedDate}
          reflection={day.reflection}
          routines={routines}
          tasks={allTasks}
          isPast={isPast}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
