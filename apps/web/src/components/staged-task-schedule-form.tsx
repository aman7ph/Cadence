import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Doc, Id } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoalLinkField } from "./goal-link-field";
import { ScheduleForm } from "./routines-schedule-form";
import type { ScheduleType } from "./routines-schedule-form";
import { StagedTaskDestinationToggle } from "./staged-task-destination-toggle";
import type { StagedTaskDestination } from "./staged-task-destination-toggle";

interface StagedTaskScheduleFormProps {
  stagedTask: Doc<"stagedTasks">;
  onDone: () => void;
}

export function StagedTaskScheduleForm({ stagedTask, onDone }: StagedTaskScheduleFormProps) {
  const schedule = useMutation(api.stagedTaskScheduling.schedule);
  const activeGoals = useQuery(api.goals.list, {});
  const today = todayLocal();

  const [destination, setDestination] = useState<StagedTaskDestination>(stagedTask.targetType ?? "task");
  const [title, setTitle] = useState(stagedTask.title);
  const [description, setDescription] = useState(stagedTask.description ?? "");
  const [date, setDate] = useState(stagedTask.scheduledDate ?? today);
  const [scheduleType, setScheduleType] = useState<ScheduleType>(stagedTask.routineScheduleType ?? "daily");
  const [customDays, setCustomDays] = useState<number[]>(stagedTask.routineCustomDays ?? []);
  const [goalId, setGoalId] = useState<Id<"goals"> | "">(stagedTask.goalId ?? "");
  const [contribution, setContribution] = useState(
    stagedTask.goalContribution !== undefined ? String(stagedTask.goalContribution) : "",
  );
  const [pending, setPending] = useState(false);

  const toggleDay = (d: number) =>
    setCustomDays((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d].sort()));

  const invalid =
    !title.trim() ||
    !date ||
    date < today ||
    (destination === "routine" && scheduleType === "custom" && customDays.length === 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid || pending) return;
    setPending(true);
    try {
      await schedule({
        stagedTaskId: stagedTask._id,
        title: title.trim(),
        description: description.trim() || undefined,
        targetType: destination,
        scheduledDate: date,
        routineScheduleType: destination === "routine" ? scheduleType : undefined,
        routineCustomDays:
          destination === "routine" && scheduleType === "custom" ? customDays : undefined,
        goalId: goalId || undefined,
        goalContribution: goalId && contribution ? parseFloat(contribution) : undefined,
        today,
      });
      onDone();
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-[12px] border border-[var(--border-subtle)] bg-card p-4 shadow-[var(--shadow-sm)]"
    >
      <StagedTaskDestinationToggle value={destination} disabled={pending} onChange={setDestination} />

      <Input
        placeholder={destination === "routine" ? "Routine name" : "Task title"}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={pending}
      />
      <Input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={pending}
      />

      <div className="flex flex-col gap-1">
        <input
          type="date"
          value={date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
          disabled={pending}
          style={{ colorScheme: "normal" }}
          className="w-full rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-3 py-2 text-[13px] text-foreground focus:border-[var(--border-accent)] focus:outline-none transition-colors disabled:opacity-50"
        />
        <p className="text-[12px] text-[var(--text-tertiary)]">
          {destination === "routine"
            ? "The routine starts on this day."
            : "The task lands on your day on this date."}
          {date === today && " Today means it's added right away."}
        </p>
      </div>

      {destination === "routine" && (
        <ScheduleForm
          scheduleType={scheduleType}
          customDays={customDays}
          disabled={pending}
          onChange={setScheduleType}
          onDayToggle={toggleDay}
        />
      )}

      <GoalLinkField
        goals={activeGoals}
        goalId={goalId}
        contribution={contribution}
        disabled={pending}
        onGoalChange={setGoalId}
        onContributionChange={setContribution}
      />

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending || invalid}>
          {date === today ? "Schedule for today" : "Schedule"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
