import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoalLinkField } from "./goal-link-field";
import { RepeatSection } from "./repeat-section";
import { ScheduleForm } from "./routines-schedule-form";
import type { ScheduleType } from "./routines-schedule-form";
import { useRepeatFields } from "@/lib/use-repeat-fields";

interface EditRoutineFormProps {
  routineId: Id<"routines">;
  initialName: string;
  initialDescription?: string;
  initialScheduleType: ScheduleType;
  initialCustomDays?: number[];
  initialGoalId?: Id<"goals">;
  initialGoalContribution?: number;
  initialRepeatTarget?: number;
  initialRepeatIntervalMinutes?: number;
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
  initialRepeatTarget,
  initialRepeatIntervalMinutes,
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
  const repeat = useRepeatFields(initialRepeatTarget, initialRepeatIntervalMinutes);

  const toggleDay = (d: number) =>
    setCustomDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (scheduleType === "custom" && customDays.length === 0))
      return;
    const repeatArgs = repeat.collect();
    if (!repeatArgs) return;
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
        ...repeatArgs,
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
      <GoalLinkField
        goals={activeGoals}
        goalId={goalId}
        contribution={contribution}
        disabled={pending}
        onGoalChange={setGoalId}
        onContributionChange={setContribution}
      />
      <RepeatSection repeat={repeat} disabled={pending} />
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
        <Button type="button" size="sm" variant="ghost" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
