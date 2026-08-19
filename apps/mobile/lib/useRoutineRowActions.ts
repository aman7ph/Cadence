import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";
import * as Haptics from "expo-haptics";
import type { ActionItem } from "../components/ActionSheet";

interface Args {
  routineId: Id<"routines">;
  date: string;
  done: boolean;
  skipped: boolean;
  isRepeat: boolean;
  gated: boolean;
  readOnly?: boolean;
  clearError: () => void;
  fail: (e: unknown) => void;
}

/**
 * Everything a routine row can DO — the six mutations, the haptics, and the
 * `⋯` menu — separated from how it looks.
 *
 * The toggle is the interesting part: a repeat routine logs a rep rather than
 * completing, and refuses (with a warning haptic) once it is done or gated, so
 * the same tap means two different things depending on the routine.
 */
export function useRoutineRowActions({
  routineId,
  date,
  done,
  skipped,
  isRepeat,
  gated,
  readOnly,
  clearError,
  fail,
}: Args) {
  const complete = useMutation(api.routines.complete);
  const uncomplete = useMutation(api.routines.uncomplete);
  const skip = useMutation(api.routines.skip);
  const archive = useMutation(api.routineManagement.archive);
  const logRep = useMutation(api.routineRepeats.logRep);
  const undoRep = useMutation(api.routineRepeats.undoRep);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const toggle = () => {
    if (readOnly) return;
    clearError();
    const today = todayLocal();
    if (isRepeat) {
      if (done || gated) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
        return;
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void logRep({ routineId, date, today }).catch(fail);
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    done
      ? uncomplete({ routineId, date, today })
      : complete({ routineId, date, today });
  };

  const menuActions: ActionItem[] = [
    {
      label: skipped ? "Un-skip" : "Skip today",
      onPress: () => {
        const today = todayLocal();
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        skipped
          ? uncomplete({ routineId, date, today })
          : skip({ routineId, date, today });
      },
    },
    {
      label: "Archive",
      style: "destructive" as const,
      onPress: () => setConfirmArchive(true),
    },
  ];

  // Archiving asks first, as web does, with web's wording. Accent rather than
  // danger because it IS reversible — the description says where to undo it,
  // and a red button on a reversible action teaches people to ignore red.
  const confirmProps = {
    visible: confirmArchive,
    onCancel: () => setConfirmArchive(false),
    title: "Archive this routine?",
    description:
      "It stops appearing on Today and keeps all of its history. You can restore it from the Archived tab.",
    confirmLabel: "Archive",
    tone: "accent" as const,
    onConfirm: async () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await archive({ routineId, today: todayLocal() }).catch(fail);
    },
  };

  return { toggle, menuActions, confirmProps, logRep, undoRep };
}
