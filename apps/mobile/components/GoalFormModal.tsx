import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { FormFooter } from "./ui/FormFooter";
import { TextField } from "./ui/TextField";
import { Sheet } from "./ui/Sheet";

export interface GoalForForm {
  _id: Id<"goals">;
  title: string;
  description?: string;
  targetValue?: number;
  unit?: string;
  dueDate?: string;
}
interface Props {
  visible: boolean;
  goal: GoalForForm | null;
  onDone: () => void;
}

export function GoalFormModal({ visible, goal, onDone }: Props) {
  const c = useColors();
  const create = useMutation(api.goals.create);
  const update = useMutation(api.goals.update);
  const [title, setTitle] = useState(goal?.title ?? "");
  const [desc, setDesc] = useState(goal?.description ?? "");
  const [target, setTarget] = useState(goal?.targetValue?.toString() ?? "");
  const [unit, setUnit] = useState(goal?.unit ?? "");
  const [dueDate, setDueDate] = useState(goal?.dueDate ?? "");
  const [pending, setPending] = useState(false);
  const invalid = !title.trim();

  const submit = async () => {
    if (invalid || pending) return;
    setPending(true);
    try {
      const base = {
        title: title.trim(),
        description: desc.trim() || undefined,
        targetValue: target ? parseFloat(target) : undefined,
        unit: unit.trim() || undefined,
        dueDate: dueDate || undefined,
      };
      goal ? await update({ goalId: goal._id, ...base }) : await create(base);
      onDone();
    } finally {
      setPending(false);
    }
  };

  const s = StyleSheet.create({
    hTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: c.t1,
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 14,
    },
    sc: { flexGrow: 0 },
    scC: { paddingHorizontal: 20, paddingBottom: 8 },
    row: { flexDirection: "row", gap: 10, marginTop: 10 },
    half: {
      flex: 1,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.bd2,
      borderRadius: radii.sm,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 14,
      color: c.t1,
    },
    mt: { marginTop: 10 },
  });

  return (
    <Sheet visible={visible} onClose={onDone} avoidKeyboard maxHeight="85%">
      <Text style={s.hTitle}>{goal ? "Edit goal" : "New goal"}</Text>
      <ScrollView
        style={s.sc}
        contentContainerStyle={s.scC}
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          value={title}
          onChangeText={setTitle}
          placeholder="What do you want to achieve?"
          autoFocus={!goal}
          editable={!pending}
        />
        <TextField
          style={s.mt}
          value={desc}
          onChangeText={setDesc}
          placeholder="Why does this matter? (optional)"
          multiline
          numberOfLines={2}
          editable={!pending}
        />
        <View style={s.row}>
          <TextInput
            style={s.half}
            value={target}
            onChangeText={setTarget}
            placeholder="Target (optional)"
            keyboardType="numeric"
            editable={!pending}
          />
          <TextInput
            style={s.half}
            value={unit}
            onChangeText={setUnit}
            placeholder="Unit — pages, km…"
            editable={!pending}
          />
        </View>
        <TextField
          style={s.mt}
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="Due date (YYYY-MM-DD)"
          editable={!pending}
        />
      </ScrollView>
      <FormFooter
        onCancel={onDone}
        onSubmit={submit}
        submitLabel={goal ? "Save changes" : "Create goal"}
        pending={pending}
        invalid={invalid}
      />
    </Sheet>
  );
}
