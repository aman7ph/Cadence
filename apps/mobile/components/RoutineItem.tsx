import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { todayLocal } from "@cadence/shared";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import * as Haptics from "expo-haptics";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { useRepeatRow } from "../lib/useRepeatRow";
import { ActionSheet } from "./ActionSheet";
import { RepeatControl } from "./RepeatControl";
import { StreakPill } from "./StreakPill";
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
  repeatTarget?: number;
  repeatDoneToday?: number;
  nextRepAllowedAt?: number;
}

interface Props { routine: Routine; date: string; readOnly?: boolean }

export function RoutineItem({ routine, date, readOnly }: Props) {
  const c = useColors();
  const complete   = useMutation(api.routines.complete);
  const uncomplete = useMutation(api.routines.uncomplete);
  const skip       = useMutation(api.routines.skip);
  const archive    = useMutation(api.routineManagement.archive);
  const logRep     = useMutation(api.routineRepeats.logRep);
  const undoRep    = useMutation(api.routineRepeats.undoRep);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isRepeat, remaining, gated, error, clearError, fail } =
    useRepeatRow(routine.repeatTarget, routine.nextRepAllowedAt);

  const done      = routine.status === "completed";
  const skipped   = routine.status === "skipped";
  const doneToday = routine.repeatDoneToday ?? 0;
  const meta      = routine.description?.trim() || scheduleLabel(routine.scheduleType as ScheduleType, routine.customDays);

  const toggle = () => {
    if (readOnly) return;
    clearError();
    const today = todayLocal();
    if (isRepeat) {
      if (done || gated) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void logRep({ routineId: routine.routineId, date, today }).catch(fail);
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    done
      ? uncomplete({ routineId: routine.routineId, date, today })
      : complete({ routineId: routine.routineId, date, today });
  };

  const menuActions = [
    { label: skipped ? "Un-skip" : "Skip today", onPress: () => {
      const today = todayLocal();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      skipped ? uncomplete({ routineId: routine.routineId, date, today })
              : skip({ routineId: routine.routineId, date, today });
    } },
    { label: "Archive", style: "destructive" as const, onPress: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      archive({ routineId: routine.routineId, today: todayLocal() });
    } },
  ];

  const s = StyleSheet.create({
    card:          { flexDirection: "row", alignItems: "center", gap: 10,
                     backgroundColor: c.card, borderWidth: 1, borderColor: c.bd1,
                     borderRadius: radii.sm, padding: 12 },
    dim:           { opacity: 0.55 },
    toggle:        { padding: 2 },
    circle:        { width: 22, height: 22, borderRadius: radii.full, borderWidth: 1.5,
                     borderColor: c.bd3, justifyContent: "center", alignItems: "center" },
    circleDone:    { backgroundColor: c.cplt, borderColor: c.cplt },
    circleSkip:    { borderColor: c.t3 },
    checkTxt:      { color: c.onPrim, fontSize: 11, fontWeight: "700" },
    skipBar:       { width: 10, height: 1.5, borderRadius: 1, backgroundColor: c.t3 },
    body:          { flex: 1, gap: 2 },
    name:          { fontSize: 14, fontWeight: "600", color: c.t1 },
    strike:        { textDecorationLine: "line-through", color: c.t3 },
    meta:          { fontSize: 12, color: c.t3 },
    err:           { fontSize: 12, color: c.danger },
    goalPill:      { alignSelf: "flex-start", backgroundColor: c.accBg,
                     borderRadius: radii.pill, paddingHorizontal: 7, paddingVertical: 2, marginTop: 2 },
    goalTxt:       { fontSize: 10, fontWeight: "600", color: c.tacc },
    right:         { flexDirection: "row", alignItems: "center", gap: 6 },
    skipBadge:     { backgroundColor: c.active, borderRadius: radii.pill, paddingHorizontal: 6, paddingVertical: 2 },
    skipBadgeTxt:  { fontSize: 10, color: c.t3 },
    more:          { fontSize: 16, color: c.t3, letterSpacing: 1 },
  });

  return (
    <View style={[s.card, (done || skipped) && s.dim]}>
      <TouchableOpacity onPress={toggle} hitSlop={6} style={s.toggle} disabled={!!readOnly}>
        <View style={[s.circle, done && s.circleDone, skipped && s.circleSkip,
                      isRepeat && gated && { opacity: 0.4 }]}>
          {done    && <Text style={s.checkTxt}>✓</Text>}
          {skipped && <View style={s.skipBar} />}
        </View>
      </TouchableOpacity>
      <View style={s.body}>
        <Text style={[s.name, done && s.strike]} numberOfLines={1}>{routine.name}</Text>
        <Text style={s.meta} numberOfLines={1}>{meta}</Text>
        {error && <Text style={s.err} numberOfLines={2}>{error}</Text>}
        {routine.goalTitle && (
          <View style={s.goalPill}><Text style={s.goalTxt} numberOfLines={1}>{routine.goalTitle}</Text></View>
        )}
      </View>
      <View style={s.right}>
        {isRepeat && (
          <RepeatControl
            doneToday={doneToday}
            target={routine.repeatTarget!}
            remaining={remaining}
            readOnly={readOnly}
            onUndo={() => {
              clearError();
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              void undoRep({ routineId: routine.routineId, date, today: todayLocal() }).catch(fail);
            }}
          />
        )}
        <StreakPill count={routine.currentStreak} />
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
