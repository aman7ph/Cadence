import { Target } from "lucide-react";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";

interface Goal {
  _id: Id<"goals">;
  title: string;
  description?: string;
  dueDate?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
}

interface GoalListProps {
  goalsWithCounts: Array<{ goal: Goal; taskCount: number; routineCount: number }> | undefined;
  selectedGoalId: Id<"goals"> | null;
  onSelect: (id: Id<"goals">) => void;
}

function LinkedPill({ count, label, color }: { count: number; label: string; color: "indigo" | "green" }) {
  if (count === 0) return null;
  const base = color === "indigo" ? "bg-[var(--indigo-50)] text-[var(--indigo-600)]" : "bg-[var(--green-50)] text-[var(--green-600)]";
  const dot = color === "indigo" ? "bg-[var(--indigo-500)]" : "bg-[var(--green-500)]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${base}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {count} {count === 1 ? label.slice(0, -1) : label}
    </span>
  );
}

function GoalCard({ goal, taskCount, routineCount, isSelected, onSelect }: {
  goal: Goal; taskCount: number; routineCount: number; isSelected: boolean; onSelect: (id: Id<"goals">) => void;
}) {
  const pct = goal.targetValue ? Math.min(100, Math.round(((goal.currentValue ?? 0) / goal.targetValue) * 100)) : null;
  const formattedDue = goal.dueDate
    ? new Date(goal.dueDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <button type="button" onClick={() => onSelect(goal._id)}
      className={`relative w-full overflow-hidden rounded-[16px] border text-left transition-all duration-200 ${
        isSelected
          ? "border-[var(--border-accent)] bg-[var(--surface-accent)] shadow-[var(--shadow-accent)]"
          : "border-[var(--border-subtle)] bg-card hover:border-[var(--border-default)] hover:shadow-[var(--shadow-md)]"
      }`}>
      {/* Accent rail */}
      <div className="absolute inset-y-0 left-0 w-[4px] rounded-l-[16px]"
        style={{ background: isSelected ? "var(--action-primary)" : "var(--border-subtle)" }} />

      <div className="px-4 py-4 pl-[18px]">
        {/* Title + due date */}
        <div className="flex items-start justify-between gap-2">
          <span className={`text-[14px] font-bold leading-snug ${isSelected ? "text-[var(--text-accent)]" : "text-foreground"}`}>
            {goal.title}
          </span>
          {formattedDue && (
            <span className="mt-0.5 shrink-0 rounded-full border border-[var(--amber-100)] bg-[var(--amber-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--amber-600)]">
              {formattedDue}
            </span>
          )}
        </div>

        {/* Description */}
        {goal.description && (
          <p className="mt-1 line-clamp-2 text-[12px] leading-[1.5] text-[var(--text-secondary)]">
            {goal.description}
          </p>
        )}

        {/* Progress */}
        {goal.targetValue !== undefined && pct !== null && (
          <div className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[12px] text-[var(--text-tertiary)]">
                <span className="font-mono text-[13px] font-bold text-foreground">{goal.currentValue ?? 0}</span>
                {" "}/ {goal.targetValue}{goal.unit ? ` ${goal.unit}` : ""}
              </span>
              <span className={`font-mono text-[11px] font-bold ${pct === 100 ? "text-[var(--status-complete)]" : "text-[var(--text-accent)]"}`}>
                {pct}%
              </span>
            </div>
            <div className="h-[5px] w-full overflow-hidden rounded-full bg-[var(--bg-sunken)]">
              <div className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${pct}%`, background: pct === 100 ? "var(--status-complete)" : "var(--action-primary)" }} />
            </div>
          </div>
        )}

        {/* Linked pills */}
        {(taskCount > 0 || routineCount > 0) && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <LinkedPill count={taskCount} label="tasks" color="indigo" />
            <LinkedPill count={routineCount} label="routines" color="green" />
          </div>
        )}
      </div>
    </button>
  );
}

export function GoalList({ goalsWithCounts, selectedGoalId, onSelect }: GoalListProps) {
  return (
    <section className="flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
        Active · {goalsWithCounts?.length ?? 0}
      </p>
      {goalsWithCounts === undefined && (
        <p className="text-[13px] text-[var(--text-tertiary)]">Loading…</p>
      )}
      {goalsWithCounts?.length === 0 && (
        <div className="flex flex-col items-center gap-2.5 rounded-[14px] border border-dashed border-[var(--border-subtle)] py-10 text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-accent)]">
            <Target className="size-4 text-[var(--text-accent)]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground">No active goals</p>
            <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">Create one to get started.</p>
          </div>
        </div>
      )}
      {(goalsWithCounts ?? []).map(({ goal, taskCount, routineCount }) => (
        <GoalCard key={goal._id} goal={goal} taskCount={taskCount} routineCount={routineCount}
          isSelected={selectedGoalId === goal._id} onSelect={onSelect} />
      ))}
    </section>
  );
}
