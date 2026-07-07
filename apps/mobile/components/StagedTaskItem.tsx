import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import * as Haptics from "expo-haptics";
import { useColors } from "../lib/theme";
import { fmtShort, fmtTimestamp } from "../lib/dateUtils";
import { ActionSheet } from "./ActionSheet";
import type { ActionItem } from "./ActionSheet";
import { scheduleLabel } from "./SchedulePicker";

export interface StagedTaskData {
  _id: Id<"stagedTasks">;
  title: string;
  description?: string;
  createdAt: number;
  scheduledDate?: string;
  targetType?: "task" | "routine";
  routineScheduleType?: "daily" | "weekdays" | "custom";
  routineCustomDays?: number[];
  goalId?: Id<"goals">;
  goalContribution?: number;
}

interface Props {
  stagedTask: StagedTaskData;
  goalTitle?: string;
  onEdit: () => void;
  onSchedule?: () => void;
}

export function StagedTaskItem({ stagedTask, goalTitle, onEdit, onSchedule }: Props) {
  const c = useColors();
  const remove = useMutation(api.stagedTasks.remove);
  const unschedule = useMutation(api.stagedTaskScheduling.unschedule);
  const [menuOpen, setMenuOpen] = useState(false);

  const isScheduled = stagedTask.scheduledDate !== undefined;
  const meta = stagedTask.description?.trim() || `Added ${fmtTimestamp(stagedTask.createdAt)}`;
  const destLabel = stagedTask.targetType === "routine"
    ? `Routine · ${scheduleLabel(stagedTask.routineScheduleType ?? "daily", stagedTask.routineCustomDays)}`
    : "Task";

  const menuActions: ActionItem[] = [
    ...(onSchedule ? [{ label: isScheduled ? "Edit schedule…" : "Schedule…", onPress: onSchedule }] : []),
    isScheduled
      ? {
          label: "Unschedule",
          onPress: () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            void unschedule({ stagedTaskId: stagedTask._id });
          },
        }
      : { label: "Edit", onPress: onEdit },
    {
      label: "Delete",
      style: "destructive" as const,
      onPress: () => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        void remove({ stagedTaskId: stagedTask._id });
      },
    },
  ];

  const s = StyleSheet.create({
    card:     { flexDirection: "row", alignItems: "flex-start", gap: 10,
                backgroundColor: c.card, borderWidth: 1, borderColor: c.bd1,
                borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 8 },
    body:     { flex: 1, gap: 2 },
    title:    { fontSize: 14, fontWeight: "600", color: c.t1 },
    meta:     { fontSize: 12, color: c.t3 },
    goalPill: { alignSelf: "flex-start", backgroundColor: c.accBg,
                borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, marginTop: 2 },
    goalTxt:  { fontSize: 10, fontWeight: "600", color: c.tacc },
    right:    { flexDirection: "row", alignItems: "flex-start", gap: 6, paddingTop: 1 },
    destBadge:    { backgroundColor: c.accBg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, maxWidth: 130 },
    destBadgeTxt: { fontSize: 10, fontWeight: "700", color: c.tacc },
    dateBadge:    { backgroundColor: c.active, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    dateBadgeTxt: { fontSize: 10, color: c.t3 },
    more:     { fontSize: 16, color: c.t3, letterSpacing: 1 },
  });

  return (
    <View style={s.card}>
      <View style={s.body}>
        <Text style={s.title} numberOfLines={2}>{stagedTask.title}</Text>
        <Text style={s.meta} numberOfLines={1}>{meta}</Text>
        {goalTitle && (
          <View style={s.goalPill}><Text style={s.goalTxt} numberOfLines={1}>{goalTitle}</Text></View>
        )}
      </View>
      <View style={s.right}>
        {isScheduled && (
          <>
            <View style={s.destBadge}>
              <Text style={s.destBadgeTxt} numberOfLines={1}>{destLabel}</Text>
            </View>
            <View style={s.dateBadge}>
              <Text style={s.dateBadgeTxt}>{fmtShort(stagedTask.scheduledDate!)}</Text>
            </View>
          </>
        )}
        <TouchableOpacity onPress={() => setMenuOpen(true)} hitSlop={8}>
          <Text style={s.more}>···</Text>
        </TouchableOpacity>
      </View>
      <ActionSheet visible={menuOpen} title={stagedTask.title} actions={menuActions} onCancel={() => setMenuOpen(false)} />
    </View>
  );
}
