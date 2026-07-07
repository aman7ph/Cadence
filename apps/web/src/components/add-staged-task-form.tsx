import { useState } from "react";
import { useMutation } from "convex/react";
import { Plus } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddStagedTaskForm() {
  const create = useMutation(api.stagedTasks.create);
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  const reset = () => {
    setTitle("");
    setDescription("");
    setExpanded(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || pending) return;
    setPending(true);
    try {
      await create({
        title: trimmed,
        description: description.trim() || undefined,
      });
      reset();
    } finally {
      setPending(false);
    }
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 self-start rounded-[10px] px-3.5 py-2 text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-foreground transition-all duration-150"
      >
        <Plus className="size-4" />
        New task
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-[12px] border border-[var(--border-subtle)] bg-card p-4 shadow-[var(--shadow-sm)]"
    >
      <Input
        autoFocus
        placeholder="Task title (e.g. Renew passport)"
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
          Add task
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={reset}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
