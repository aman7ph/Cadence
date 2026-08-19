import { useState } from "react";
import { todayLocal } from "@cadence/shared";
import { type ItemOptions, itemOptionsFrom } from "@cadence/shared";
import type { ScheduleType } from "../components/SchedulePicker";
import type { StagedTaskDestination } from "../components/StagedTaskDestinationPills";

interface Seed {
  targetType?: StagedTaskDestination;
  title?: string;
  description?: string;
  scheduledDate?: string;
  routineScheduleType?: ScheduleType;
  routineCustomDays?: number[];
  goalId?: string;
  goalContribution?: number;
  repeatTarget?: number;
  repeatIntervalMinutes?: number;
}

/**
 * The schedule sheet's form state, seeded from an existing staged task.
 *
 * Eight pieces of state with one validity rule between them — that rule is the
 * reason they belong together: a custom routine schedule with no days selected
 * is invalid, which is not something any single field can know.
 */
export function useScheduleForm(seed: Seed | null) {
  const today = todayLocal();

  const [destination, setDestination] = useState<StagedTaskDestination>(
    seed?.targetType ?? "task",
  );
  const [title, setTitle] = useState(seed?.title ?? "");
  const [desc, setDesc] = useState(seed?.description ?? "");
  const [date, setDate] = useState(seed?.scheduledDate ?? today);
  const [sched, setSched] = useState<ScheduleType>(
    seed?.routineScheduleType ?? "daily",
  );
  const [days, setDays] = useState<number[]>(seed?.routineCustomDays ?? []);
  const [options, setOptions] = useState<ItemOptions>(
    itemOptionsFrom(seed ?? {}),
  );

  const toggleDay = (d: number) =>
    setDays((p) =>
      p.includes(d) ? p.filter((x) => x !== d) : [...p, d].sort(),
    );

  const invalid =
    !title.trim() ||
    !date ||
    date < today ||
    (destination === "routine" && sched === "custom" && days.length === 0);

  return {
    today,
    destination,
    setDestination,
    title,
    setTitle,
    desc,
    setDesc,
    date,
    setDate,
    sched,
    setSched,
    days,
    toggleDay,
    options,
    setOptions,
    invalid,
  };
}
