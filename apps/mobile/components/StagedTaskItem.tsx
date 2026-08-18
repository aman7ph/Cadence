import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import * as Haptics from "expo-haptics";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { fmtShort, fmtTimestamp } from "../lib/dateUtils";
import { ActionSheet } from "./ActionSheet";
import type { ActionItem } from "./ActionSheet";
import { scheduleLabel } from "./SchedulePicker";
import { ConfirmSheet } from "./ui/ConfirmSheet";

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
  repeatTarget?: number;
  repeatIntervalMinutes?: number;
}

interface Props {
  stagedTask: StagedTaskData;
  goalTitle?: string;
  onSchedule?: () => void;
}

export function StagedTaskItem({ stagedTask, goalTitle, onSchedule }: Props) {
  const c = useColors();
  const remove = useMutation(api.stagedTasks.remove);
  const unschedule = useMutation(api.stagedTaskScheduling.unschedule);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<"delete" | "unschedule" | null>(null);

  const isScheduled = stagedTask.scheduledDate !== undefined;
  const meta = stagedTask.description?.trim() || `Added ${fmtTimestamp(stagedTask.createdAt)}`;
  const destLabel = stagedTask.targetType === "routine"
    ? `Routine · ${scheduleLabel(stagedTask.routineScheduleType ?? "daily", stagedTask.routineCustomDays)}`
    : "Task";

  const menuActions: ActionItem[] = [
    ...(onSchedule ? [{ label: isScheduled ? "Edit schedule…" : "Schedule…", onPress: onSchedule }] : []),
    ...(isScheduled
      ? [{ label: "Unschedule", onPress: () => setConfirm("unschedule") }]
      : []),
    {
      label: "Delete",
      style: "destructive" as const,
      onPress: () => setConfirm("delete"),
    },
  ];

  const s = StyleSheet.create({
    card:     { flexDirection: "row", alignItems: "flex-start", gap: 10,
                backgroundColor: c.card, borderWidth: 1, borderColor: c.bd1,
                borderRadius: radii.sm, paddingHorizontal: 13, paddingVertical: 11 },
    body:     { flex: 1, gap: 2 },
    title:    { fontSize: 13.5, fontWeight: "600", color: c.t1 },
    meta:     { fontSize: 10.5, color: c.t2 },
    goalPill: { alignSelf: "flex-start", backgroundColor: c.accBg,
                borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
    goalTxt:  { fontSize: 9, fontWeight: "600", color: c.tacc, letterSpacing: 0.27 },
    right:    { flexDirection: "row", alignItems: "flex-start", gap: 6, paddingTop: 1 },
    destBadge:    { backgroundColor: c.accBg, borderRadius: radii.pill, paddingHorizontal: 6, paddingVertical: 2, maxWidth: 130 },
    destBadgeTxt: { fontSize: 10, fontWeight: "700", color: c.tacc },
    dateBadge:    { backgroundColor: c.active, borderRadius: radii.pill, paddingHorizontal: 6, paddingVertical: 2 },
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

      {/* Copy matches web's staged-task-row drawers. Unschedule is reversible,
          so it takes the accent tone; only delete is danger. */}
      <ConfirmSheet
        visible={confirm === "unschedule"}
        onCancel={() => setConfirm(null)}
        title="Unschedule this task?"
        description="It returns to Unscheduled and keeps its details. You can schedule it again at any time."
        confirmLabel="Unschedule"
        tone="accent"
        onConfirm={async () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          await unschedule({ stagedTaskId: stagedTask._id });
        }}
      />
      <ConfirmSheet
        visible={confirm === "delete"}
        onCancel={() => setConfirm(null)}
        title="Delete this staged task?"
        description="This cannot be undone."
        confirmLabel="Delete task"
        tone="danger"
        onConfirm={async () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          await remove({ stagedTaskId: stagedTask._id });
        }}
      >
        <Text style={{ fontSize: 13, color: c.t1 }}>{stagedTask.title}</Text>
      </ConfirmSheet>
    </View>
  );
}
