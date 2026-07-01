import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScheduleForm } from "./routines-schedule-form";
import type { ScheduleType } from "./routines-schedule-form";

interface EditRoutineFormProps {
  routineId: Id<"routines">;
  initialName: string;
  initialDescription?: string;
  initialScheduleType: ScheduleType;
  initialCustomDays?: number[];
  initialGoalId?: Id<"goals">;
  initialGoalContribution?: number;
  onDone: () => void;
}

export function EditRoutineForm({
  routineId,
  initialName,
  initialDescription,
  initialScheduleType,
  initialCustomDays,
  initialGoalId,
  initialGoalContribution,
  onDone,
}: EditRoutineFormProps) {
  const update = useMutation(api.routineManagement.update);
  const activeGoals = useQuery(api.goals.list, {});
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [scheduleType, setScheduleType] = useState<ScheduleType>(initialScheduleType);
  const [customDays, setCustomDays] = useState<number[]>(initialCustomDays ?? []);
  const [goalId, setGoalId] = useState<Id<"goals"> | "">(initialGoalId ?? "");
  const [contribution, setContribution] = useState(initialGoalContribution?.toString() ?? "");
  const [pending, setPending] = useState(false);

  const selectedGoal = activeGoals?.find((g) => g._id === goalId);

  const toggleDay = (d: number) =>
    setCustomDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (scheduleType === "custom" && customDays.length === 0))
      return;
    setPending(true);
    try {
      await update({
        routineId,
        name: name.trim(),
        description: description.trim() || undefined,
        scheduleType,
        customDays: scheduleType === "custom" ? customDays : undefined,
        goalId: goalId || undefined,
        goalContribution:
          goalId && contribution ? parseFloat(contribution) : undefined,
      });
      onDone();
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-[12px] border border-[var(--border-accent)] bg-card p-4 shadow-[var(--shadow-sm)]"
    >
      <Input
        autoFocus
        placeholder="Routine name"
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
        <Button
          type="submit"
          size="sm"
          disabled={
            pending ||
            !name.trim() ||
            (scheduleType === "custom" && customDays.length === 0)
          }
        >
          Save changes
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onDone}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
