import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { useColors } from "../lib/theme";
import { GoalTag } from "./ui/GoalTag";
import { radii } from "../lib/radii";
import { fmtShort, fmtTimestamp } from "../lib/dateUtils";
import { ActionSheet } from "./ActionSheet";
import type { ActionItem } from "./ActionSheet";
import { scheduleLabel } from "./SchedulePicker";
import { StagedTaskBadges } from "./StagedTaskBadges";
import { StagedTaskConfirms } from "./StagedTaskConfirms";
import type { StagedConfirm } from "./StagedTaskConfirms";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<StagedConfirm>(null);

  const isScheduled = stagedTask.scheduledDate !== undefined;
  const meta =
    stagedTask.description?.trim() ||
    `Added ${fmtTimestamp(stagedTask.createdAt)}`;
  const destLabel =
    stagedTask.targetType === "routine"
      ? `Routine · ${scheduleLabel(stagedTask.routineScheduleType ?? "daily", stagedTask.routineCustomDays)}`
      : "Task";

  const menuActions: ActionItem[] = [
    ...(onSchedule
      ? [
          {
            label: isScheduled ? "Edit schedule…" : "Schedule…",
            onPress: onSchedule,
          },
        ]
      : []),
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
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.bd1,
      borderRadius: radii.sm,
      paddingHorizontal: 13,
      paddingVertical: 11,
    },
    body: { flex: 1, gap: 2 },
    title: { fontSize: 13.5, fontWeight: "600", color: c.t1 },
    meta: { fontSize: 10.5, color: c.t2 },
    right: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      paddingTop: 1,
    },
    more: { fontSize: 16, color: c.t3, letterSpacing: 1 },
  });

  return (
    <View style={s.card}>
      <View style={s.body}>
        <Text style={s.title} numberOfLines={2}>
          {stagedTask.title}
        </Text>
        <Text style={s.meta} numberOfLines={1}>
          {meta}
        </Text>
        {goalTitle && <GoalTag>{goalTitle}</GoalTag>}
      </View>
      <View style={s.right}>
        {isScheduled && (
          <StagedTaskBadges
            destLabel={destLabel}
            scheduledDate={stagedTask.scheduledDate!}
          />
        )}
        <TouchableOpacity onPress={() => setMenuOpen(true)} hitSlop={8}>
          <Text style={s.more}>···</Text>
        </TouchableOpacity>
      </View>
      <ActionSheet
        visible={menuOpen}
        title={stagedTask.title}
        actions={menuActions}
        onCancel={() => setMenuOpen(false)}
      />

      <StagedTaskConfirms
        stagedTaskId={stagedTask._id}
        title={stagedTask.title}
        open={confirm}
        onClose={() => setConfirm(null)}
      />
    </View>
  );
}
