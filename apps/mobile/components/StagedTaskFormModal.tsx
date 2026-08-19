import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { FormFooter } from "./ui/FormFooter";
import { SheetTitle } from "./ui/SheetTitle";
import { TextField } from "./ui/TextField";
import { Sheet } from "./ui/Sheet";

interface Props {
  visible: boolean;
  onDone: () => void;
}

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
      await create({
        title: title.trim(),
        description: desc.trim() || undefined,
      });
      onDone();
    } finally {
      setPending(false);
    }
  };

  const s = StyleSheet.create({
    body: { paddingHorizontal: 20 },
    mt: { marginTop: 10 },
  });

  return (
    <Sheet visible={visible} onClose={onDone} avoidKeyboard maxHeight="85%">
      <SheetTitle>New staged task</SheetTitle>
      <View style={s.body}>
        <TextField
          value={title}
          onChangeText={setTitle}
          placeholder="Task title"
          autoFocus
          editable={!pending}
        />
        <TextField
          style={s.mt}
          value={desc}
          onChangeText={setDesc}
          placeholder="Description (optional)"
          editable={!pending}
        />
      </View>
      <FormFooter
        onCancel={onDone}
        onSubmit={submit}
        submitLabel="Add task"
        pending={pending}
        invalid={invalid}
      />
    </Sheet>
  );
}
