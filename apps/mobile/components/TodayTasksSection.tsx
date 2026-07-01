import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TaskItem } from "./TaskItem";
import { AddTaskBar } from "./AddTaskBar";
import type { Task } from "./TaskItem";
import { useColors } from "../lib/theme";

interface Props {
  tasks: Task[];
  viewedDate: string;
  isPast: boolean;
}

export function TodayTasksSection({ tasks, viewedDate, isPast }: Props) {
  const c = useColors();
  const [showDismissed, setShowDim] = useState(false);

  const visible   = tasks.filter((t) => t.status !== "dismissed");
  const dismissed = tasks.filter((t) => t.status === "dismissed");
  const done      = visible.filter((t) => t.status === "completed").length;

  const s = StyleSheet.create({
    section:   { marginHorizontal: 16, marginBottom: 20, gap: 6 },
    head:      { flexDirection: "row", justifyContent: "space-between",
                 alignItems: "baseline", paddingVertical: 6 },
    lbl:       { fontSize: 11, fontWeight: "700", color: c.t2,
                 textTransform: "uppercase", letterSpacing: 0.7 },
    cnt:       { fontSize: 11, color: c.t3 },
    empty:     { borderWidth: 1, borderColor: c.bd1, borderStyle: "dashed",
                 borderRadius: 12, paddingVertical: 24, alignItems: "center" },
    emptyTxt:  { fontSize: 13, color: c.t3 },
    dimToggle: { paddingVertical: 6 },
    dimTxt:    { fontSize: 11, fontWeight: "600", color: c.t3 },
  });

  return (
    <View style={s.section}>
      <View style={s.head}>
        <Text style={s.lbl}>Tasks</Text>
        {visible.length > 0 && <Text style={s.cnt}>{done} / {visible.length}</Text>}
      </View>
      {visible.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyTxt}>{isPast ? "No tasks on this day." : "No tasks yet."}</Text>
        </View>
      ) : (
        visible.map((t) => (
          <TaskItem key={t.taskId} task={t} viewedDate={viewedDate} readOnly={isPast} />
        ))
      )}
      {!isPast && <AddTaskBar today={viewedDate} />}
      {dismissed.length > 0 && (
        <>
          <TouchableOpacity onPress={() => setShowDim((v) => !v)} style={s.dimToggle}>
            <Text style={s.dimTxt}>{showDismissed ? "▼" : "▶"}{"  "}Dismissed ({dismissed.length})</Text>
          </TouchableOpacity>
          {showDismissed && dismissed.map((t) => (
            <TaskItem key={t.taskId} task={t} viewedDate={viewedDate} readOnly={isPast} />
          ))}
        </>
      )}
    </View>
  );
}
