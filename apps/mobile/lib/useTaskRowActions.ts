import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import * as Haptics from "expo-haptics";
import type { ActionItem } from "../components/ActionSheet";

interface Args {
  taskId: Id<"dailyTasks">;
  viewedDate: string;
  status: string;
  done: boolean;
  isRepeat: boolean;
  gated: boolean;
  doneToday: number;
  readOnly?: boolean;
  clearError: () => void;
  fail: (e: unknown) => void;
}

/**
 * Everything a task row can DO, separated from how it looks.
 *
 * A rejected tap gets a warning buzz rather than the "done" tick, so the repeat
 * gate is felt even when the countdown badge is off-screen.
 */
export function useTaskRowActions({
  taskId,
  viewedDate,
  status,
  done,
  isRepeat,
  gated,
  doneToday,
  readOnly,
  clearError,
  fail,
}: Args) {
  const complete = useMutation(api.dailyTasks.complete);
  const uncomplete = useMutation(api.dailyTasks.uncomplete);
  const remove = useMutation(api.dailyTasks.remove);
  const logRep = useMutation(api.dailyTaskRepeats.logRep);
  const undoRep = useMutation(api.dailyTaskRepeats.undoRep);

  const toggle = () => {
    if (readOnly) return;
    clearError();
    if (isRepeat) {
      if (status !== "open" || gated) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
        return;
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void logRep({ taskId, today: viewedDate }).catch(fail);
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    done ? uncomplete({ taskId }) : complete({ taskId, today: viewedDate });
  };

  // dailyTasks.remove is the authority; hiding the menu only spares the common
  // case a guaranteed failure. doneToday is scoped to the viewed date, so reps
  // from an earlier day still reach the server — hence the .catch.
  const canDelete = status === "open" && doneToday === 0;

  // Deleting asks first, exactly as web does, with web's wording. It used to
  // fire straight from the menu — an irreversible action with no confirmation,
  // on the platform where a mis-tap is most likely.
  const [confirmDelete, setConfirmDelete] = useState(false);

  const menuActions: ActionItem[] = [
    {
      label: "Delete",
      style: "destructive" as const,
      onPress: () => {
        clearError();
        setConfirmDelete(true);
      },
    },
  ];

  const confirmProps = {
    visible: confirmDelete,
    onCancel: () => setConfirmDelete(false),
    title: "Delete this task?",
    description: "This cannot be undone. Its completion history goes with it.",
    confirmLabel: "Delete task",
    tone: "danger" as const,
    onConfirm: async () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await remove({ taskId }).catch(fail);
    },
  };

  return { toggle, menuActions, canDelete, confirmProps, logRep, undoRep };
}
