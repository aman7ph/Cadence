import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import * as Haptics from "expo-haptics";
import { useColors } from "../lib/theme";
import { fmtShort } from "../lib/dateUtils";
import { ActionSheet } from "./ActionSheet";

export interface Task {
  taskId: Id<"dailyTasks">;
  title: string;
  description?: string;
  status: string;
  isCarriedOver: boolean;
  originalDate: string;
  carryoverCount: number;
  goalTitle?: string;
}

interface Props { task: Task; viewedDate: string; readOnly?: boolean }

export function TaskItem({ task, viewedDate, readOnly }: Props) {
  const c = useColors();
  const complete   = useMutation(api.dailyTasks.complete);
  const uncomplete = useMutation(api.dailyTasks.uncomplete);
  const dismiss    = useMutation(api.dailyTasks.dismiss);
  const remove     = useMutation(api.dailyTasks.remove);
  const [menuOpen, setMenuOpen] = useState(false);

  const done      = task.status === "completed";
  const dismissed = task.status === "dismissed";
  const meta      = task.description?.trim()
    || (task.isCarriedOver ? `Original ${fmtShort(task.originalDate)}` : "Today");

  const toggle = () => {
    if (readOnly) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    done
      ? uncomplete({ taskId: task.taskId })
      : complete({ taskId: task.taskId, today: viewedDate });
  };

  const menuActions = [
    dismissed
      ? { label: "Restore", onPress: () => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); uncomplete({ taskId: task.taskId }); } }
      : { label: "Dismiss", onPress: () => { void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); dismiss({ taskId: task.taskId }); } },
    { label: "Delete", style: "destructive" as const, onPress: () => { void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); remove({ taskId: task.taskId }); } },
  ];

  const s = StyleSheet.create({
    card:            { flexDirection: "row", alignItems: "flex-start", gap: 10,
                       backgroundColor: c.card, borderWidth: 1, borderColor: c.bd1,
                       borderRadius: 12, padding: 12 },
    dim:             { opacity: 0.55 },
    toggle:          { padding: 2, paddingTop: 1 },
    circle:          { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5,
                       borderColor: c.bd3, justifyContent: "center", alignItems: "center" },
    circleDone:      { backgroundColor: c.cplt, borderColor: c.cplt },
    checkTxt:        { color: "#fff", fontSize: 11, fontWeight: "700" },
    body:            { flex: 1, gap: 2 },
    title:           { fontSize: 14, fontWeight: "600", color: c.t1 },
    strike:          { textDecorationLine: "line-through", color: c.t3 },
    meta:            { fontSize: 12, color: c.t3 },
    goalPill:        { alignSelf: "flex-start", backgroundColor: c.accBg,
                       borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, marginTop: 2 },
    goalTxt:         { fontSize: 10, fontWeight: "600", color: c.tacc },
    right:           { flexDirection: "row", alignItems: "flex-start", gap: 6, paddingTop: 1 },
    carryBadge:      { backgroundColor: "rgba(224,161,0,0.14)", borderRadius: 4,
                       paddingHorizontal: 6, paddingVertical: 2 },
    carryTxt:        { fontSize: 10, fontWeight: "700", color: c.carry },
    dismissBadge:    { backgroundColor: c.active, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    dismissBadgeTxt: { fontSize: 10, color: c.t3 },
    more:            { fontSize: 16, color: c.t3, letterSpacing: 1 },
  });

  return (
    <View style={[s.card, (done || dismissed) && s.dim]}>
      <TouchableOpacity onPress={toggle} hitSlop={6} style={s.toggle} disabled={!!readOnly}>
        <View style={[s.circle, done && s.circleDone]}>
          {done && <Text style={s.checkTxt}>✓</Text>}
        </View>
      </TouchableOpacity>
      <View style={s.body}>
        <Text style={[s.title, done && s.strike]} numberOfLines={2}>{task.title}</Text>
        <Text style={s.meta} numberOfLines={1}>{meta}</Text>
        {task.goalTitle && (
          <View style={s.goalPill}><Text style={s.goalTxt} numberOfLines={1}>{task.goalTitle}</Text></View>
        )}
      </View>
      <View style={s.right}>
        {task.isCarriedOver && !done && !dismissed && (
          <View style={s.carryBadge}><Text style={s.carryTxt}>×{task.carryoverCount} carried</Text></View>
        )}
        {dismissed && (
          <View style={s.dismissBadge}><Text style={s.dismissBadgeTxt}>Dismissed</Text></View>
        )}
        {!readOnly && (
          <TouchableOpacity onPress={() => setMenuOpen(true)} hitSlop={8}>
            <Text style={s.more}>···</Text>
          </TouchableOpacity>
        )}
      </View>
      <ActionSheet visible={menuOpen} title={task.title} actions={menuActions} onCancel={() => setMenuOpen(false)} />
    </View>
  );
}
