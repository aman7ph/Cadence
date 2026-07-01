import { useMutation, useQuery } from "convex/react";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { api } from "@cadence/backend/convex/_generated/api";
import { GoalDetailHeader } from "./goal-detail-header";
import { GoalDetailProgress } from "./goal-detail-progress";
import { GoalDetailLinked } from "./goal-detail-linked";

interface GoalDetailProps {
  goalId: Id<"goals">;
  onBack: () => void;
}

export function GoalDetail({ goalId, onBack }: GoalDetailProps) {
  const linked = useQuery(api.goalLinks.getLinkedItems, { goalId });
  const updateGoal = useMutation(api.goals.update);
  const completeGoal = useMutation(api.goals.complete);
  const abandonGoal = useMutation(api.goals.abandon);

  if (linked === undefined) {
    return <div className="flex items-center justify-center py-16"><p className="text-[13px] text-[var(--text-tertiary)]">Loading…</p></div>;
  }
  if (linked === null) {
    return (
      <div className="flex flex-col gap-4">
        <button type="button" onClick={onBack} className="self-start text-[13px] text-[var(--text-tertiary)] hover:text-foreground transition-colors">‹ Goals</button>
        <p className="text-[13px] text-[var(--text-tertiary)]">Goal not found.</p>
      </div>
    );
  }

  const { goal, tasks } = linked;
  const currentValue = tasks
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + (t.goalContribution ?? 0), 0);

  return (
    <div className="flex h-full flex-col gap-6">
      <GoalDetailHeader
        goal={goal}
        onUpdate={async (data) => { await updateGoal({ goalId, ...data }); }}
        onMarkComplete={async () => { await completeGoal({ goalId }); onBack(); }}
        onAbandon={async () => { await abandonGoal({ goalId }); onBack(); }}
      />
      {goal.targetValue && (
        <GoalDetailProgress
          targetValue={goal.targetValue}
          currentValue={currentValue}
          unit={goal.unit}
        />
      )}
      <div className="flex-1 min-h-0">
        <GoalDetailLinked
          goalId={goalId}
          createdAt={goal.createdAt}
          endDate={goal.completedAt}
        />
      </div>
    </div>
  );
}
