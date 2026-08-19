import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Doc } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";
import { FormDrawer } from "@/components/ui/form-drawer";
import { Input } from "@/components/ui/input";
import {
  ItemOptionsFields,
  itemOptionsFrom,
  itemOptionsToArgs,
  type ItemOptions,
} from "./item-options-fields";
import { ScheduleForm, type ScheduleType } from "./routines-schedule-form";
import {
  StagedTaskDestinationToggle,
  type StagedTaskDestination,
} from "./staged-task-destination-toggle";

/**
 * Assign a staged task to a day, as a task or a routine.
 *
 * Uses `ItemOptionsFields` — the same goal-contribution and spread block as
 * Today and Routines (D18). It previously used `GoalLinkField` +
 * `RepeatSection`, which were a different control set for identical settings.
 */
export function StagedTaskScheduleDrawer({
  stagedTask,
  onClose,
}: {
  stagedTask: Doc<"stagedTasks">;
  onClose: () => void;
}) {
  const schedule = useMutation(api.stagedTaskScheduling.schedule);
  const today = todayLocal();

  const [destination, setDestination] = useState<StagedTaskDestination>(
    stagedTask.targetType ?? "task",
  );
  const [title, setTitle] = useState(stagedTask.title);
  const [description, setDescription] = useState(stagedTask.description ?? "");
  const [date, setDate] = useState(stagedTask.scheduledDate ?? today);
  const [scheduleType, setScheduleType] = useState<ScheduleType>(
    stagedTask.routineScheduleType ?? "daily",
  );
  const [customDays, setCustomDays] = useState<number[]>(
    stagedTask.routineCustomDays ?? [],
  );
  const [options, setOptions] = useState<ItemOptions>(
    itemOptionsFrom(stagedTask),
  );

  const toggleDay = (d: number) =>
    setCustomDays((p) =>
      p.includes(d) ? p.filter((x) => x !== d) : [...p, d].sort(),
    );

  // A past date would promote into a day that has already rolled over, and a
  // custom routine with no days selected would never run.
  const invalid =
    !title.trim() ||
    !date ||
    date < today ||
    (destination === "routine" &&
      scheduleType === "custom" &&
      customDays.length === 0);

  const submit = async () => {
    await schedule({
      stagedTaskId: stagedTask._id,
      title: title.trim(),
      description: description.trim() || undefined,
      targetType: destination,
      scheduledDate: date,
      routineScheduleType: destination === "routine" ? scheduleType : undefined,
      routineCustomDays:
        destination === "routine" && scheduleType === "custom"
          ? customDays
          : undefined,
      ...itemOptionsToArgs(options),
      today,
    });
  };

  return (
    <FormDrawer
      open
      onOpenChange={(o) => !o && onClose()}
      title="Schedule task"
      description="Choose where it lands and on which day. Today means it is added right away."
      submitLabel={date === today ? "Schedule for today" : "Schedule"}
      submitDisabled={invalid}
      onSubmit={submit}
    >
      <StagedTaskDestinationToggle
        value={destination}
        disabled={false}
        onChange={setDestination}
      />
      <Input
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <label className="flex flex-col gap-1.5">
        <span className="text-[11.5px] text-[var(--text-secondary)]">
          The task lands on your day on this date.
        </span>
        <Input
          type="date"
          min={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      {destination === "routine" && (
        <ScheduleForm
          scheduleType={scheduleType}
          customDays={customDays}
          disabled={false}
          onChange={setScheduleType}
          onDayToggle={toggleDay}
        />
      )}
      <ItemOptionsFields value={options} onChange={setOptions} />
    </FormDrawer>
  );
}
