import { Target } from "lucide-react";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { Stepper } from "@/components/ui/stepper";
import { cn } from "@/lib/utils";

export interface ComposerGoal {
  _id: Id<"goals">;
  title: string;
  currentValue?: number;
  targetValue?: number;
  unit?: string;
}

interface ComposerGoalPanelProps {
  goals: ComposerGoal[];
  goalId: string;
  contribution: number;
  onSelect: (id: string) => void;
  onContributionChange: (n: number) => void;
}

/**
 * Left half of the composer: one row per active goal — name, current/target,
 * progress bar — and, once a goal is picked, the "Adds toward target" stepper.
 */
export function ComposerGoalPanel({
  goals,
  goalId,
  contribution,
  onSelect,
  onContributionChange,
}: ComposerGoalPanelProps) {
  const selected = goals.find((g) => g._id === goalId);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2.5">
      <div className="flex items-center gap-1.5">
        <Target
          className="size-3 text-[var(--text-accent)]"
          strokeWidth={2.5}
        />
        <span className="font-display text-[10px] uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
          Goal contribution
        </span>
      </div>

      {goals.length === 0 ? (
        <p className="text-[11.5px] text-[var(--text-tertiary)]">
          No active goals to contribute to.
        </p>
      ) : (
        <div className="no-scrollbar flex max-h-[188px] flex-col gap-1.5 overflow-y-auto">
          {goals.map((g) => {
            const active = g._id === goalId;
            const target = g.targetValue ?? 0;
            const pct =
              target > 0
                ? Math.min(100, ((g.currentValue ?? 0) / target) * 100)
                : 0;
            return (
              <button
                key={g._id}
                type="button"
                onClick={() => onSelect(active ? "" : g._id)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col gap-1.5 rounded-sm border px-2.5 py-2 text-left transition-colors",
                  active
                    ? "border-[var(--border-accent)] bg-[var(--surface-accent)]"
                    : "border-[var(--border-subtle)] hover:border-[var(--border-default)]",
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      "truncate text-[12px]",
                      active ? "text-[var(--text-accent)]" : "text-foreground",
                    )}
                  >
                    {g.title}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--text-tertiary)]">
                    {g.currentValue ?? 0}/{target}
                  </span>
                </span>
                <span className="h-[3px] w-full overflow-hidden rounded-full bg-[var(--bg-sunken)]">
                  <span
                    className="block h-full rounded-full bg-[var(--action-primary)]"
                    style={{ width: `${pct}%` }}
                  />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <Stepper
          label="Adds toward target"
          value={contribution}
          onChange={onContributionChange}
          min={1}
          max={100000}
          suffix={selected.unit}
          className="border-t border-[var(--border-subtle)] pt-2.5"
        />
      )}
    </div>
  );
}
