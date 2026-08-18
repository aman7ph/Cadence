import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import {
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { FormFooter } from "./ui/FormFooter";
import { Sheet } from "./ui/Sheet";

interface Props { visible: boolean; onDone: () => void }

/**
 * Capture a staged task. Create only — editing a staged task's text now happens
 * in the schedule sheet, which already carries those fields.
 */
export function StagedTaskFormModal({ visible, onDone }: Props) {
  const c = useColors();
  const create = useMutation(api.stagedTasks.create);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [pending, setPending] = useState(false);

  const invalid = !title.trim();

  const submit = async () => {
    if (invalid || pending) return;
    setPending(true);
    try {
      await create({ title: title.trim(), description: desc.trim() || undefined });
      onDone();
    } finally { setPending(false); }
  };

  const s = StyleSheet.create({
    title:     { fontSize: 16, fontWeight: "700", color: c.t1,
                 paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14 },
    body:      { paddingHorizontal: 20 },
    input:     { backgroundColor: c.card, borderWidth: 1, borderColor: c.bd2,
                 borderRadius: radii.sm, paddingHorizontal: 14, paddingVertical: 11,
                 fontSize: 14, color: c.t1 },
    mt:        { marginTop: 10 },
  });

  return (
    <Sheet visible={visible} onClose={onDone} avoidKeyboard maxHeight="85%">
          <Text style={s.title}>New staged task</Text>
          <View style={s.body}>
            <TextInput style={s.input} value={title} onChangeText={setTitle}
              placeholder="Task title" placeholderTextColor={c.t3}
              autoFocus editable={!pending} />
            <TextInput style={[s.input, s.mt]} value={desc} onChangeText={setDesc}
              placeholder="Description (optional)" placeholderTextColor={c.t3} editable={!pending} />
          </View>
          <FormFooter onCancel={onDone} onSubmit={submit}
                      submitLabel="Add task"
                      pending={pending} invalid={invalid} />
        </Sheet>
  );
}
