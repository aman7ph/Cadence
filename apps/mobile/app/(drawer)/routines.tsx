import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator, RefreshControl, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { AppBar } from "../../components/AppBar";
import { RoutineRow } from "../../components/RoutineRow";
import { ArchivedRoutineRow } from "../../components/ArchivedRoutineRow";
import { RoutineFormModal } from "../../components/RoutineFormModal";
import type { RoutineForForm } from "../../components/RoutineFormModal";
import type { ScheduleType } from "../../components/SchedulePicker";
import { useColors } from "../../lib/theme";

export default function RoutinesScreen() {
  const c = useColors();
  const today       = todayLocal();
  const allRoutines = useQuery(api.routines.list, { includeArchived: true });
  const activeGoals = useQuery(api.goals.list, {});
  const archive     = useMutation(api.routineManagement.archive);

  const [archivedOpen, setArchivedOpen] = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 600); };
  const [formKey, setFormKey]           = useState(0);
  const [formVisible, setFormVisible]   = useState(false);
  const [editTarget, setEditTarget]     = useState<RoutineForForm | null>(null);

  const goalTitleById = new Map((activeGoals ?? []).map((g) => [g._id, g.title]));
  const active   = (allRoutines ?? []).filter((r) => r.isActive);
  const archived = (allRoutines ?? []).filter((r) => !r.isActive);

  const openCreate = () => { setFormKey((k) => k + 1); setEditTarget(null); setFormVisible(true); };
  const openEdit = (r: typeof active[0]) => {
    setFormKey((k) => k + 1);
    setEditTarget({
      _id: r._id, name: r.name, description: r.description,
      scheduleType: r.scheduleType as ScheduleType, customDays: r.customDays,
      goalId: r.goalId as Id<"goals"> | undefined, goalContribution: r.goalContribution,
    });
    setFormVisible(true);
  };

  const s = StyleSheet.create({
    screen:       { flex: 1, backgroundColor: c.bg },
    scroll:       { flex: 1 },
    content:      { paddingBottom: 96 },
    center:       { padding: 24, alignItems: "center" },
    sHead:        { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline",
                    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 },
    sLbl:         { fontSize: 11, fontWeight: "700", textTransform: "uppercase",
                    letterSpacing: 0.7, color: c.t2 },
    sCnt:         { fontSize: 11, color: c.t3 },
    list:         { backgroundColor: c.card, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.bd1 },
    empty:        { marginHorizontal: 16, borderWidth: 1, borderColor: c.bd1,
                    borderStyle: "dashed", borderRadius: 12, paddingVertical: 28, alignItems: "center" },
    emptyTxt:     { fontSize: 13, color: c.t3 },
    archSection:  { marginTop: 16 },
    archHdr:      { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20,
                    paddingVertical: 13, borderTopWidth: 1, borderTopColor: c.bd1 },
    archLbl:      { fontSize: 13, fontWeight: "500", color: c.t2 },
    archBadge:    { backgroundColor: c.active, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 },
    archBadgeTxt: { fontSize: 11, color: c.t3 },
    archArrow:    { fontSize: 12, color: c.t3, marginLeft: "auto" },
    fab:          { position: "absolute", bottom: 28, right: 18, width: 50, height: 50,
                    borderRadius: 25, backgroundColor: c.prim, justifyContent: "center", alignItems: "center",
                    shadowColor: c.prim, shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
    fabTxt:       { color: "#fff", fontSize: 26, fontWeight: "300", lineHeight: 28,
                    includeFontPadding: false },
  });

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <AppBar title="Routines" />
      <ScrollView style={s.scroll} contentContainerStyle={s.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={s.sHead}>
          <Text style={s.sLbl}>Active</Text>
          <Text style={s.sCnt}>{active.length} routine{active.length !== 1 ? "s" : ""}</Text>
        </View>
        {allRoutines === undefined && (
          <View style={s.center}><ActivityIndicator color={c.prim} /></View>
        )}
        {allRoutines !== undefined && active.length === 0 && (
          <View style={s.empty}><Text style={s.emptyTxt}>No active routines. Tap + to add one.</Text></View>
        )}
        <View style={s.list}>
          {active.map((r) => (
            <RoutineRow key={r._id}
              routine={{
                _id: r._id, name: r.name, description: r.description,
                scheduleType: r.scheduleType as ScheduleType, customDays: r.customDays,
                currentStreak: r.currentStreak, longestStreak: r.longestStreak,
                goalTitle: r.goalId ? (goalTitleById.get(r.goalId as Id<"goals">) ?? undefined) : undefined,
                goalContribution: r.goalContribution,
              }}
              onEdit={() => openEdit(r)}
              onArchive={() => archive({ routineId: r._id, today })}
            />
          ))}
        </View>
        {archived.length > 0 && (
          <View style={s.archSection}>
            <TouchableOpacity style={s.archHdr} onPress={() => setArchivedOpen((v) => !v)}>
              <Text style={s.archLbl}>Archived</Text>
              <View style={s.archBadge}><Text style={s.archBadgeTxt}>{archived.length}</Text></View>
              <Text style={s.archArrow}>{archivedOpen ? "▼" : "›"}</Text>
            </TouchableOpacity>
            {archivedOpen && archived.map((r) => (
              <ArchivedRoutineRow key={r._id} routine={{
                _id: r._id, name: r.name, scheduleType: r.scheduleType as ScheduleType,
                customDays: r.customDays, archivedDate: r.archivedDate,
              }} />
            ))}
          </View>
        )}
      </ScrollView>
      <TouchableOpacity style={s.fab} onPress={openCreate} activeOpacity={0.85}>
        <Text style={s.fabTxt}>+</Text>
      </TouchableOpacity>
      <RoutineFormModal key={formKey} visible={formVisible} routine={editTarget}
        onDone={() => setFormVisible(false)} />
    </SafeAreaView>
  );
}
