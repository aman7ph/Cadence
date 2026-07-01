import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { scheduleLabel } from "./SchedulePicker";
import type { ScheduleType } from "./SchedulePicker";
import { useColors } from "../lib/theme";

export interface RoutineForArchive {
  _id: Id<"routines">;
  name: string;
  scheduleType: ScheduleType;
  customDays?: number[];
  archivedDate?: string;
}

interface Props { routine: RoutineForArchive }

export function ArchivedRoutineRow({ routine }: Props) {
  const c = useColors();
  const restore = useMutation(api.routineManagement.restore);
  const perm    = useMutation(api.routineManagement.permanentDelete);
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const doRestore = async () => {
    setPending(true);
    try { await restore({ routineId: routine._id }); }
    finally { setPending(false); }
  };

  const doDelete = async () => {
    setPending(true);
    try { await perm({ routineId: routine._id }); }
    finally { setPending(false); setConfirm(false); }
  };

  const sched = scheduleLabel(routine.scheduleType, routine.customDays);

  const s = StyleSheet.create({
    card:        { flexDirection: "row", alignItems: "center", gap: 10,
                   borderBottomWidth: 1, borderBottomColor: c.bd1,
                   paddingHorizontal: 20, paddingVertical: 12, opacity: 0.65 },
    body:        { flex: 1, gap: 2 },
    nameRow:     { flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap" },
    name:        { fontSize: 13, fontWeight: "500", color: c.t2,
                   textDecorationLine: "line-through", flexShrink: 1 },
    chip:        { backgroundColor: c.active, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    chipTxt:     { fontSize: 10, fontWeight: "600", color: c.t3 },
    archDate:    { fontSize: 11, color: c.t3 },
    actions:     { flexDirection: "row", alignItems: "center", gap: 4 },
    restoreBtn:  { paddingHorizontal: 10, paddingVertical: 6 },
    restoreTxt:  { fontSize: 12, fontWeight: "600", color: c.t2 },
    deleteBtn:   { paddingHorizontal: 8, paddingVertical: 6 },
    deleteTxt:   { fontSize: 12, color: c.t3 },
    confirmRow:  { flexDirection: "row", alignItems: "center", gap: 6,
                   borderWidth: 1, borderColor: "rgba(239,68,68,0.35)",
                   borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    confirmTxt:  { fontSize: 11, color: c.danger },
    yesTxt:      { fontSize: 11, fontWeight: "700", color: c.danger },
    noTxt:       { fontSize: 12, color: c.t3 },
  });

  return (
    <View style={s.card}>
      <View style={s.body}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={1}>{routine.name}</Text>
          <View style={s.chip}><Text style={s.chipTxt}>{sched}</Text></View>
        </View>
        {routine.archivedDate && <Text style={s.archDate}>Archived {routine.archivedDate}</Text>}
      </View>
      <View style={s.actions}>
        <TouchableOpacity onPress={doRestore} disabled={pending} style={s.restoreBtn}>
          <Text style={s.restoreTxt}>Restore</Text>
        </TouchableOpacity>
        {!confirm ? (
          <TouchableOpacity onPress={() => setConfirm(true)} disabled={pending} style={s.deleteBtn}>
            <Text style={s.deleteTxt}>Delete</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.confirmRow}>
            <Text style={s.confirmTxt}>Forever?</Text>
            <TouchableOpacity onPress={doDelete} disabled={pending}>
              <Text style={s.yesTxt}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setConfirm(false)}>
              <Text style={s.noTxt}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
