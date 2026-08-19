import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";

interface Args {
  taskId: Id<"dailyTasks">;
  viewedDate: string;
  status: string;
  isRepeat: boolean;
  gated: boolean;
  repeatDoneToday: number;
}

/**
 * What a task row can do, and what went wrong when it tried.
 *
 * The server re-checks the repeat gate regardless; disabling the control only
 * stops the obvious case, and a rejection is surfaced rather than swallowed —
 * clock skew is when that fires.
 */
export function useTaskRowActions({
  taskId,
  viewedDate,
  status,
  isRepeat,
  gated,
  repeatDoneToday,
}: Args) {
  const complete = useMutation(api.dailyTasks.complete);
  const uncomplete = useMutation(api.dailyTasks.uncomplete);
  const remove = useMutation(api.dailyTasks.remove);
  const logRep = useMutation(api.dailyTaskRepeats.logRep);
  const undoRep = useMutation(api.dailyTaskRepeats.undoRep);
  const [error, setError] = useState<string | null>(null);

  const fail = (e: unknown) =>
    setError(
      e instanceof Error ? e.message.split("\n")[0]! : "Something went wrong",
    );

  // dailyTasks.remove enforces what may be deleted; hiding the menu only spares
  // the common case a guaranteed failure. It cannot be the whole test —
  // repeatDoneToday is scoped to the viewed date, so a repeat task with reps on
  // an earlier day still reaches the server and its rejection lands in `error`.
  const canDelete = status === "open" && repeatDoneToday === 0;

  const toggle = () => {
    setError(null);
    if (isRepeat) {
      if (status !== "open" || gated) return;
      void logRep({ taskId, today: viewedDate }).catch(fail);
    } else if (status === "completed") {
      void uncomplete({ taskId });
    } else {
      void complete({ taskId, today: viewedDate });
    }
  };

  return { error, setError, fail, canDelete, toggle, remove, undoRep };
}
