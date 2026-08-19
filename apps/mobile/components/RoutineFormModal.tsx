import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
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
import { ItemOptionsFields } from "./ItemOptionsFields";
import { SchedulePicker } from "./SchedulePicker";
import type { ScheduleType } from "./SchedulePicker";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { FormFooter } from "./ui/FormFooter";
import { SheetTitle } from "./ui/SheetTitle";
import { TextField } from "./ui/TextField";
import { Sheet } from "./ui/Sheet";
import {
  type ItemOptions,
  itemOptionsFrom,
  itemOptionsToArgs,
} from "@cadence/shared";

export interface RoutineForForm {
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
interface Props {
  visible: boolean;
  routine: RoutineForForm | null;
  onDone: () => void;
}

export function RoutineFormModal({ visible, routine, onDone }: Props) {
  const c = useColors();
  const create = useMutation(api.routines.create);
  const update = useMutation(api.routineManagement.update);
  const goals = useQuery(api.goals.list, {});

  const [name, setName] = useState(routine?.name ?? "");
  const [desc, setDesc] = useState(routine?.description ?? "");
  const [sched, setSched] = useState<ScheduleType>(
    routine?.scheduleType ?? "daily",
  );
  const [days, setDays] = useState<number[]>(routine?.customDays ?? []);
  const [options, setOptions] = useState<ItemOptions>(
    itemOptionsFrom(routine ?? {}),
  );
  const [pending, setPend] = useState(false);

  const invalid = !name.trim() || (sched === "custom" && days.length === 0);
  const toggleDay = (d: number) =>
    setDays((p) =>
      p.includes(d) ? p.filter((x) => x !== d) : [...p, d].sort(),
    );

  const submit = async () => {
    if (invalid || pending) return;

    setPend(true);
    try {
      const { goalId, ...rest } = itemOptionsToArgs(options);
      const base = {
        name: name.trim(),
        description: desc.trim() || undefined,
        scheduleType: sched,
        customDays: sched === "custom" ? days : undefined,
        ...rest,
        goalId: goalId as Id<"goals"> | undefined,
      };
      routine
        ? await update({ routineId: routine._id, ...base })
        : await create({ ...base, today: todayLocal() });
      onDone();
    } finally {
      setPend(false);
    }
  };

  const s = StyleSheet.create({
    scroll: { flexGrow: 0 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 8 },
    mt: { marginTop: 10 },
  });

  return (
    <Sheet visible={visible} onClose={onDone} avoidKeyboard maxHeight="85%">
      <SheetTitle>{routine ? "Edit routine" : "New routine"}</SheetTitle>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          value={name}
          onChangeText={setName}
          placeholder="Routine name"
          autoFocus={!routine}
          editable={!pending}
        />
        <TextField
          style={s.mt}
          value={desc}
          onChangeText={setDesc}
          placeholder="Description (optional)"
          editable={!pending}
        />
        <View style={s.mt}>
          <SchedulePicker
            scheduleType={sched}
            customDays={days}
            disabled={pending}
            onChange={setSched}
            onDayToggle={toggleDay}
          />
        </View>
        <View style={s.mt}>
          <ItemOptionsFields
            value={options}
            onChange={setOptions}
            disabled={pending}
          />
        </View>
      </ScrollView>
      <FormFooter
        onCancel={onDone}
        onSubmit={submit}
        submitLabel={routine ? "Save changes" : "Add routine"}
        pending={pending}
        invalid={invalid}
      />
    </Sheet>
  );
}
