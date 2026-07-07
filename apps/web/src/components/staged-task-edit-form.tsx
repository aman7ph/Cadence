import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StagedTaskEditFormProps {
  stagedTaskId: Id<"stagedTasks">;
  initialTitle: string;
  initialDescription?: string;
  onDone: () => void;
}

export function StagedTaskEditForm({
  stagedTaskId,
  initialTitle,
  initialDescription,
  onDone,
}: StagedTaskEditFormProps) {
  const update = useMutation(api.stagedTasks.update);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || pending) return;
    setPending(true);
    try {
      await update({
        stagedTaskId,
        title: trimmed,
        description: description.trim() || undefined,
      });
      onDone();
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-[12px] border border-[var(--border-subtle)] bg-card p-4 shadow-[var(--shadow-sm)]"
    >
      <Input
        autoFocus
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={pending}
      />
      <Input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={pending}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending || !title.trim()}>
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
