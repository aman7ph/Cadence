import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";
import { useRoutineArchive } from "@/lib/use-routine-archive";

interface Args {
  routineId: Id<"routines">;
  viewedDate: string;
  status: string;
  isRepeat: boolean;
  gated: boolean;
}

/**
 * What a routine row can do, and what went wrong when it tried.
 *
 * The server re-checks the repeat gate regardless; disabling the control only
 * stops the obvious case, and a rejection is surfaced rather than swallowed —
 * clock skew is when that fires.
 */
export function useRoutineRowActions({
  routineId,
  viewedDate,
  status,
  isRepeat,
  gated,
}: Args) {
  const complete = useMutation(api.routines.complete);
  const uncomplete = useMutation(api.routines.uncomplete);
  const skip = useMutation(api.routines.skip);
  const logRep = useMutation(api.routineRepeats.logRep);
  const undoRep = useMutation(api.routineRepeats.undoRep);
  const archiveAction = useRoutineArchive(routineId, todayLocal());
  const [error, setError] = useState<string | null>(null);

  const fail = (e: unknown) =>
    setError(
      e instanceof Error ? e.message.split("\n")[0]! : "Something went wrong",
    );

  const toggle = () => {
    setError(null);
    const today = todayLocal();
    if (isRepeat) {
      if (status === "completed" || gated) return;
      void logRep({ routineId, date: viewedDate, today }).catch(fail);
    } else if (status === "completed") {
      void uncomplete({ routineId, date: viewedDate, today });
    } else {
      void complete({ routineId, date: viewedDate, today });
    }
  };

  /** Skip and un-skip are the same button, so they are one function. */
  const handleSkip = () => {
    const today = todayLocal();
    if (status === "skipped")
      void uncomplete({ routineId, date: viewedDate, today });
    else void skip({ routineId, date: viewedDate, today });
  };

  return { error, setError, fail, toggle, handleSkip, undoRep, archiveAction };
}
