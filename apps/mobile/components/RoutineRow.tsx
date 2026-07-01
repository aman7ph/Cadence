import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { scheduleLabel } from "./SchedulePicker";
import type { ScheduleType } from "./SchedulePicker";
import { useColors } from "../lib/theme";
import { ActionSheet } from "./ActionSheet";

export interface RoutineForRow {
  _id: Id<"routines">;
  name: string;
  description?: string;
  scheduleType: ScheduleType;
  customDays?: number[];
  currentStreak: number;
  longestStreak: number;
  goalTitle?: string;
  goalContribution?: number;
}

interface Props { routine: RoutineForRow; onEdit: () => void; onArchive: () => void }

export function RoutineRow({ routine, onEdit, onArchive }: Props) {
  const c = useColors();
  const [menuOpen, setMenuOpen] = useState(false);
  const sched = scheduleLabel(routine.scheduleType, routine.customDays);

  const s = StyleSheet.create({
    card:     { flexDirection: "row", alignItems: "flex-start", gap: 12,
                borderBottomWidth: 1, borderBottomColor: c.bd1, paddingHorizontal: 20, paddingVertical: 13 },
    dot:      { width: 4, height: 4, borderRadius: 2, backgroundColor: c.bd3, marginTop: 6, flexShrink: 0 },
    body:     { flex: 1, gap: 3 },
    nameRow:  { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    name:     { fontSize: 14, fontWeight: "500", color: c.t1, flexShrink: 1 },
    chip:     { backgroundColor: c.accBg, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
    chipTxt:  { fontSize: 10, fontWeight: "600", color: c.tacc, letterSpacing: 0.2 },
    desc:     { fontSize: 12, color: c.t2 },
    streak:   { fontSize: 11, fontWeight: "600", color: c.carry },
    goalPill: { alignSelf: "flex-start", backgroundColor: c.accBg, borderRadius: 4,
                paddingHorizontal: 7, paddingVertical: 2 },
    goalTxt:  { fontSize: 10, fontWeight: "600", color: c.tacc },
    more:     { paddingLeft: 4, paddingTop: 2 },
    moreTxt:  { fontSize: 16, color: c.t3, letterSpacing: 1 },
  });

  return (
    <View style={s.card}>
      <View style={s.dot} />
      <View style={s.body}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={1}>{routine.name}</Text>
          <View style={s.chip}><Text style={s.chipTxt}>{sched}</Text></View>
        </View>
        {!!routine.description && <Text style={s.desc} numberOfLines={1}>{routine.description}</Text>}
        {routine.currentStreak > 0 && (
          <Text style={s.streak}>
            🔥 {routine.currentStreak} day streak
            {routine.longestStreak > routine.currentStreak ? ` · best ${routine.longestStreak}` : ""}
          </Text>
        )}
        {!!routine.goalTitle && (
          <View style={s.goalPill}>
            <Text style={s.goalTxt} numberOfLines={1}>
              ◎ {routine.goalTitle}
              {routine.goalContribution != null ? ` +${routine.goalContribution}` : ""}
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity onPress={() => setMenuOpen(true)} hitSlop={10} style={s.more}>
        <Text style={s.moreTxt}>···</Text>
      </TouchableOpacity>
      <ActionSheet
        visible={menuOpen}
        title={routine.name}
        actions={[
          { label: "Edit", onPress: onEdit },
          { label: "Archive", style: "destructive", onPress: onArchive },
        ]}
        onCancel={() => setMenuOpen(false)}
      />
    </View>
  );
}
