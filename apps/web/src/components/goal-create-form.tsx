import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";

interface GoalCreateFormProps {
  onCreated: (id: Id<"goals">) => void;
  onCancel: () => void;
}

const inputCls =
  "w-full rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-3 py-2 text-[13px] text-foreground placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-accent)] focus:outline-none transition-colors";

export function GoalCreateForm({ onCreated, onCancel }: GoalCreateFormProps) {
  const createGoal = useMutation(api.goals.create);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const id = await createGoal({
        title,
        description: description || undefined,
        targetValue: target ? parseFloat(target) : undefined,
        unit: unit || undefined,
        dueDate: dueDate || undefined,
      });
      onCreated(id as Id<"goals">);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="rounded-[14px] border border-[var(--border-accent)] bg-card p-4 shadow-[var(--shadow-md)]">
      <p className="mb-3 text-[12px] font-semibold text-foreground">New goal</p>
      <div className="flex flex-col gap-2.5">
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
          placeholder="What do you want to achieve?"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus className={inputCls} />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Why does this matter? (optional)" rows={2} className={`${inputCls} resize-none`} />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target (optional)" className={inputCls} />
          <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit — pages, km…" className={inputCls} />
        </div>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
          style={{ colorScheme: "normal" }} className={inputCls} />
        <div className="flex gap-2 pt-0.5">
          <button type="button" onClick={() => void handleCreate()} disabled={creating || !title.trim()}
            className="rounded-[8px] bg-[var(--action-primary)] px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-[var(--action-primary-hover)] disabled:opacity-40 transition-colors">
            {creating ? "Creating…" : "Create goal"}
          </button>
          <button type="button" onClick={onCancel}
            className="rounded-[8px] border border-[var(--border-subtle)] px-3.5 py-1.5 text-[12px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
