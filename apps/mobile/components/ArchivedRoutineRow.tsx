import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { scheduleLabel } from "./SchedulePicker";
import type { ScheduleType } from "./SchedulePicker";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { ConfirmSheet } from "./ui/ConfirmSheet";

export interface RoutineForArchive {
  _id: Id<"routines">;
  name: string;
  scheduleType: ScheduleType;
  customDays?: number[];
  archivedDate?: string;
}

interface Props {
  routine: RoutineForArchive;
}

export function ArchivedRoutineRow({ routine }: Props) {
  const c = useColors();
  const restore = useMutation(api.routineManagement.restore);
  const perm = useMutation(api.routineManagement.permanentDelete);
  // Exactly one sheet is mounted at a time — two overlapping bottom sheets
  // would stack their scrims and trap the backdrop tap.
  const [confirm, setConfirm] = useState<"restore" | "delete" | null>(null);

  const sched = scheduleLabel(routine.scheduleType, routine.customDays);

  const s = StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.bd1,
      borderRadius: radii.sm,
      paddingHorizontal: 12,
      paddingVertical: 10,
      opacity: 0.65,
    },
    body: { flex: 1, gap: 2 },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      flexWrap: "wrap",
    },
    name: {
      fontSize: 13,
      fontWeight: "500",
      color: c.t2,
      textDecorationLine: "line-through",
      flexShrink: 1,
    },
    chip: {
      backgroundColor: c.active,
      borderRadius: radii.full,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    chipTxt: { fontSize: 10, fontWeight: "600", color: c.t3 },
    archDate: { fontSize: 11, color: c.t3 },
    actions: { flexDirection: "row", alignItems: "center", gap: 4 },
    restoreBtn: { paddingHorizontal: 10, paddingVertical: 6 },
    restoreTxt: { fontSize: 12, fontWeight: "600", color: c.t2 },
    deleteBtn: { paddingHorizontal: 8, paddingVertical: 6 },
    deleteTxt: { fontSize: 12, color: c.t3 },
    confirmName: { fontSize: 13, color: c.t1 },
  });

  return (
    <View style={s.card}>
      <View style={s.body}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={1}>
            {routine.name}
          </Text>
          <View style={s.chip}>
            <Text style={s.chipTxt}>{sched}</Text>
          </View>
        </View>
        {routine.archivedDate && (
          <Text style={s.archDate}>Archived {routine.archivedDate}</Text>
        )}
      </View>
      <View style={s.actions}>
        <TouchableOpacity
          onPress={() => setConfirm("restore")}
          style={s.restoreBtn}
        >
          <Text style={s.restoreTxt}>Restore</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setConfirm("delete")}
          style={s.deleteBtn}
        >
          <Text style={s.deleteTxt}>Delete</Text>
        </TouchableOpacity>
      </View>

      <ConfirmSheet
        visible={confirm === "restore"}
        onCancel={() => setConfirm(null)}
        title="Restore this routine?"
        description="It returns to your active routines and starts appearing on the days it is scheduled."
        confirmLabel="Restore"
        tone="accent"
        onConfirm={async () => {
          await restore({ routineId: routine._id });
        }}
      >
        <Text style={s.confirmName}>{routine.name}</Text>
      </ConfirmSheet>

      <ConfirmSheet
        visible={confirm === "delete"}
        onCancel={() => setConfirm(null)}
        title="Delete this routine forever?"
        description="This cannot be undone. Its completion history and streaks are removed with it."
        confirmLabel="Delete forever"
        tone="danger"
        onConfirm={async () => {
          await perm({ routineId: routine._id });
        }}
      >
        <Text style={s.confirmName}>{routine.name}</Text>
      </ConfirmSheet>
    </View>
  );
}
