import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppBar } from "../../components/AppBar";
import { Button } from "../../components/ui/Button";
import { TabBar } from "../../components/ui/TabBar";
import { radii } from "../../lib/radii";
import {
  ActiveRoutinesList,
  ArchivedRoutinesList,
} from "../../components/RoutinesTabBodies";
import { RoutineFormModal } from "../../components/RoutineFormModal";
import type { RoutineForForm } from "../../components/RoutineFormModal";
import type { ScheduleType } from "../../components/SchedulePicker";
import { useColors } from "../../lib/theme";

export default function RoutinesScreen() {
  const c = useColors();
  const today = todayLocal();
  const allRoutines = useQuery(api.routines.list, {
    includeArchived: true,
    today,
  });
  const activeGoals = useQuery(api.goals.list, {});
  const archive = useMutation(api.routineManagement.archive);

  const [tab, setTab] = useState<"Active" | "Archived">("Active");
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };
  const [formKey, setFormKey] = useState(0);
  const [formVisible, setFormVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<RoutineForForm | null>(null);

  const goalTitleById = new Map(
    (activeGoals ?? []).map((g) => [g._id, g.title]),
  );
  const active = (allRoutines ?? []).filter((r) => r.isActive);
  const archived = (allRoutines ?? []).filter((r) => !r.isActive);

  const openCreate = () => {
    setFormKey((k) => k + 1);
    setEditTarget(null);
    setFormVisible(true);
  };
  const openEdit = (r: (typeof active)[0]) => {
    setFormKey((k) => k + 1);
    setEditTarget({
      _id: r._id,
      name: r.name,
      description: r.description,
      scheduleType: r.scheduleType as ScheduleType,
      customDays: r.customDays,
      goalId: r.goalId as Id<"goals"> | undefined,
      goalContribution: r.goalContribution,
      // Must be carried through: the form submits every field, so omitting
      // these would silently strip the repeat settings on any edit.
      repeatTarget: r.repeatTarget,
      repeatIntervalMinutes: r.repeatIntervalMinutes,
    });
    setFormVisible(true);
  };

  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    scroll: { flex: 1 },
    content: { paddingBottom: 96 },
    center: { padding: 24, alignItems: "center" },
    fab: { position: "absolute", bottom: 28, right: 18 },
  });

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <AppBar title="Routines" />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <TabBar
          tabs={["Active", "Archived"] as const}
          active={tab}
          onChange={setTab}
          label={(t) =>
            `${t} ${t === "Active" ? active.length : archived.length}`
          }
        />
        {allRoutines === undefined && (
          <View style={s.center}>
            <ActivityIndicator color={c.prim} />
          </View>
        )}
        {allRoutines !== undefined &&
          (tab === "Active" ? (
            <ActiveRoutinesList
              routines={active}
              goalTitleById={goalTitleById}
              onEdit={openEdit}
              onArchive={(routineId) => archive({ routineId, today })}
            />
          ) : (
            <ArchivedRoutinesList routines={archived} />
          ))}
      </ScrollView>
      <Button
        variant="fab"
        title="+"
        onPress={openCreate}
        style={s.fab}
        accessibilityLabel="New routine"
      />
      <RoutineFormModal
        key={formKey}
        visible={formVisible}
        routine={editTarget}
        onDone={() => setFormVisible(false)}
      />
    </SafeAreaView>
  );
}
