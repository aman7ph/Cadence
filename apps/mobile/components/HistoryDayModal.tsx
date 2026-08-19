import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { useColors } from "../lib/theme";
import { FullScreenModal } from "./ui/FullScreenModal";
import { EmptyState } from "./ui/EmptyState";
import { HistoryDayHeader } from "./HistoryDayHeader";
import { DaySection } from "./HistoryDaySections";
import { HistoryDayReflection } from "./HistoryDayReflection";

interface Props {
  date: string | null;
  today: string;
  onClose: () => void;
}

function DayModalContent({
  date,
  today,
  onClose,
}: {
  date: string;
  today: string;
  onClose: () => void;
}) {
  const c = useColors();
  const day = useQuery(api.days.getDay, { date });
  const isPast = date < today;

  const routines = day?.routines ?? [];
  const allTasks = day?.randomTasks ?? [];
  const counted = routines.filter((r) => r.status !== "skipped"); // skips excused
  const isEmpty =
    day !== undefined &&
    day !== null &&
    routines.length === 0 &&
    allTasks.length === 0;

  const routineDot = (status: string) =>
    status === "completed" ? c.cplt : status === "skipped" ? c.carry : c.bd3;
  const taskDot = (status: string) => (status === "completed" ? c.cplt : c.bd3);

  const s = StyleSheet.create({ content: { paddingBottom: 40 } });

  return (
    <>
      <HistoryDayHeader date={date} today={today} onClose={onClose} />

      {day === undefined ? (
        <ActivityIndicator color={c.prim} style={{ marginTop: 32 }} />
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          {isEmpty ? (
            <EmptyState>
              {isPast
                ? "Nothing was tracked on this day."
                : "Nothing yet today."}
            </EmptyState>
          ) : (
            <>
              <DaySection
                title="Routines"
                done={counted.filter((r) => r.status === "completed").length}
                total={counted.length}
                items={routines.map((r) => ({
                  id: r.routineId,
                  name: r.name,
                  status: r.status,
                }))}
                emptyLabel="None scheduled"
                dotFor={routineDot}
              />
              <DaySection
                title="Tasks"
                done={allTasks.filter((t) => t.status === "completed").length}
                total={allTasks.length}
                items={allTasks.map((t) => ({
                  id: t.taskId,
                  name: t.title,
                  status: t.status,
                }))}
                emptyLabel="No tasks"
                dotFor={taskDot}
              />
            </>
          )}

          <HistoryDayReflection
            reflection={
              day?.reflection
                ? {
                    text: day.reflection.text,
                    taggedRoutineIds: day.reflection
                      .taggedRoutineIds as string[],
                    taggedTaskIds: day.reflection.taggedTaskIds as string[],
                  }
                : null
            }
          />
        </ScrollView>
      )}
    </>
  );
}

export function HistoryDayModal({ date, today, onClose }: Props) {
  return (
    <FullScreenModal visible={!!date} onClose={onClose}>
      {date && <DayModalContent date={date} today={today} onClose={onClose} />}
    </FullScreenModal>
  );
}
