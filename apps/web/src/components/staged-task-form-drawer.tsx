import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { FormDrawer } from "@/components/ui/form-drawer";
import { Input } from "@/components/ui/input";

export interface StagedTaskFormValues {
  _id: Id<"stagedTasks">;
  title: string;
  description?: string;
}

/**
 * Capture and edit a staged task — one form for both, as with routines.
 *
 * Deliberately carries **no** goal or repeat options: in this app those are
 * chosen when the task is scheduled, not when it is captured, which is what the
 * page subtitle promises ("assign them to a routine or a day later"). See the
 * schedule drawer, and open question 4 on whether the two should merge.
 */
export function StagedTaskFormDrawer({
  stagedTask,
  onClose,
}: {
  /** Omit to create. */
  stagedTask?: StagedTaskFormValues;
  onClose: () => void;
}) {
  const create = useMutation(api.stagedTasks.create);
  const update = useMutation(api.stagedTasks.update);

  const [title, setTitle] = useState(stagedTask?.title ?? "");
  const [description, setDescription] = useState(stagedTask?.description ?? "");

  const submit = async () => {
    const shared = {
      title: title.trim(),
      description: description.trim() || undefined,
    };
    if (stagedTask) {
      await update({ stagedTaskId: stagedTask._id, ...shared });
    } else {
      await create(shared);
    }
  };

  return (
    <FormDrawer
      open
      onOpenChange={(o) => !o && onClose()}
      title={stagedTask ? "Edit staged task" : "New staged task"}
      description="Capture it now. Choose where and when it lands later."
      submitLabel={stagedTask ? "Save changes" : "Add task"}
      submitDisabled={!title.trim()}
      onSubmit={submit}
    >
      <Input
        autoFocus
        placeholder="Task title (e.g. Renew passport)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
    </FormDrawer>
  );
}
