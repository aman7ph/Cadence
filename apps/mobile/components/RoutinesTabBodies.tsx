import { StyleSheet, Text, View } from "react-native";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { ArchivedRoutineRow } from "./ArchivedRoutineRow";
import { RoutineRow } from "./RoutineRow";
import { EmptyState } from "./ui/EmptyState";
import type { ScheduleType } from "./SchedulePicker";

// Generic over the caller's document so `onEdit` keeps the full Convex row —
// narrowing it here would force a cast at the call site.
type RoutineLike = {
  _id: Id<"routines">;
  name: string;
  description?: string;
  scheduleType: string;
  customDays?: number[];
  currentStreak: number;
  longestStreak: number;
  goalId?: string;
  goalContribution?: number;
  archivedDate?: string;
};

const list = { paddingHorizontal: 16, gap: 10 } as const;

export function ActiveRoutinesList<R extends RoutineLike>({
  routines,
  goalTitleById,
  onEdit,
  onArchive,
}: {
  routines: R[];
  goalTitleById: Map<Id<"goals">, string>;
  onEdit: (r: R) => void;
  onArchive: (id: Id<"routines">) => void;
}) {
  if (routines.length === 0) {
    return <EmptyState>No active routines. Tap + to add one.</EmptyState>;
  }
  return (
    <View style={list}>
      {routines.map((r) => (
        <RoutineRow
          key={r._id}
          routine={{
            _id: r._id,
            name: r.name,
            description: r.description,
            scheduleType: r.scheduleType as ScheduleType,
            customDays: r.customDays,
            currentStreak: r.currentStreak,
            longestStreak: r.longestStreak,
            goalTitle: r.goalId
              ? (goalTitleById.get(r.goalId as Id<"goals">) ?? undefined)
              : undefined,
            goalContribution: r.goalContribution,
          }}
          onEdit={() => onEdit(r)}
          onArchive={() => onArchive(r._id)}
        />
      ))}
    </View>
  );
}

export function ArchivedRoutinesList({
  routines,
}: {
  routines: RoutineLike[];
}) {
  if (routines.length === 0)
    return <EmptyState>Nothing archived yet.</EmptyState>;
  return (
    <View style={list}>
      {routines.map((r) => (
        <ArchivedRoutineRow
          key={r._id}
          routine={{
            _id: r._id,
            name: r.name,
            scheduleType: r.scheduleType as ScheduleType,
            customDays: r.customDays,
            archivedDate: r.archivedDate,
          }}
        />
      ))}
    </View>
  );
}
