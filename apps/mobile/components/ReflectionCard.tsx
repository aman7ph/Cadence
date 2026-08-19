import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { ReflectionEditor } from "./ReflectionEditor";
import { MentionText } from "./MentionText";
import { ReflectionTags } from "./ReflectionTags";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";

interface Routine {
  routineId: Id<"routines">;
  name: string;
}
interface Task {
  taskId: Id<"dailyTasks">;
  title: string;
}

interface Props {
  date: string;
  reflection?: { text: string } | null;
  routines: Routine[];
  tasks: Task[];
  isPast: boolean;
}

export function ReflectionCard({
  date,
  reflection,
  routines,
  tasks,
  isPast,
}: Props) {
  if (isPast && !reflection) return null;
  const c = useColors();
  const upsert = useMutation(api.reflections.upsert);
  const [mode, setMode] = useState<"view" | "edit">(() =>
    reflection ? "view" : "edit",
  );
  const savedText = reflection?.text ?? "";

  const handleSave = async (
    text: string,
    tags: { entityId: string; entityType: "task" | "routine" }[],
  ) => {
    await upsert({ date, text, tags });
    setMode("view");
  };

  const s = StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.bd1,
      borderRadius: radii.lg,
      overflow: "hidden",
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 24,
    },
    topBar: { height: 3, backgroundColor: c.prim },
    head: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 4,
    },
    label: {
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.7,
      color: c.t2,
    },
    editBtn: { fontSize: 12, fontWeight: "600", color: c.tacc },
    viewBody: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4 },
  });

  return (
    <View style={s.card}>
      <View style={s.topBar} />
      <View style={s.head}>
        <Text style={s.label}>Reflection</Text>
        {mode === "view" && !isPast && (
          <TouchableOpacity onPress={() => setMode("edit")} hitSlop={8}>
            <Text style={s.editBtn}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
      {mode === "view" ? (
        <View style={s.viewBody}>
          <MentionText
            text={savedText}
            routineIds={routines.map((r) => r.routineId as string)}
            taskIds={tasks.map((t) => t.taskId as string)}
          />
          <ReflectionTags
            text={savedText}
            routineIds={routines.map((r) => r.routineId as string)}
          />
        </View>
      ) : (
        <ReflectionEditor
          initialText={savedText}
          routines={routines}
          tasks={tasks}
          onSave={handleSave}
          onCancel={() => {
            if (savedText) setMode("view");
          }}
        />
      )}
    </View>
  );
}
