import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { todayLocal } from "@cadence/shared";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import * as Haptics from "expo-haptics";
import { useColors } from "../lib/theme";
import { ActionSheet } from "./ActionSheet";
import { scheduleLabel, type ScheduleType } from "./SchedulePicker";

export interface Routine {
  routineId: Id<"routines">;
  name: string;
  description?: string;
  scheduleType: string;
  customDays?: number[];
  status: "pending" | "completed" | "skipped";
  currentStreak: number;
  longestStreak: number;
  goalTitle?: string;
}

interface Props { routine: Routine; date: string; readOnly?: boolean }

export function RoutineItem({ routine, date, readOnly }: Props) {
  const c = useColors();
  const complete   = useMutation(api.routines.complete);
  const uncomplete = useMutation(api.routines.uncomplete);
  const skip       = useMutation(api.routines.skip);
  const archive    = useMutation(api.routineManagement.archive);
  const [menuOpen, setMenuOpen] = useState(false);

  const done    = routine.status === "completed";
  const skipped = routine.status === "skipped";
  const meta    = routine.description?.trim() || scheduleLabel(routine.scheduleType as ScheduleType, routine.customDays);

  const toggle = () => {
    if (readOnly) return;
    const today = todayLocal();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    done
      ? uncomplete({ routineId: routine.routineId, date, today })
      : complete({ routineId: routine.routineId, date, today });
  };

  const menuActions = [
    {
      label: skipped ? "Un-skip" : "Skip today",
      onPress: () => {
        const today = todayLocal();
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        skipped
          ? uncomplete({ routineId: routine.routineId, date, today })
          : skip({ routineId: routine.routineId, date, today });
      },
    },
    {
      label: "Archive",
      style: "destructive" as const,
      onPress: () => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        archive({ routineId: routine.routineId, today: todayLocal() });
      },
    },
  ];

  const s = StyleSheet.create({
    card:          { flexDirection: "row", alignItems: "center", gap: 10,
                     backgroundColor: c.card, borderWidth: 1, borderColor: c.bd1,
                     borderRadius: 12, padding: 12 },
    dim:           { opacity: 0.55 },
    toggle:        { padding: 2 },
    circle:        { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5,
                     borderColor: c.bd3, justifyContent: "center", alignItems: "center" },
    circleDone:    { backgroundColor: c.cplt, borderColor: c.cplt },
    circleSkip:    { borderColor: c.t3 },
    checkTxt:      { color: "#fff", fontSize: 11, fontWeight: "700" },
    skipBar:       { width: 10, height: 1.5, borderRadius: 1, backgroundColor: c.t3 },
    body:          { flex: 1, gap: 2 },
    name:          { fontSize: 14, fontWeight: "600", color: c.t1 },
    strike:        { textDecorationLine: "line-through", color: c.t3 },
    meta:          { fontSize: 12, color: c.t3 },
    goalPill:      { alignSelf: "flex-start", backgroundColor: c.accBg,
                     borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, marginTop: 2 },
    goalTxt:       { fontSize: 10, fontWeight: "600", color: c.tacc },
    right:         { flexDirection: "row", alignItems: "center", gap: 6 },
    streak:        { flexDirection: "row", alignItems: "baseline", gap: 1,
                     backgroundColor: "rgba(43,168,74,0.18)", borderRadius: 999,
                     paddingHorizontal: 8, paddingVertical: 3 },
    streakNum:     { fontSize: 12, fontWeight: "700", color: c.cplt },
    streakUnit:    { fontSize: 10, fontWeight: "600", color: c.cplt },
    streakCold:    { backgroundColor: c.active },
    streakNumCold: { color: c.t3 },
    skipBadge:     { backgroundColor: c.active, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
    skipBadgeTxt:  { fontSize: 10, color: c.t3 },
    more:          { fontSize: 16, color: c.t3, letterSpacing: 1 },
  });

  return (
    <View style={[s.card, (done || skipped) && s.dim]}>
      <TouchableOpacity onPress={toggle} hitSlop={6} style={s.toggle} disabled={!!readOnly}>
        <View style={[s.circle, done && s.circleDone, skipped && s.circleSkip]}>
          {done    && <Text style={s.checkTxt}>✓</Text>}
          {skipped && <View style={s.skipBar} />}
        </View>
      </TouchableOpacity>
      <View style={s.body}>
        <Text style={[s.name, done && s.strike]} numberOfLines={1}>{routine.name}</Text>
        <Text style={s.meta} numberOfLines={1}>{meta}</Text>
        {routine.goalTitle && (
          <View style={s.goalPill}><Text style={s.goalTxt} numberOfLines={1}>{routine.goalTitle}</Text></View>
        )}
      </View>
      <View style={s.right}>
        <View style={[s.streak, routine.currentStreak === 0 && s.streakCold]}>
          <Text style={[s.streakNum, routine.currentStreak === 0 && s.streakNumCold]}>{routine.currentStreak}</Text>
          <Text style={[s.streakUnit, routine.currentStreak === 0 && s.streakNumCold]}>d</Text>
        </View>
        {skipped && <View style={s.skipBadge}><Text style={s.skipBadgeTxt}>Skipped</Text></View>}
        {!readOnly && (
          <TouchableOpacity onPress={() => setMenuOpen(true)} hitSlop={8}>
            <Text style={s.more}>···</Text>
          </TouchableOpacity>
        )}
      </View>
      <ActionSheet visible={menuOpen} title={routine.name} actions={menuActions} onCancel={() => setMenuOpen(false)} />
    </View>
  );
}
