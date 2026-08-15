import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";

interface Goal {
  _id: Id<"goals">;
  title: string;
  description?: string;
  status?: string;
  createdAt?: number;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
}

interface GoalRowProps {
  goal: Goal;
  routineCount?: number;
  taskCount?: number;
  onOpen: () => void;
}

function since(ts?: number): string | null {
  if (!ts) return null;
  return `Since ${new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

/**
 * Full-width goal row. The prototype lists goals across the whole column and
 * puts the detail in a slide-over — replacing the app's old two-pane split.
 */
export function GoalRow({ goal, routineCount, taskCount, onOpen }: GoalRowProps) {
  const linked = (routineCount ?? 0) + (taskCount ?? 0);
  const pct =
    goal.targetValue && goal.targetValue > 0
      ? Math.min(100, Math.round(((goal.currentValue ?? 0) / goal.targetValue) * 100))
      : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-1.5 rounded-sm border border-[var(--border-subtle)] bg-card px-4 py-3 text-left transition-colors duration-150 hover:border-[var(--border-default)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-semibold leading-snug text-foreground">
          {goal.title}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {goal.status && (
            <Badge tone={goal.status === "active" ? "accent" : "neutral"}>
              {goal.status}
            </Badge>
          )}
          {since(goal.createdAt) && (
            <span className="text-[11px] text-[var(--text-tertiary)]">
              {since(goal.createdAt)}
            </span>
          )}
        </span>
      </div>

      {goal.description && (
        <p className="line-clamp-1 text-[12px] text-[var(--text-secondary)]">
          {goal.description}
        </p>
      )}

      <div className="flex items-center gap-3">
        {linked > 0 && (
          <span className="text-[11px] text-[var(--text-tertiary)]">
            ● {routineCount ? `${routineCount} routine${routineCount === 1 ? "" : "s"}` : ""}
            {routineCount && taskCount ? " · " : ""}
            {taskCount ? `${taskCount} task${taskCount === 1 ? "" : "s"}` : ""}
          </span>
        )}
        {pct !== null && (
          <span className="flex flex-1 items-center gap-2">
            <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-[var(--bg-sunken)]">
              <span
                className="block h-full rounded-full bg-[var(--action-primary)]"
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--text-tertiary)]">
              {goal.currentValue ?? 0}/{goal.targetValue}
            </span>
          </span>
        )}
      </div>
    </button>
  );
}
