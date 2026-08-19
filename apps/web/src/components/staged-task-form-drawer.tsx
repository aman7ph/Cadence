import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { FormDrawer } from "@/components/ui/form-drawer";
import { Input } from "@/components/ui/input";

/**
 * Capture a staged task. Create only: editing a staged task's text now happens
 * in the schedule drawer, which already carries those fields.
 *
 * Deliberately carries **no** goal or repeat options: in this app those are
 * chosen when the task is scheduled, not when it is captured, which is what the
 * page subtitle promises ("assign them to a routine or a day later"). See the
 * schedule drawer, and open question 4 on whether the two should merge.
 */
export function StagedTaskFormDrawer({ onClose }: { onClose: () => void }) {
  const create = useMutation(api.stagedTasks.create);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const submit = async () => {
    const shared = {
      title: title.trim(),
      description: description.trim() || undefined,
    };
    await create(shared);
  };

  return (
    <FormDrawer
      open
      onOpenChange={(o) => !o && onClose()}
      title="New staged task"
      description="Capture it now. Choose where and when it lands later."
      submitLabel="Add task"
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
