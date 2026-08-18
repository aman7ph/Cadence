import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";
import {
  KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SchedulePicker } from "./SchedulePicker";
import type { ScheduleType } from "./SchedulePicker";
import { DatePickerModal } from "./DatePickerModal";
import { ItemOptionsFields } from "./ItemOptionsFields";
import { StagedTaskDestinationPills } from "./StagedTaskDestinationPills";
import type { StagedTaskDestination } from "./StagedTaskDestinationPills";
import type { StagedTaskData } from "./StagedTaskItem";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { FormFooter } from "./ui/FormFooter";
import {
  type ItemOptions,
  itemOptionsFrom,
  itemOptionsToArgs,
} from "@cadence/shared";
import { fmtLong } from "../lib/dateUtils";

interface Props { visible: boolean; stagedTask: StagedTaskData | null; onDone: () => void }

export function StagedTaskScheduleModal({ visible, stagedTask, onDone }: Props) {
  const c = useColors();
  const schedule = useMutation(api.stagedTaskScheduling.schedule);
  const today = todayLocal();

  const [destination, setDestination] = useState<StagedTaskDestination>(stagedTask?.targetType ?? "task");
  const [title, setTitle] = useState(stagedTask?.title ?? "");
  const [desc, setDesc] = useState(stagedTask?.description ?? "");
  const [date, setDate] = useState(stagedTask?.scheduledDate ?? today);
  const [sched, setSched] = useState<ScheduleType>(stagedTask?.routineScheduleType ?? "daily");
  const [days, setDays] = useState<number[]>(stagedTask?.routineCustomDays ?? []);
  const [options, setOptions] = useState<ItemOptions>(itemOptionsFrom(stagedTask ?? {}));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const invalid =
    !title.trim() || !date || date < today ||
    (destination === "routine" && sched === "custom" && days.length === 0);
  const toggleDay = (d: number) =>
    setDays((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d].sort()));

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
        routineCustomDays: destination === "routine" && sched === "custom" ? days : undefined,
        ...rest,
        goalId: goalId as Id<"goals"> | undefined,
        today,
      });
      onDone();
    } finally { setPending(false); }
  };

  const s = StyleSheet.create({
    overlay:     { flex: 1, justifyContent: "flex-end", backgroundColor: c.scrim },
    backdrop:    { flex: 1 },
    sheet:       { backgroundColor: c.bgE, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet,
                   borderWidth: 1, borderBottomWidth: 0, borderColor: c.bd2,
                   maxHeight: "85%", paddingBottom: 32 },
    handle:      { width: 38, height: 4, borderRadius: 2, backgroundColor: c.bd3,
                   alignSelf: "center", marginTop: 10, marginBottom: 4 },
    title:       { fontSize: 16, fontWeight: "700", color: c.t1,
                   paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14 },
    scroll:      { flexGrow: 0 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 8 },
    input:       { backgroundColor: c.card, borderWidth: 1, borderColor: c.bd2,
                   borderRadius: radii.sm, paddingHorizontal: 14, paddingVertical: 11,
                   fontSize: 14, color: c.t1 },
    mt:          { marginTop: 10 },
    dateTxt:     { fontSize: 14, color: c.t1 },
    hint:        { fontSize: 11, color: c.t3, marginTop: 5, paddingHorizontal: 2 },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDone}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onDone} />
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title}>
            {stagedTask?.scheduledDate ? "Edit schedule" : "Schedule staged task"}
          </Text>
          <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
            <StagedTaskDestinationPills value={destination} disabled={pending} onChange={setDestination} />
            <TextInput style={[s.input, s.mt]} value={title} onChangeText={setTitle}
              placeholder={destination === "routine" ? "Routine name" : "Task title"}
              placeholderTextColor={c.t3} editable={!pending} />
            <TextInput style={[s.input, s.mt]} value={desc} onChangeText={setDesc}
              placeholder="Description (optional)" placeholderTextColor={c.t3} editable={!pending} />
            <TouchableOpacity style={[s.input, s.mt]} onPress={() => setPickerOpen(true)} disabled={pending} activeOpacity={0.7}>
              <Text style={s.dateTxt}>{fmtLong(date)}</Text>
            </TouchableOpacity>
            <Text style={s.hint}>
              {destination === "routine"
                ? "The routine starts on this day."
                : "The task lands on your day on this date."}
              {date === today ? " Today means it's added right away." : ""}
            </Text>
            {destination === "routine" && (
              <View style={s.mt}>
                <SchedulePicker scheduleType={sched} customDays={days}
                  disabled={pending} onChange={setSched} onDayToggle={toggleDay} />
              </View>
            )}
            <ItemOptionsFields value={options} onChange={setOptions} disabled={pending} />
          </ScrollView>
          <FormFooter onCancel={onDone} onSubmit={submit}
                      submitLabel={date === today ? "Schedule for today" : "Schedule"}
                      pending={pending} invalid={invalid} />
        </View>
      </KeyboardAvoidingView>
      <DatePickerModal visible={pickerOpen} value={date} min={today}
        onChange={setDate} onClose={() => setPickerOpen(false)} />
    </Modal>
  );
}
