import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useColors } from "../lib/theme";

export interface StagedTaskForForm {
  _id: Id<"stagedTasks">;
  title: string;
  description?: string;
}
interface Props { visible: boolean; stagedTask: StagedTaskForForm | null; onDone: () => void }

export function StagedTaskFormModal({ visible, stagedTask, onDone }: Props) {
  const c = useColors();
  const create = useMutation(api.stagedTasks.create);
  const update = useMutation(api.stagedTasks.update);

  const [title, setTitle] = useState(stagedTask?.title ?? "");
  const [desc, setDesc] = useState(stagedTask?.description ?? "");
  const [pending, setPending] = useState(false);

  const invalid = !title.trim();

  const submit = async () => {
    if (invalid || pending) return;
    setPending(true);
    try {
      const base = { title: title.trim(), description: desc.trim() || undefined };
      stagedTask
        ? await update({ stagedTaskId: stagedTask._id, ...base })
        : await create(base);
      onDone();
    } finally { setPending(false); }
  };

  const s = StyleSheet.create({
    overlay:   { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
    backdrop:  { flex: 1 },
    sheet:     { backgroundColor: c.bgE, borderTopLeftRadius: 22, borderTopRightRadius: 22,
                 borderWidth: 1, borderBottomWidth: 0, borderColor: c.bd2,
                 maxHeight: "85%", paddingBottom: 32 },
    handle:    { width: 38, height: 4, borderRadius: 2, backgroundColor: c.bd3,
                 alignSelf: "center", marginTop: 10, marginBottom: 4 },
    title:     { fontSize: 16, fontWeight: "700", color: c.t1,
                 paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14 },
    body:      { paddingHorizontal: 20 },
    input:     { backgroundColor: c.card, borderWidth: 1, borderColor: c.bd2,
                 borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
                 fontSize: 14, color: c.t1 },
    mt:        { marginTop: 10 },
    footer:    { flexDirection: "row", justifyContent: "flex-end", gap: 8,
                 paddingHorizontal: 20, paddingTop: 12 },
    cancelBtn: { paddingHorizontal: 14, paddingVertical: 10 },
    cancelTxt: { fontSize: 13, color: c.t3 },
    saveBtn:   { backgroundColor: c.prim, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
    saveDim:   { opacity: 0.45 },
    saveTxt:   { fontSize: 13, fontWeight: "600", color: "#fff" },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDone}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onDone} />
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title}>{stagedTask ? "Edit staged task" : "New staged task"}</Text>
          <View style={s.body}>
            <TextInput style={s.input} value={title} onChangeText={setTitle}
              placeholder="Task title" placeholderTextColor={c.t3}
              autoFocus={!stagedTask} editable={!pending} />
            <TextInput style={[s.input, s.mt]} value={desc} onChangeText={setDesc}
              placeholder="Description (optional)" placeholderTextColor={c.t3} editable={!pending} />
          </View>
          <View style={s.footer}>
            <TouchableOpacity onPress={onDone} disabled={pending} style={s.cancelBtn}>
              <Text style={s.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submit} disabled={invalid || pending} style={[s.saveBtn, invalid && s.saveDim]}>
              {pending ? <ActivityIndicator color="#fff" size="small" />
                       : <Text style={s.saveTxt}>{stagedTask ? "Save changes" : "Add task"}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
