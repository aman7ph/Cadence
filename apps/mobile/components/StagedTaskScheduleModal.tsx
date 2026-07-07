import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SchedulePicker } from "./SchedulePicker";
import type { ScheduleType } from "./SchedulePicker";
import { DatePickerModal } from "./DatePickerModal";
import { GoalChipsField } from "./GoalChipsField";
import { StagedTaskDestinationPills } from "./StagedTaskDestinationPills";
import type { StagedTaskDestination } from "./StagedTaskDestinationPills";
import type { StagedTaskData } from "./StagedTaskItem";
import { useColors } from "../lib/theme";
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
  const [goalId, setGoalId] = useState<Id<"goals"> | "">(stagedTask?.goalId ?? "");
  const [contrib, setCtb] = useState(stagedTask?.goalContribution?.toString() ?? "");
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
      await schedule({
        stagedTaskId: stagedTask._id,
        title: title.trim(),
        description: desc.trim() || undefined,
        targetType: destination,
        scheduledDate: date,
        routineScheduleType: destination === "routine" ? sched : undefined,
        routineCustomDays: destination === "routine" && sched === "custom" ? days : undefined,
        goalId: goalId || undefined,
        goalContribution: goalId && contrib ? parseFloat(contrib) : undefined,
        today,
      });
      onDone();
    } finally { setPending(false); }
  };

  const s = StyleSheet.create({
    overlay:     { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
    backdrop:    { flex: 1 },
    sheet:       { backgroundColor: c.bgE, borderTopLeftRadius: 22, borderTopRightRadius: 22,
                   borderWidth: 1, borderBottomWidth: 0, borderColor: c.bd2,
                   maxHeight: "85%", paddingBottom: 32 },
    handle:      { width: 38, height: 4, borderRadius: 2, backgroundColor: c.bd3,
                   alignSelf: "center", marginTop: 10, marginBottom: 4 },
    title:       { fontSize: 16, fontWeight: "700", color: c.t1,
                   paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14 },
    scroll:      { flexGrow: 0 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 8 },
    input:       { backgroundColor: c.card, borderWidth: 1, borderColor: c.bd2,
                   borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
                   fontSize: 14, color: c.t1 },
    mt:          { marginTop: 10 },
    dateTxt:     { fontSize: 14, color: c.t1 },
    hint:        { fontSize: 11, color: c.t3, marginTop: 5, paddingHorizontal: 2 },
    footer:      { flexDirection: "row", justifyContent: "flex-end", gap: 8,
                   paddingHorizontal: 20, paddingTop: 12 },
    cancelBtn:   { paddingHorizontal: 14, paddingVertical: 10 },
    cancelTxt:   { fontSize: 13, color: c.t3 },
    saveBtn:     { backgroundColor: c.prim, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
    saveDim:     { opacity: 0.45 },
    saveTxt:     { fontSize: 13, fontWeight: "600", color: "#fff" },
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
            <GoalChipsField goalId={goalId} contribution={contrib} disabled={pending}
              onGoalChange={(id) => { setGoalId(id); setCtb(""); }} onContributionChange={setCtb} />
          </ScrollView>
          <View style={s.footer}>
            <TouchableOpacity onPress={onDone} disabled={pending} style={s.cancelBtn}>
              <Text style={s.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submit} disabled={invalid || pending} style={[s.saveBtn, invalid && s.saveDim]}>
              {pending ? <ActivityIndicator color="#fff" size="small" />
                       : <Text style={s.saveTxt}>{date === today ? "Schedule for today" : "Schedule"}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      <DatePickerModal visible={pickerOpen} value={date} min={today}
        onChange={setDate} onClose={() => setPickerOpen(false)} />
    </Modal>
  );
}
