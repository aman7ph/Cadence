import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";
import { FormDrawer } from "@/components/ui/form-drawer";
import { Input } from "@/components/ui/input";
import {
  EMPTY_ITEM_OPTIONS,
  ItemOptionsFields,
  itemOptionsFrom,
  itemOptionsToArgs,
  type ItemOptions,
} from "./item-options-fields";
import { ScheduleForm, type ScheduleType } from "./routines-schedule-form";

export interface RoutineFormValues {
  _id: Id<"routines">;
  name: string;
  description?: string;
  scheduleType: ScheduleType;
  customDays?: number[];
  goalId?: Id<"goals">;
  goalContribution?: number;
  repeatTarget?: number;
  repeatIntervalMinutes?: number;
}

/**
 * Create AND edit, in one form. They previously lived in two files that
 * differed only in initial values and which mutation they called — the same
 * duplication D15 forbids, and it had already drifted.
 *
 * Mount it conditionally rather than toggling an `open` prop: mounting is what
 * seeds the fields from `routine`, so a fresh mount is a fresh form.
 */
export function RoutineFormDrawer({
  routine,
  onClose,
}: {
  /** Omit to create. */
  routine?: RoutineFormValues;
  onClose: () => void;
}) {
  const create = useMutation(api.routines.create);
  const update = useMutation(api.routineManagement.update);

  const [name, setName] = useState(routine?.name ?? "");
  const [description, setDescription] = useState(routine?.description ?? "");
  const [scheduleType, setScheduleType] = useState<ScheduleType>(
    routine?.scheduleType ?? "daily",
  );
  const [customDays, setCustomDays] = useState<number[]>(
    routine?.customDays ?? [],
  );
  const [options, setOptions] = useState<ItemOptions>(
    routine ? itemOptionsFrom(routine) : EMPTY_ITEM_OPTIONS,
  );

  const toggleDay = (d: number) =>
    setCustomDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );

  // A custom schedule with no days selected would never run.
  const invalid =
    !name.trim() || (scheduleType === "custom" && customDays.length === 0);

  const submit = async () => {
    const shared = {
      name: name.trim(),
      description: description.trim() || undefined,
      scheduleType,
      customDays: scheduleType === "custom" ? customDays : undefined,
      ...itemOptionsToArgs(options),
    };
    if (routine) {
      await update({ routineId: routine._id, ...shared });
    } else {
      await create({ ...shared, today: todayLocal() });
    }
  };

  return (
    <FormDrawer
      open
      onOpenChange={(o) => !o && onClose()}
      title={routine ? "Edit routine" : "New routine"}
      description={
        routine
          ? "Changes apply from today onward; past days keep their history."
          : "A habit that repeats on a schedule and counts toward your streak."
      }
      submitLabel={routine ? "Save changes" : "Create routine"}
      submitDisabled={invalid}
      onSubmit={submit}
    >
      <Input
        autoFocus
        placeholder="Routine name (e.g. Morning run)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <ScheduleForm
        scheduleType={scheduleType}
        customDays={customDays}
        disabled={false}
        onChange={setScheduleType}
        onDayToggle={toggleDay}
      />
      <ItemOptionsFields value={options} onChange={setOptions} />
    </FormDrawer>
  );
}
