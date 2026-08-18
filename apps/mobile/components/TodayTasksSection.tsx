import { StyleSheet, Text, View } from "react-native";
import { TaskItem } from "./TaskItem";
import { Button } from "./ui/Button";
import { TodayAddTaskModal } from "./TodayAddTaskModal";
import type { Task } from "./TaskItem";
import { useState } from "react";
import { useColors } from "../lib/theme";
import { SectionLabel } from "./ui/SectionLabel";
import { radii } from "../lib/radii";

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
  const [adding, setAdding] = useState(false);
  const done = tasks.filter((t) => t.status === "completed").length;

  const s = StyleSheet.create({
    section:   { marginHorizontal: 16, marginBottom: 20, gap: 10 },
    head:      { paddingVertical: 6 },
    empty:     { borderWidth: 1, borderColor: c.bd1, borderStyle: "dashed",
                 borderRadius: radii.md, paddingVertical: 24, alignItems: "center" },
    emptyTxt:  { fontSize: 13, color: c.t3 },
  });

  return (
    <View style={s.section}>
      <View style={s.head}>
        <SectionLabel count={tasks.length > 0 ? `${done}/${tasks.length}` : undefined}>
          Tasks
        </SectionLabel>
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
      {!isPast && (
        <>
          <Button
            variant="block"
            title="+  New task"
            onPress={() => setAdding(true)}
            style={{ marginTop: 4 }}
          />
          <TodayAddTaskModal
            visible={adding}
            today={viewedDate}
            onDone={() => setAdding(false)}
          />
        </>
      )}
    </View>
  );
}
