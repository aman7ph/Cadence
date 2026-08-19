import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { ScheduleType } from "./SchedulePicker";
import { DatePickerModal } from "./DatePickerModal";
import { ItemOptionsFields } from "./ItemOptionsFields";
import { ScheduleDestinationFields } from "./ScheduleDestinationFields";
import { useScheduleForm } from "../lib/useScheduleForm";
import type { StagedTaskDestination } from "./StagedTaskDestinationPills";
import type { StagedTaskData } from "./StagedTaskItem";
import { radii } from "../lib/radii";
import { FormFooter } from "./ui/FormFooter";
import { SheetTitle } from "./ui/SheetTitle";
import { Sheet } from "./ui/Sheet";
import {
  type ItemOptions,
  itemOptionsFrom,
  itemOptionsToArgs,
} from "@cadence/shared";

interface Props {
  visible: boolean;
  stagedTask: StagedTaskData | null;
  onDone: () => void;
}

export function StagedTaskScheduleModal({
  visible,
  stagedTask,
  onDone,
}: Props) {
  const schedule = useMutation(api.stagedTaskScheduling.schedule);
  const form = useScheduleForm(stagedTask);
  const {
    today,
    destination,
    title,
    desc,
    date,
    sched,
    days,
    options,
    invalid,
  } = form;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (invalid || pending || !stagedTask) return;

    setPending(true);
    try {
      const { goalId, ...rest } = itemOptionsToArgs(options);
      await schedule({
        stagedTaskId: stagedTask._id,
        title: title.trim(),
        description: desc.trim() || undefined,
        targetType: destination,
        scheduledDate: date,
        routineScheduleType: destination === "routine" ? sched : undefined,
        routineCustomDays:
          destination === "routine" && sched === "custom" ? days : undefined,
        ...rest,
        goalId: goalId as Id<"goals"> | undefined,
        today,
      });
      onDone();
    } finally {
      setPending(false);
    }
  };

  const s = StyleSheet.create({
    scroll: { flexGrow: 0 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 8 },
  });

  return (
    <>
      <Sheet visible={visible} onClose={onDone} avoidKeyboard maxHeight="85%">
        <SheetTitle>
          {stagedTask?.scheduledDate ? "Edit schedule" : "Schedule staged task"}
        </SheetTitle>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ScheduleDestinationFields
            destination={destination}
            onDestinationChange={form.setDestination}
            title={title}
            onTitleChange={form.setTitle}
            desc={desc}
            onDescChange={form.setDesc}
            date={date}
            today={today}
            onPickDate={() => setPickerOpen(true)}
            sched={sched}
            onSchedChange={form.setSched}
            days={days}
            onDayToggle={form.toggleDay}
            disabled={pending}
          />
          <ItemOptionsFields
            value={options}
            onChange={form.setOptions}
            disabled={pending}
          />
        </ScrollView>
        <FormFooter
          onCancel={onDone}
          onSubmit={submit}
          submitLabel={date === today ? "Schedule for today" : "Schedule"}
          pending={pending}
          invalid={invalid}
        />
      </Sheet>
      {/* Sibling, not nested: the picker is its own sheet and two stacked
          Modals fight over the backdrop. */}
      <DatePickerModal
        visible={pickerOpen}
        value={date}
        min={today}
        onChange={form.setDate}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
