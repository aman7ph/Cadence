import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { StyleSheet, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "../lib/theme";
import { ConfirmSheet } from "./ui/ConfirmSheet";

export type StagedConfirm = "delete" | "unschedule" | null;

interface Props {
  stagedTaskId: Id<"stagedTasks">;
  title: string;
  open: StagedConfirm;
  onClose: () => void;
}

/**
 * The two confirmations a staged task can raise.
 *
 * Copy matches web's staged-task-row drawers. Unschedule is reversible, so it
 * takes the accent tone; only delete is danger.
 */
export function StagedTaskConfirms({
  stagedTaskId,
  title,
  open,
  onClose,
}: Props) {
  const c = useColors();
  const remove = useMutation(api.stagedTasks.remove);
  const unschedule = useMutation(api.stagedTaskScheduling.unschedule);

  const s = StyleSheet.create({
    name: { fontSize: 13, color: c.t1 },
  });

  return (
    <>
      <ConfirmSheet
        visible={open === "unschedule"}
        onCancel={onClose}
        title="Unschedule this task?"
        description="It returns to Unscheduled and keeps its details. You can schedule it again at any time."
        confirmLabel="Unschedule"
        tone="accent"
        onConfirm={async () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          await unschedule({ stagedTaskId });
        }}
      />
      <ConfirmSheet
        visible={open === "delete"}
        onCancel={onClose}
        title="Delete this staged task?"
        description="This cannot be undone."
        confirmLabel="Delete task"
        tone="danger"
        onConfirm={async () => {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error,
          );
          await remove({ stagedTaskId });
        }}
      >
        <Text style={s.name}>{title}</Text>
      </ConfirmSheet>
    </>
  );
}
