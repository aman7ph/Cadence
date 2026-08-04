import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Plus, Repeat, Target } from "lucide-react";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { api } from "@cadence/backend/convex/_generated/api";
import {
  isValidRepeatIntervalMinutes,
  isValidRepeatTarget,
  todayLocal,
} from "@cadence/shared";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskRepeatField } from "@/components/task-repeat-field";

const toggleClass = (active: boolean) =>
  `shrink-0 rounded-[8px] p-1.5 transition-colors ${active ? "bg-[var(--action-primary)] text-white" : "text-[var(--text-tertiary)] hover:text-foreground hover:bg-[var(--surface-hover)]"}`;

export function AddTaskForm() {
  const create = useMutation(api.dailyTasks.create);
  const activeGoals = useQuery(api.goals.list, {});
  const [title, setTitle] = useState("");
  const [showGoal, setShowGoal] = useState(false);
  const [goalId, setGoalId] = useState<Id<"goals"> | "">("");
  const [contribution, setContribution] = useState("");
  const [showRepeat, setShowRepeat] = useState(false);
  const [repeatTarget, setRepeatTarget] = useState("");
  const [repeatInterval, setRepeatInterval] = useState("60");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selectedGoal = activeGoals?.find((g) => g._id === goalId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || pending) return;

    const target = showRepeat ? Number(repeatTarget) : undefined;
    const interval = showRepeat ? Number(repeatInterval) : undefined;
    if (target !== undefined && !isValidRepeatTarget(target)) {
      setError("Enter how many times today — a whole number from 2 to 100.");
      return;
    }
    if (interval !== undefined && !isValidRepeatIntervalMinutes(interval)) {
      setError("Enter the wait as whole minutes from 0 to 1440 (24h).");
      return;
    }

    setError(null);
    setPending(true);
    try {
      await create({
        title: trimmed,
        today: todayLocal(),
        goalId: goalId || undefined,
        goalContribution:
          goalId && contribution ? parseFloat(contribution) : undefined,
        repeatTarget: target,
        repeatIntervalMinutes: interval,
      });
      setTitle("");
      setGoalId("");
      setContribution("");
      setShowGoal(false);
      setShowRepeat(false);
      setRepeatTarget("");
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
        <button type="button" onClick={() => setShowRepeat((s) => !s)}
          title="Repeat several times today" className={toggleClass(showRepeat)}>
          <Repeat className="size-4" />
        </button>
        {(activeGoals?.length ?? 0) > 0 && (
          <button type="button" onClick={() => setShowGoal((s) => !s)}
            title="Link to goal" className={toggleClass(showGoal)}>
            <Target className="size-4" />
          </button>
        )}
        {/* Load-bearing, not decoration: a form with no submit button only
            submits on Enter while it has exactly one text-ish field. */}
        <Button type="submit" size="sm" disabled={pending || !title.trim()}>
          Add
        </Button>
      </div>
      {showRepeat && (
        <TaskRepeatField
          target={repeatTarget}
          interval={repeatInterval}
          onTargetChange={(v) => { setRepeatTarget(v); setError(null); }}
          onIntervalChange={(v) => { setRepeatInterval(v); setError(null); }}
        />
      )}
      {error && <p className="text-[12px] text-[var(--red-600)]">{error}</p>}
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
