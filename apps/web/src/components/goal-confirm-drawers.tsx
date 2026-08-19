import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { ConfirmDrawer } from "@/components/ui/confirm-drawer";

export type GoalConfirm = "complete" | "abandon" | "delete" | null;

interface GoalConfirmDrawersProps {
  goalId: Id<"goals"> | null;
  open: GoalConfirm;
  onClose: () => void;
  /** Called after a confirmed action, so the detail drawer can close too. */
  onDone: () => void;
}

/**
 * The three confirmations a goal can raise.
 *
 * Complete and abandon are reversible — the goal moves tab rather than
 * disappearing — so they take the accent tone. Delete is the one irreversible
 * action, so it is the one that gets danger.
 */
export function GoalConfirmDrawers({
  goalId,
  open,
  onClose,
  onDone,
}: GoalConfirmDrawersProps) {
  const completeGoal = useMutation(api.goals.complete);
  const abandonGoal = useMutation(api.goals.abandon);
  const removeGoal = useMutation(api.goals.remove);

  const isStatus = open === "complete" || open === "abandon";

  return (
    <>
      <ConfirmDrawer
        open={isStatus}
        onOpenChange={(o) => !o && onClose()}
        title={
          open === "complete"
            ? "Mark this goal complete?"
            : "Abandon this goal?"
        }
        description={
          open === "complete"
            ? "It moves to Completed and stops accepting contributions."
            : "It moves to Abandoned and stops accepting contributions. Nothing is deleted."
        }
        confirmLabel={open === "complete" ? "Mark complete" : "Abandon goal"}
        tone="accent"
        onConfirm={async () => {
          if (!goalId) return;
          if (open === "complete") await completeGoal({ goalId });
          else await abandonGoal({ goalId });
          onDone();
        }}
      />

      <ConfirmDrawer
        open={open === "delete"}
        onOpenChange={(o) => !o && onClose()}
        title="Delete this goal forever?"
        description="This cannot be undone. Tasks and routines linked to it are unlinked, not deleted."
        confirmLabel="Delete forever"
        tone="danger"
        onConfirm={async () => {
          if (!goalId) return;
          await removeGoal({ goalId });
          onDone();
        }}
      />
    </>
  );
}
