import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";
import {
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { ItemOptionsFields } from "./ItemOptionsFields";
import { SchedulePicker } from "./SchedulePicker";
import type { ScheduleType } from "./SchedulePicker";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { FormFooter } from "./ui/FormFooter";
import { Sheet } from "./ui/Sheet";
import {
  type ItemOptions,
  itemOptionsFrom,
  itemOptionsToArgs,
} from "@cadence/shared";

export interface RoutineForForm {
  _id: Id<"routines">; name: string; description?: string;
  scheduleType: ScheduleType; customDays?: number[];
  goalId?: Id<"goals">; goalContribution?: number;
  repeatTarget?: number; repeatIntervalMinutes?: number;
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
  const [options, setOptions] = useState<ItemOptions>(itemOptionsFrom(routine ?? {}));
  const [pending, setPend] = useState(false);

  const invalid = !name.trim() || (sched === "custom" && days.length === 0);
  const toggleDay = (d: number) =>
    setDays((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d].sort());

  const submit = async () => {
    if (invalid || pending) return;

    setPend(true);
    try {
      const { goalId, ...rest } = itemOptionsToArgs(options);
      const base = {
        name: name.trim(), description: desc.trim() || undefined,
        scheduleType: sched, customDays: sched === "custom" ? days : undefined,
        ...rest,
        goalId: goalId as Id<"goals"> | undefined,
      };
      routine ? await update({ routineId: routine._id, ...base })
              : await create({ ...base, today: todayLocal() });
      onDone();
    } finally { setPend(false); }
  };

  const s = StyleSheet.create({
    title:       { fontSize: 16, fontWeight: "700", color: c.t1,
                   paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14 },
    scroll:      { flexGrow: 0 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 8 },
    input:       { backgroundColor: c.card, borderWidth: 1, borderColor: c.bd2,
                   borderRadius: radii.sm, paddingHorizontal: 14, paddingVertical: 11,
                   fontSize: 14, color: c.t1 },
    mt:          { marginTop: 10 },
    goalChip:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                   borderWidth: 1, borderColor: c.bd2, marginRight: 7 },
    goalChipOn:  { borderColor: c.prim, backgroundColor: c.accBg },
    goalTxt:     { fontSize: 12, color: c.t3, maxWidth: 140 },
    goalTxtOn:   { color: c.tacc, fontWeight: "600" },
  });

  return (
    <Sheet visible={visible} onClose={onDone} avoidKeyboard maxHeight="85%">
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
            <View style={s.mt}>
              <ItemOptionsFields value={options} onChange={setOptions} disabled={pending} />
            </View>
          </ScrollView>
          <FormFooter onCancel={onDone} onSubmit={submit}
                      submitLabel={routine ? "Save changes" : "Add routine"}
                      pending={pending} invalid={invalid} />
        </Sheet>
  );
}
