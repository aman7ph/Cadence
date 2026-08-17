import { CheckCircle, Circle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

const CARD = "rounded-md border border-[var(--border-subtle)] bg-card";
const IN = "w-full rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-3 py-2 text-[14px] text-foreground placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-accent)] focus:outline-none transition-colors";
const STATUS_CLR = {
  completed: "text-[var(--text-success)] bg-[var(--surface-success)] border-[var(--status-complete)]",
  abandoned: "text-[var(--text-tertiary)] bg-[var(--bg-sunken)] border-[var(--border-subtle)]",
  active: "text-[var(--text-accent)] bg-[var(--surface-accent)] border-[var(--surface-accent)]",
} as const;

interface GoalDetailHeaderProps {
  goal: {
    title: string; description?: string;
    status: "active" | "completed" | "abandoned";
    createdAt: number; dueDate?: string; targetValue?: number; unit?: string;
  };
  onEdit: () => void;
  onRequestComplete: () => void;
  onRequestAbandon: () => void;
}

export function GoalDetailHeader({ goal, onEdit, onRequestComplete, onRequestAbandon }: GoalDetailHeaderProps) {
  const started = new Date(goal.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <>
      {(
        <div className={`${CARD} p-5`}>
          <div className="flex flex-col gap-3">
            {/* The top-right corner belongs to the drawer's close button, so
                nothing else goes there. Edit lives with the other actions
                below — all three act on the goal. */}
            <h1 className="font-display text-[24px] font-bold leading-tight tracking-tight text-foreground">
              {goal.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CLR[goal.status]}`}>
                {goal.status === "active" ? "Active" : goal.status === "completed" ? "Completed" : "Abandoned"}
              </span>
              <span className="text-[12px] text-[var(--text-tertiary)]">Started {started}</span>
              {goal.dueDate && (
                <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-active)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">Due {goal.dueDate}</span>
              )}
            </div>
            {goal.description && <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">{goal.description}</p>}
            {goal.status === "active" && (
              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] pt-3">
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Pencil className="size-3.5" /> Edit
                </Button>
                <Button variant="outline" tone="success" size="sm" onClick={onRequestComplete}>
                  <CheckCircle className="size-3.5" /> Mark complete
                </Button>
                <Button variant="outline" size="sm" onClick={onRequestAbandon}>
                  <Circle className="size-3.5" /> Abandon
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
