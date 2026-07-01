import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Plus, Target } from "lucide-react";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { api } from "@cadence/backend/convex/_generated/api";
import { todayLocal } from "@cadence/shared";

import { Input } from "@/components/ui/input";

export function AddTaskForm() {
  const create = useMutation(api.dailyTasks.create);
  const activeGoals = useQuery(api.goals.list, {});
  const [title, setTitle] = useState("");
  const [showGoal, setShowGoal] = useState(false);
  const [goalId, setGoalId] = useState<Id<"goals"> | "">("");
  const [contribution, setContribution] = useState("");
  const [pending, setPending] = useState(false);

  const selectedGoal = activeGoals?.find((g) => g._id === goalId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || pending) return;
    setPending(true);
    try {
      await create({
        title: trimmed,
        today: todayLocal(),
        goalId: goalId || undefined,
        goalContribution:
          goalId && contribution ? parseFloat(contribution) : undefined,
      });
      setTitle("");
      setGoalId("");
      setContribution("");
      setShowGoal(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Plus className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Add a task for today"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={pending}
            className="pl-9"
          />
        </div>
        {(activeGoals?.length ?? 0) > 0 && (
          <button
            type="button"
            onClick={() => setShowGoal((s) => !s)}
            title="Link to goal"
            className={`shrink-0 rounded-[8px] p-1.5 transition-colors ${
              showGoal
                ? "bg-[var(--action-primary)] text-white"
                : "text-[var(--text-tertiary)] hover:text-foreground hover:bg-[var(--surface-hover)]"
            }`}
          >
            <Target className="size-4" />
          </button>
        )}
      </div>
      {showGoal && (
        <div className="flex items-center gap-2">
          <select
            value={goalId}
            onChange={(e) => {
              setGoalId(e.target.value as Id<"goals"> | "");
              setContribution("");
            }}
            className="flex-1 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-3 py-1.5 text-[13px] text-foreground focus:border-[var(--action-primary)] focus:outline-none transition-colors"
          >
            <option value="">No goal</option>
            {(activeGoals ?? []).map((g) => (
              <option key={g._id} value={g._id}>
                {g.title}
              </option>
            ))}
          </select>
          {selectedGoal?.targetValue && (
            <input
              type="number"
              value={contribution}
              onChange={(e) => setContribution(e.target.value)}
              placeholder={selectedGoal.unit ?? "amount"}
              className="w-24 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-2 py-1.5 text-[13px] text-foreground placeholder:text-[var(--text-tertiary)] focus:border-[var(--action-primary)] focus:outline-none transition-colors"
            />
          )}
        </div>
      )}
    </form>
  );
}
