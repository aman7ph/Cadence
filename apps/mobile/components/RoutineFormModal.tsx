import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SchedulePicker } from "./SchedulePicker";
import type { ScheduleType } from "./SchedulePicker";
import { useColors } from "../lib/theme";

export interface RoutineForForm {
  _id: Id<"routines">; name: string; description?: string;
  scheduleType: ScheduleType; customDays?: number[];
  goalId?: Id<"goals">; goalContribution?: number;
}
interface Props { visible: boolean; routine: RoutineForForm | null; onDone: () => void }

export function RoutineFormModal({ visible, routine, onDone }: Props) {
  const c = useColors();
  const create = useMutation(api.routines.create);
  const update = useMutation(api.routineManagement.update);
  const goals  = useQuery(api.goals.list, {});

  const [name, setName]   = useState(routine?.name ?? "");
  const [desc, setDesc]   = useState(routine?.description ?? "");
  const [sched, setSched] = useState<ScheduleType>(routine?.scheduleType ?? "daily");
  const [days, setDays]   = useState<number[]>(routine?.customDays ?? []);
  const [goalId, setGoalId] = useState<Id<"goals"> | "">(routine?.goalId ?? "");
  const [contrib, setCtb] = useState(routine?.goalContribution?.toString() ?? "");
  const [pending, setPend] = useState(false);

  const selGoal = goals?.find((g) => g._id === goalId);
  const invalid = !name.trim() || (sched === "custom" && days.length === 0);
  const toggleDay = (d: number) =>
    setDays((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d].sort());

  const submit = async () => {
    if (invalid || pending) return;
    setPend(true);
    try {
      const base = {
        name: name.trim(), description: desc.trim() || undefined,
        scheduleType: sched, customDays: sched === "custom" ? days : undefined,
        goalId: goalId || undefined,
        goalContribution: goalId && contrib ? parseFloat(contrib) : undefined,
      };
      routine ? await update({ routineId: routine._id, ...base })
              : await create({ ...base, today: todayLocal() });
      onDone();
    } finally { setPend(false); }
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
    goalChip:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                   borderWidth: 1, borderColor: c.bd2, marginRight: 7 },
    goalChipOn:  { borderColor: c.prim, backgroundColor: c.accBg },
    goalTxt:     { fontSize: 12, color: c.t3, maxWidth: 140 },
    goalTxtOn:   { color: c.tacc, fontWeight: "600" },
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
          <Text style={s.title}>{routine ? "Edit routine" : "New routine"}</Text>
          <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
            <TextInput style={s.input} value={name} onChangeText={setName}
              placeholder="Routine name" placeholderTextColor={c.t3}
              autoFocus={!routine} editable={!pending} />
            <TextInput style={[s.input, s.mt]} value={desc} onChangeText={setDesc}
              placeholder="Description (optional)" placeholderTextColor={c.t3} editable={!pending} />
            <View style={s.mt}>
              <SchedulePicker scheduleType={sched} customDays={days}
                disabled={pending} onChange={setSched} onDayToggle={toggleDay} />
            </View>
            {(goals?.length ?? 0) > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.mt}>
                <TouchableOpacity onPress={() => setGoalId("")} style={[s.goalChip, !goalId && s.goalChipOn]}>
                  <Text style={[s.goalTxt, !goalId && s.goalTxtOn]}>No goal</Text>
                </TouchableOpacity>
                {goals!.map((g) => (
                  <TouchableOpacity key={g._id} onPress={() => setGoalId(g._id)}
                    style={[s.goalChip, goalId === g._id && s.goalChipOn]}>
                    <Text style={[s.goalTxt, goalId === g._id && s.goalTxtOn]} numberOfLines={1}>{g.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            {!!goalId && selGoal?.targetValue != null && (
              <TextInput style={[s.input, s.mt]} value={contrib} onChangeText={setCtb}
                placeholder={selGoal.unit ?? "Contribution amount"}
                placeholderTextColor={c.t3} keyboardType="numeric" editable={!pending} />
            )}
          </ScrollView>
          <View style={s.footer}>
            <TouchableOpacity onPress={onDone} disabled={pending} style={s.cancelBtn}>
              <Text style={s.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submit} disabled={invalid || pending} style={[s.saveBtn, invalid && s.saveDim]}>
              {pending ? <ActivityIndicator color="#fff" size="small" />
                       : <Text style={s.saveTxt}>{routine ? "Save changes" : "Add routine"}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
