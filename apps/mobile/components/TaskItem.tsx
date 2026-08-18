import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import * as Haptics from "expo-haptics";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { fmtShort } from "../lib/dateUtils";
import { useRepeatRow } from "../lib/useRepeatRow";
import { ActionSheet } from "./ActionSheet";
import { RepeatControl } from "./RepeatControl";

export interface Task {
  taskId: Id<"dailyTasks">;
  title: string;
  description?: string;
  status: string;
  isCarriedOver: boolean;
  originalDate: string;
  carryoverCount: number;
  goalTitle?: string;
  repeatTarget?: number;
  repeatDoneToday?: number;
  nextRepAllowedAt?: number;
}

interface Props { task: Task; viewedDate: string; readOnly?: boolean }

export function TaskItem({ task, viewedDate, readOnly }: Props) {
  const c = useColors();
  const complete   = useMutation(api.dailyTasks.complete);
  const uncomplete = useMutation(api.dailyTasks.uncomplete);
  const remove     = useMutation(api.dailyTasks.remove);
  const logRep     = useMutation(api.dailyTaskRepeats.logRep);
  const undoRep    = useMutation(api.dailyTaskRepeats.undoRep);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isRepeat, remaining, gated, error, clearError, fail } =
    useRepeatRow(task.repeatTarget, task.nextRepAllowedAt);

  const done      = task.status === "completed";
  const doneToday = task.repeatDoneToday ?? 0;
  const meta      = task.description?.trim()
    || (task.isCarriedOver ? `Original ${fmtShort(task.originalDate)}` : "Today");

  const toggle = () => {
    if (readOnly) return;
    clearError();
    if (isRepeat) {
      // A rejected tap gets a warning buzz rather than the "done" tick, so the
      // gate is felt even when the countdown badge is off-screen.
      if (task.status !== "open" || gated) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void logRep({ taskId: task.taskId, today: viewedDate }).catch(fail);
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    done
      ? uncomplete({ taskId: task.taskId })
      : complete({ taskId: task.taskId, today: viewedDate });
  };

  // dailyTasks.remove is the authority; hiding the menu only spares the common
  // case a guaranteed failure. doneToday is scoped to the viewed date, so reps
  // from an earlier day still reach the server — hence the .catch.
  const canDelete = task.status === "open" && doneToday === 0;
  const menuActions = [
    { label: "Delete", style: "destructive" as const, onPress: () => {
      clearError();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      void remove({ taskId: task.taskId }).catch(fail);
    } },
  ];

  const s = StyleSheet.create({
    card:            { flexDirection: "row", alignItems: "flex-start", gap: 10,
                       backgroundColor: c.card, borderWidth: 1, borderColor: c.bd1,
                       borderRadius: radii.sm, padding: 12 },
    dim:             { opacity: 0.55 },
    toggle:          { padding: 2, paddingTop: 1 },
    circle:          { width: 22, height: 22, borderRadius: radii.full, borderWidth: 1.5,
                       borderColor: c.bd3, justifyContent: "center", alignItems: "center" },
    circleDone:      { backgroundColor: c.cplt, borderColor: c.cplt },
    checkTxt:        { color: c.onPrim, fontSize: 11, fontWeight: "700" },
    body:            { flex: 1, gap: 2 },
    title:           { fontSize: 14, fontWeight: "600", color: c.t1 },
    strike:          { textDecorationLine: "line-through", color: c.t3 },
    meta:            { fontSize: 12, color: c.t3 },
    err:             { fontSize: 12, color: c.danger },
    goalPill:        { alignSelf: "flex-start", backgroundColor: c.accBg,
                       borderRadius: radii.pill, paddingHorizontal: 7, paddingVertical: 2, marginTop: 2 },
    goalTxt:         { fontSize: 10, fontWeight: "600", color: c.tacc },
    right:           { flexDirection: "row", alignItems: "flex-start", gap: 6, paddingTop: 1 },
    carryBadge:      { backgroundColor: c.accBg, borderRadius: radii.pill,
                       paddingHorizontal: 6, paddingVertical: 2 },
    carryTxt:        { fontSize: 10, fontWeight: "700", color: c.carry },
    more:            { fontSize: 16, color: c.t3, letterSpacing: 1 },
  });

  return (
    <View style={[s.card, done && s.dim]}>
      <TouchableOpacity onPress={toggle} hitSlop={6} style={s.toggle} disabled={!!readOnly}>
        <View style={[s.circle, done && s.circleDone, isRepeat && gated && { opacity: 0.4 }]}>
          {done && <Text style={s.checkTxt}>✓</Text>}
        </View>
      </TouchableOpacity>
      <View style={s.body}>
        <Text style={[s.title, done && s.strike]} numberOfLines={2}>{task.title}</Text>
        <Text style={s.meta} numberOfLines={1}>{meta}</Text>
        {error && <Text style={s.err} numberOfLines={2}>{error}</Text>}
        {task.goalTitle && (
          <View style={s.goalPill}><Text style={s.goalTxt} numberOfLines={1}>{task.goalTitle}</Text></View>
        )}
      </View>
      <View style={s.right}>
        {isRepeat && (
          <RepeatControl
            doneToday={doneToday}
            target={task.repeatTarget!}
            remaining={remaining}
            readOnly={readOnly}
            onUndo={() => {
              clearError();
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              void undoRep({ taskId: task.taskId, today: viewedDate }).catch(fail);
            }}
          />
        )}
        {task.isCarriedOver && !done && (
          <View style={s.carryBadge}><Text style={s.carryTxt}>×{task.carryoverCount} carried</Text></View>
        )}
        {!readOnly && canDelete && (
          <TouchableOpacity onPress={() => setMenuOpen(true)} hitSlop={8}>
            <Text style={s.more}>···</Text>
          </TouchableOpacity>
        )}
      </View>
      <ActionSheet visible={menuOpen} title={task.title} actions={menuActions} onCancel={() => setMenuOpen(false)} />
    </View>
  );
}
