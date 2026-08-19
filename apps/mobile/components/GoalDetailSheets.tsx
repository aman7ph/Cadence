import { Text } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { ActionSheet } from "./ActionSheet";
import { ConfirmSheet } from "./ui/ConfirmSheet";
import { GoalFormModal } from "./GoalFormModal";
import { DatePickerModal } from "./DatePickerModal";
import { useColors } from "../lib/theme";
import type { GoalDetailUi } from "../lib/useGoalDetailUi";
import type { GoalData } from "./GoalDetailModal";

/**
 * Every overlay the goal detail page can raise: its `⋯` menu, three confirms,
 * the edit form and the date picker.
 *
 * They live together because none is part of the page's layout — the page
 * renders a scroll view, and these sit on top of it.
 */
export function GoalDetailSheets({
  goalId,
  goal,
  ui,
  onDone,
}: {
  goalId: Id<"goals">;
  goal: GoalData;
  ui: GoalDetailUi;
  /** Called after a mutation lands — the goal has moved or gone, so the page closes. */
  onDone: () => void;
}) {
  const c = useColors();
  const complete = useMutation(api.goals.complete);
  const abandon = useMutation(api.goals.abandon);
  const remove = useMutation(api.goals.remove);
  const close = () => ui.setConfirm(null);

  return (
    <>
      <ActionSheet
        visible={ui.menuOpen}
        title={goal.title}
        actions={[
          // Edit is offered only on an active goal, as before — a completed or
          // abandoned goal can still be deleted but not rewritten.
          ...(goal.status === "active"
            ? [{ label: "Edit goal", onPress: ui.openEdit }]
            : []),
          {
            label: "Delete goal",
            style: "destructive" as const,
            onPress: () => ui.setConfirm("delete"),
          },
        ]}
        onCancel={ui.closeMenu}
      />

      {/* Copy matches web's goals-page drawers word for word. Complete and
          abandon are reversible — the goal changes tab rather than vanishing —
          so they take the accent tone; only delete is danger. */}
      <ConfirmSheet
        visible={ui.confirm === "complete"}
        onCancel={close}
        title="Mark this goal complete?"
        description="It moves to Completed and stops accepting contributions."
        confirmLabel="Mark complete"
        tone="accent"
        onConfirm={async () => {
          await complete({ goalId });
          onDone();
        }}
      />
      <ConfirmSheet
        visible={ui.confirm === "abandon"}
        onCancel={close}
        title="Abandon this goal?"
        description="It moves to Abandoned and stops accepting contributions. Nothing is deleted."
        confirmLabel="Abandon goal"
        tone="accent"
        onConfirm={async () => {
          await abandon({ goalId });
          onDone();
        }}
      />
      <ConfirmSheet
        visible={ui.confirm === "delete"}
        onCancel={close}
        title="Delete this goal forever?"
        description="This cannot be undone. Tasks and routines linked to it are unlinked, not deleted."
        confirmLabel="Delete forever"
        tone="danger"
        onConfirm={async () => {
          await remove({ goalId });
          onDone();
        }}
      >
        <Text style={{ fontSize: 13, color: c.t1 }}>{goal.title}</Text>
      </ConfirmSheet>

      <GoalFormModal
        key={ui.editKey}
        visible={ui.editOpen}
        goal={{
          _id: goalId,
          title: goal.title,
          description: goal.description,
          targetValue: goal.targetValue,
          unit: goal.unit,
          dueDate: goal.dueDate,
        }}
        onDone={ui.closeEdit}
      />
      <DatePickerModal
        visible={ui.pickerOpen}
        value={ui.selDate}
        min={ui.minDate}
        max={ui.maxDate}
        onChange={ui.setSelDate}
        onClose={ui.closePicker}
      />
    </>
  );
}
