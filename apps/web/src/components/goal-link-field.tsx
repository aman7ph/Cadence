import type { Doc, Id } from "@cadence/backend/convex/_generated/dataModel";

interface GoalLinkFieldProps {
  goals: Doc<"goals">[] | undefined;
  goalId: Id<"goals"> | "";
  contribution: string;
  disabled: boolean;
  onGoalChange: (goalId: Id<"goals"> | "") => void;
  onContributionChange: (value: string) => void;
}

// The goal <select> + targetValue-gated contribution input shared shape used
// by add-task-form / routines-create-form, extracted for staged-task forms.
export function GoalLinkField({
  goals,
  goalId,
  contribution,
  disabled,
  onGoalChange,
  onContributionChange,
}: GoalLinkFieldProps) {
  if ((goals?.length ?? 0) === 0) return null;
  const selectedGoal = goals?.find((g) => g._id === goalId);

  return (
    <div className="flex items-center gap-2">
      <select
        value={goalId}
        onChange={(e) => {
          onGoalChange(e.target.value as Id<"goals"> | "");
          onContributionChange("");
        }}
        disabled={disabled}
        className="flex-1 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-3 py-1.5 text-[13px] text-foreground focus:border-[var(--action-primary)] focus:outline-none transition-colors disabled:opacity-50"
      >
        <option value="">Link to goal (optional)</option>
        {(goals ?? []).map((g) => (
          <option key={g._id} value={g._id}>
            {g.title}
          </option>
        ))}
      </select>
      {selectedGoal?.targetValue && (
        <input
          type="number"
          value={contribution}
          onChange={(e) => onContributionChange(e.target.value)}
          placeholder={selectedGoal.unit ?? "amount"}
          disabled={disabled}
          className="w-24 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-2 py-1.5 text-[13px] text-foreground placeholder:text-[var(--text-tertiary)] focus:border-[var(--action-primary)] focus:outline-none transition-colors disabled:opacity-50"
        />
      )}
    </div>
  );
}
