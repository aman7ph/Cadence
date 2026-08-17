import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";

/**
 * Archiving a routine, shared by the two places that offer it: the row on Today
 * and the row on the Routines page.
 *
 * Both previously wired the mutation themselves, and adding a confirmation
 * would have duplicated the state and the wording as well. The trigger still
 * differs — Today puts it in a row menu, Routines uses an icon button — but the
 * action, the confirm and the copy come from here.
 */
export function useRoutineArchive(routineId: Id<"routines">, today: string) {
  const archive = useMutation(api.routineManagement.archive);
  const [open, setOpen] = useState(false);

  return {
    /** Wire to the trigger. */
    request: () => setOpen(true),
    /** Spread onto <ConfirmDrawer>. */
    drawerProps: {
      open,
      onOpenChange: setOpen,
      title: "Archive this routine?",
      // Reversible, and saying so is the reason this is accent rather than
      // danger — see ConfirmDrawer.
      description:
        "It stops appearing on Today and keeps all of its history. You can restore it from the Archived tab.",
      confirmLabel: "Archive",
      tone: "accent" as const,
      onConfirm: async () => {
        await archive({ routineId, today });
      },
    },
  };
}
