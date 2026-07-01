import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Plus } from "lucide-react";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { api } from "@cadence/backend/convex/_generated/api";
import { todayLocal } from "@cadence/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScheduleForm } from "./routines-schedule-form";
import type { ScheduleType } from "./routines-schedule-form";

export function CreateRoutineForm() {
  const create = useMutation(api.routines.create);
  const activeGoals = useQuery(api.goals.list, {});
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleType, setScheduleType] = useState<ScheduleType>("daily");
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [goalId, setGoalId] = useState<Id<"goals"> | "">("");
  const [contribution, setContribution] = useState("");
  const [pending, setPending] = useState(false);

  const selectedGoal = activeGoals?.find((g) => g._id === goalId);

  const reset = () => {
    setName("");
    setDescription("");
    setScheduleType("daily");
    setCustomDays([]);
    setGoalId("");
    setContribution("");
    setExpanded(false);
  };

  const toggleDay = (d: number) => setCustomDays((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d].sort());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (scheduleType === "custom" && customDays.length === 0))
      return;
    setPending(true);
    try {
      await create({
        name: name.trim(),
        description: description.trim() || undefined,
        scheduleType,
        customDays: scheduleType === "custom" ? customDays : undefined,
        today: todayLocal(),
        goalId: goalId || undefined,
        goalContribution: goalId && contribution ? parseFloat(contribution) : undefined,
      });
      reset();
    } finally {
      setPending(false);
    }
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 self-start rounded-[10px] px-3.5 py-2 text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-foreground transition-all duration-150"
      >
        <Plus className="size-4" />
        New routine
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-[12px] border border-[var(--border-subtle)] bg-card p-4 shadow-[var(--shadow-sm)]"
    >
      <Input
        autoFocus
        placeholder="Routine name (e.g. Morning run)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={pending}
      />
      <Input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={pending}
      />
      <ScheduleForm
        scheduleType={scheduleType}
        customDays={customDays}
        disabled={pending}
        onChange={setScheduleType}
        onDayToggle={toggleDay}
      />
      {(activeGoals?.length ?? 0) > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={goalId}
            onChange={(e) => {
              setGoalId(e.target.value as Id<"goals"> | "");
              setContribution("");
            }}
            disabled={pending}
            className="flex-1 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-3 py-1.5 text-[13px] text-foreground focus:border-[var(--action-primary)] focus:outline-none transition-colors disabled:opacity-50"
          >
            <option value="">Link to goal (optional)</option>
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
              disabled={pending}
              className="w-24 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-2 py-1.5 text-[13px] text-foreground placeholder:text-[var(--text-tertiary)] focus:border-[var(--action-primary)] focus:outline-none transition-colors disabled:opacity-50"
            />
          )}
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm"
          disabled={pending || !name.trim() || (scheduleType === "custom" && customDays.length === 0)}>
          Add routine
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={reset}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
