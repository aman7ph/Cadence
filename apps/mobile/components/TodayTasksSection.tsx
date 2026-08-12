import { StyleSheet, Text, View } from "react-native";
import { TaskItem } from "./TaskItem";
import { AddTaskBar } from "./AddTaskBar";
import type { Task } from "./TaskItem";
import { useColors } from "../lib/theme";

interface Props {
  tasks: Task[];
  viewedDate: string;
  isPast: boolean;
}

// Every task on the day's plate renders in one list. There is no hidden subset
// any more — a task the user no longer wants is deleted outright, so nothing
// can sit off-screen while still counting against the day's score.
export function TodayTasksSection({ tasks, viewedDate, isPast }: Props) {
  const c = useColors();
  const done = tasks.filter((t) => t.status === "completed").length;

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
  });

  return (
    <View style={s.section}>
      <View style={s.head}>
        <Text style={s.lbl}>Tasks</Text>
        {tasks.length > 0 && <Text style={s.cnt}>{done} / {tasks.length}</Text>}
      </View>
      {tasks.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyTxt}>{isPast ? "No tasks on this day." : "No tasks yet."}</Text>
        </View>
      ) : (
        tasks.map((t) => (
          <TaskItem key={t.taskId} task={t} viewedDate={viewedDate} readOnly={isPast} />
        ))
      )}
      {!isPast && <AddTaskBar today={viewedDate} />}
    </View>
  );
}
