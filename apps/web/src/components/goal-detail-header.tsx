import { useState } from "react";
import { CheckCircle, Circle } from "lucide-react";

const CARD = "rounded-[16px] border border-[var(--border-subtle)] bg-card shadow-[var(--shadow-sm)]";
const IN = "w-full rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-3 py-2 text-[14px] text-foreground placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-accent)] focus:outline-none transition-colors";
const STATUS_CLR = {
  completed: "text-[var(--status-complete)] bg-[var(--green-50)] border-[var(--green-100)]",
  abandoned: "text-[var(--text-tertiary)] bg-[var(--bg-sunken)] border-[var(--border-subtle)]",
  active: "text-[var(--text-accent)] bg-[var(--indigo-50)] border-[var(--indigo-100)]",
} as const;

interface GoalDetailHeaderProps {
  goal: {
    title: string; description?: string;
    status: "active" | "completed" | "abandoned";
    createdAt: number; dueDate?: string; targetValue?: number; unit?: string;
  };
  onUpdate: (data: { title: string; description?: string; targetValue?: number; unit?: string; dueDate?: string }) => Promise<void>;
  onMarkComplete: () => Promise<void>;
  onAbandon: () => Promise<void>;
}

export function GoalDetailHeader({ goal, onUpdate, onMarkComplete, onAbandon }: GoalDetailHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editDue, setEditDue] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<"complete" | "abandon" | null>(null);
  function startEditing() {
    setEditTitle(goal.title); setEditDesc(goal.description ?? "");
    setEditTarget(goal.targetValue?.toString() ?? ""); setEditUnit(goal.unit ?? "");
    setEditDue(goal.dueDate ?? ""); setEditing(true);
  }
  async function handleSave() {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      await onUpdate({ title: editTitle, description: editDesc || undefined, targetValue: editTarget ? parseFloat(editTarget) : undefined, unit: editUnit || undefined, dueDate: editDue || undefined });
      setEditing(false);
    } finally { setSaving(false); }
  }
  async function handleConfirm() {
    if (confirm === "complete") await onMarkComplete();
    else if (confirm === "abandon") await onAbandon();
    setConfirm(null);
  }
  const started = new Date(goal.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <>
      <div className="flex items-center justify-end">
        {goal.status === "active" && !editing && (
          <button type="button" onClick={startEditing}
            className="rounded-[8px] border border-[var(--border-subtle)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-foreground transition-colors">
            Edit
          </button>
        )}
      </div>
      {editing ? (
        <div className={`${CARD} p-5`}>
          <p className="mb-4 text-[14px] font-semibold text-foreground">Edit goal</p>
          <div className="flex flex-col gap-3">
            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Goal title" autoFocus className={IN} />
            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description (optional)" rows={2} className={`${IN} resize-none`} />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} placeholder="Target (optional)" className={IN} />
              <input type="text" value={editUnit} onChange={(e) => setEditUnit(e.target.value)} placeholder="Unit — pages, km…" className={IN} />
            </div>
            <input type="date" value={editDue} onChange={(e) => setEditDue(e.target.value)} style={{ colorScheme: "normal" }} className={IN} />
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => void handleSave()} disabled={saving || !editTitle.trim()}
                className="rounded-[8px] bg-[var(--action-primary)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--action-primary-hover)] disabled:opacity-40 transition-colors">
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button type="button" onClick={() => setEditing(false)}
                className="rounded-[8px] border border-[var(--border-subtle)] px-4 py-2 text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`${CARD} p-5`}>
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight text-foreground">{goal.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CLR[goal.status]}`}>
                {goal.status === "active" ? "Active" : goal.status === "completed" ? "Completed" : "Abandoned"}
              </span>
              <span className="text-[12px] text-[var(--text-tertiary)]">Started {started}</span>
              {goal.dueDate && (
                <span className="rounded-full border border-[var(--amber-100)] bg-[var(--amber-50)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--amber-600)]">Due {goal.dueDate}</span>
              )}
            </div>
            {goal.description && <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">{goal.description}</p>}
            {goal.status === "active" && (
              <div className="border-t border-[var(--border-subtle)] pt-3">
                {confirm ? (
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-[var(--text-secondary)]">
                      {confirm === "complete" ? "Mark this goal as completed?" : "Abandon this goal?"}
                    </span>
                    <button type="button" onClick={() => void handleConfirm()}
                      className="rounded-[8px] bg-[var(--action-primary)] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[var(--action-primary-hover)] transition-colors">
                      Confirm
                    </button>
                    <button type="button" onClick={() => setConfirm(null)} className="text-[12px] font-semibold text-[var(--text-secondary)] hover:text-foreground transition-colors">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setConfirm("complete")}
                      className="inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--green-100)] bg-[var(--green-50)] px-3 py-1.5 text-[12px] font-semibold text-[var(--status-complete)] hover:bg-[var(--green-100)] transition-colors">
                      <CheckCircle className="size-3.5" /> Mark complete
                    </button>
                    <button type="button" onClick={() => setConfirm("abandon")}
                      className="inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--border-subtle)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
                      <Circle className="size-3.5" /> Abandon
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
