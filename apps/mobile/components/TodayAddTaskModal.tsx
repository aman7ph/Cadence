import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import {
  EMPTY_ITEM_OPTIONS,
  type ItemOptions,
  itemOptionsToArgs,
} from "@cadence/shared";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "../lib/theme";
import { display } from "../lib/fonts";
import { radii } from "../lib/radii";
import { ItemOptionsFields } from "./ItemOptionsFields";
import { FormFooter } from "./ui/FormFooter";

interface Props {
  visible: boolean;
  today: string;
  onDone: () => void;
}

/**
 * New-task form as a bottom sheet, replacing the inline composer bar.
 *
 * Web opens a right-side `FormDrawer` here (today-add-task.tsx) with the same
 * three parts — title, goal link, repeat — so mobile was the odd one out with
 * an inline row. A sheet is the platform's drawer: same containment, same
 * "commit or cancel", entering from the edge a phone reaches from.
 *
 * The prototype's phone frame does show an inline `⚙ Add` row, but the user
 * chose to follow the shipped web behaviour instead so the two apps agree.
 */
export function TodayAddTaskModal({ visible, today, onDone }: Props) {
  const c = useColors();
  const create = useMutation(api.dailyTasks.create);

  const [title, setTitle] = useState("");
  const [options, setOptions] = useState<ItemOptions>(EMPTY_ITEM_OPTIONS);
  const [pending, setPending] = useState(false);

  const invalid = title.trim().length === 0;

  const reset = () => {
    setTitle("");
    setOptions(EMPTY_ITEM_OPTIONS);
  };

  const close = () => {
    reset();
    onDone();
  };

  const submit = async () => {
    if (invalid || pending) return;
    setPending(true);
    try {
      // The steppers already clamp to the valid bounds, so there is no
      // post-hoc validation step to fail here.
      const { goalId, ...rest } = itemOptionsToArgs(options);
      await create({
        title: title.trim(),
        today,
        goalId: goalId as Id<"goals"> | undefined,
        ...rest,
      });
      close();
    } finally {
      setPending(false);
    }
  };

  const s = StyleSheet.create({
    overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: c.scrim },
    backdrop: { flex: 1 },
    sheet: {
      backgroundColor: c.bgE,
      borderTopLeftRadius: radii.sheet,
      borderTopRightRadius: radii.sheet,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: c.bd2,
      maxHeight: "85%",
      paddingBottom: 32,
    },
    handle: {
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.bd3,
      alignSelf: "center",
      marginTop: 10,
      marginBottom: 4,
    },
    title: {
      ...display("semibold"),
      fontSize: 17,
      color: c.t1,
      paddingHorizontal: 20,
      paddingTop: 4,
    },
    desc: { fontSize: 12, color: c.t3, paddingHorizontal: 20, paddingTop: 3, paddingBottom: 14 },
    body: { paddingHorizontal: 20 },
    input: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.bd2,
      borderRadius: radii.sm,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 14,
      color: c.t1,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={close} />
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title}>New task</Text>
          <Text style={s.desc}>
            One-off work for today. Link it to a goal or spread it across the day.
          </Text>
          <ScrollView style={s.body} keyboardShouldPersistTaps="handled">
            <TextInput
              style={s.input}
              value={title}
              onChangeText={setTitle}
              placeholder="What needs doing today?"
              placeholderTextColor={c.t3}
              editable={!pending}
            />
            <View style={{ marginTop: 16 }}>
              <ItemOptionsFields value={options} onChange={setOptions} disabled={pending} />
            </View>
          </ScrollView>
          <FormFooter
            onCancel={close}
            onSubmit={submit}
            submitLabel="Add task"
            pending={pending}
            invalid={invalid}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
