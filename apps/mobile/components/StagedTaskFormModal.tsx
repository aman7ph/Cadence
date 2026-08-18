import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import {
  KeyboardAvoidingView, Modal, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { FormFooter } from "./ui/FormFooter";

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
    overlay:   { flex: 1, justifyContent: "flex-end", backgroundColor: c.scrim },
    backdrop:  { flex: 1 },
    sheet:     { backgroundColor: c.bgE, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet,
                 borderWidth: 1, borderBottomWidth: 0, borderColor: c.bd2,
                 maxHeight: "85%", paddingBottom: 32 },
    handle:    { width: 38, height: 4, borderRadius: 2, backgroundColor: c.bd3,
                 alignSelf: "center", marginTop: 10, marginBottom: 4 },
    title:     { fontSize: 16, fontWeight: "700", color: c.t1,
                 paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14 },
    body:      { paddingHorizontal: 20 },
    input:     { backgroundColor: c.card, borderWidth: 1, borderColor: c.bd2,
                 borderRadius: radii.sm, paddingHorizontal: 14, paddingVertical: 11,
                 fontSize: 14, color: c.t1 },
    mt:        { marginTop: 10 },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDone}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onDone} />
        <View style={s.sheet}>
          <View style={s.handle} />
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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
