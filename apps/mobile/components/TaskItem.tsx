import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import * as Haptics from "expo-haptics";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { fmtShort } from "../lib/dateUtils";
import { useRepeatRow } from "../lib/useRepeatRow";
import { ActionSheet } from "./ActionSheet";
import { ConfirmSheet } from "./ui/ConfirmSheet";
import { CompletionCircle } from "./ui/CompletionCircle";
import { useTaskRowActions } from "../lib/useTaskRowActions";
import { Badge } from "./ui/Badge";
import { RowShell } from "./ui/RowShell";
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

interface Props {
  task: Task;
  viewedDate: string;
  readOnly?: boolean;
}

export function TaskItem({ task, viewedDate, readOnly }: Props) {
  const c = useColors();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isRepeat, remaining, gated, error, clearError, fail } = useRepeatRow(
    task.repeatTarget,
    task.nextRepAllowedAt,
  );

  const done = task.status === "completed";
  const doneToday = task.repeatDoneToday ?? 0;
  const meta =
    task.description?.trim() ||
    (task.isCarriedOver ? `Original ${fmtShort(task.originalDate)}` : "Today");

  const { toggle, menuActions, canDelete, confirmProps, logRep, undoRep } =
    useTaskRowActions({
      taskId: task.taskId,
      viewedDate,
      status: task.status,
      done,
      isRepeat,
      gated,
      doneToday,
      readOnly,
      clearError,
      fail,
    });

  const s = StyleSheet.create({
    body: { flex: 1, gap: 2 },
    more: { fontSize: 16, color: c.t3, letterSpacing: 1 },
  });

  return (
    <>
      <RowShell
        align="flex-start"
        dimmed={done}
        toggle={<CompletionCircle done={done} dimmed={isRepeat && gated} />}
        onToggle={toggle}
        toggleDisabled={!!readOnly}
        title={task.title}
        titleLines={2}
        struck={done}
        meta={meta}
        error={error}
        goalTitle={task.goalTitle}
        right={
          <>
            {isRepeat && (
              <RepeatControl
                doneToday={doneToday}
                target={task.repeatTarget!}
                remaining={remaining}
                readOnly={readOnly}
                onUndo={() => {
                  clearError();
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  void undoRep({
                    taskId: task.taskId,
                    today: viewedDate,
                  }).catch(fail);
                }}
              />
            )}
            {task.isCarriedOver && !done && (
              <Badge tone="carryover">{`×${task.carryoverCount} carried`}</Badge>
            )}
            {!readOnly && canDelete && (
              <TouchableOpacity onPress={() => setMenuOpen(true)} hitSlop={8}>
                <Text style={s.more}>···</Text>
              </TouchableOpacity>
            )}
          </>
        }
      />
      <ActionSheet
        visible={menuOpen}
        title={task.title}
        actions={menuActions}
        onCancel={() => setMenuOpen(false)}
      />
      <ConfirmSheet {...confirmProps} />
    </>
  );
}
