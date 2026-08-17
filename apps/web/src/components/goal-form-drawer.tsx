import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { FormDrawer } from "@/components/ui/form-drawer";
import { Input } from "@/components/ui/input";

export interface GoalFormValues {
  _id: Id<"goals">;
  title: string;
  description?: string;
  targetValue?: number;
  unit?: string;
  dueDate?: string;
}

/**
 * Create AND edit a goal. Editing previously lived inline inside the detail
 * drawer, which meant a form nested in an overlay; the page now shows one
 * overlay at a time and returns to the detail when this closes.
 */
export function GoalFormDrawer({
  goal,
  onClose,
  onCreated,
}: {
  /** Omit to create. */
  goal?: GoalFormValues;
  onClose: () => void;
  onCreated?: (id: Id<"goals">) => void;
}) {
  const create = useMutation(api.goals.create);
  const update = useMutation(api.goals.update);

  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [target, setTarget] = useState(goal?.targetValue?.toString() ?? "");
  const [unit, setUnit] = useState(goal?.unit ?? "");
  const [dueDate, setDueDate] = useState(goal?.dueDate ?? "");

  const submit = async () => {
    const shared = {
      title: title.trim(),
      description: description.trim() || undefined,
      targetValue: target ? parseFloat(target) : undefined,
      unit: unit.trim() || undefined,
      dueDate: dueDate || undefined,
    };
    if (goal) {
      await update({ goalId: goal._id, ...shared });
    } else {
      const id = await create(shared);
      onCreated?.(id as Id<"goals">);
    }
  };

  return (
    <FormDrawer
      open
      onOpenChange={(o) => !o && onClose()}
      title={goal ? "Edit goal" : "New goal"}
      description="The long game. Routines and tasks you link will feed it automatically."
      submitLabel={goal ? "Save changes" : "Create goal"}
      submitDisabled={!title.trim()}
      onSubmit={submit}
    >
      <Input
        autoFocus
        placeholder="What do you want to achieve?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Why does this matter? (optional)"
        rows={3}
        className="w-full resize-none rounded-sm border border-input bg-card px-3.5 py-[9px] text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          placeholder="Target (optional)"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <Input
          placeholder="Unit — pages, km…"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11.5px] text-[var(--text-secondary)]">
          Target date (optional)
        </span>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </label>
    </FormDrawer>
  );
}
