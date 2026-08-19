import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { useColors } from "../lib/theme";
import { MentionMenu } from "./MentionMenu";
import { useMentionText } from "../lib/useMentionText";
import { radii } from "../lib/radii";

interface Props {
  initialText: string;
  routines: { routineId: Id<"routines">; name: string }[];
  tasks: { taskId: Id<"dailyTasks">; title: string }[];
  onSave: (
    text: string,
    tags: { entityId: string; entityType: "task" | "routine" }[],
  ) => void;
  onCancel: () => void;
}

export function ReflectionEditor({
  initialText,
  routines,
  tasks,
  onSave,
  onCancel,
}: Props) {
  const c = useColors();
  const {
    text,
    query,
    filtered,
    menuIdx,
    cursorRef,
    handleChange,
    insertMention,
    collect,
  } = useMentionText(initialText, routines, tasks);

  const save = () => {
    const { stored, tags } = collect();
    onSave(stored, tags);
  };

  const s = StyleSheet.create({
    input: {
      color: c.t1,
      fontSize: 14,
      lineHeight: 22,
      paddingHorizontal: 14,
      paddingTop: 6,
      paddingBottom: 10,
      minHeight: 96,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
      paddingHorizontal: 14,
      paddingBottom: 12,
      paddingTop: 4,
    },
    cancelBtn: { paddingHorizontal: 14, paddingVertical: 8 },
    cancelTxt: { fontSize: 13, color: c.t3 },
    saveBtn: {
      backgroundColor: c.prim,
      borderRadius: radii.sm,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    saveTxt: { fontSize: 13, fontWeight: "600", color: c.onPrim },
  });

  return (
    <View>
      {query !== null && filtered.length > 0 && (
        <MentionMenu
          items={filtered}
          activeIndex={menuIdx}
          onPick={insertMention}
        />
      )}
      <TextInput
        style={s.input}
        value={text}
        onChangeText={handleChange}
        onSelectionChange={(e) => {
          cursorRef.current = e.nativeEvent.selection.start;
        }}
        placeholder={"How did today go? Type @ to tag a task or routine."}
        placeholderTextColor={c.t3}
        multiline
        textAlignVertical="top"
      />
      <View style={s.actions}>
        <TouchableOpacity
          onPress={onCancel}
          style={s.cancelBtn}
          activeOpacity={0.7}
        >
          <Text style={s.cancelTxt}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={save} style={s.saveBtn} activeOpacity={0.8}>
          <Text style={s.saveTxt}>Save reflection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
