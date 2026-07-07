import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
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
import { StagedTaskItem } from "../../components/StagedTaskItem";
import type { StagedTaskData } from "../../components/StagedTaskItem";
import { StagedTaskFormModal } from "../../components/StagedTaskFormModal";
import type { StagedTaskForForm } from "../../components/StagedTaskFormModal";
import { StagedTaskScheduleModal } from "../../components/StagedTaskScheduleModal";
import { useColors } from "../../lib/theme";

const TABS = ["Unscheduled", "Scheduled"] as const;
type Tab = (typeof TABS)[number];

export default function StagingScreen() {
  const c = useColors();
  const stagedTasks = useQuery(api.stagedTasks.list, {});
  const activeGoals = useQuery(api.goals.list, {});

  const [tab, setTab] = useState<Tab>("Unscheduled");
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };
  const [formKey, setFormKey] = useState(0);
  const [formVisible, setFormVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<StagedTaskForForm | null>(null);
  const [schedKey, setSchedKey] = useState(0);
  const [schedVisible, setSchedVisible] = useState(false);
  const [schedTarget, setSchedTarget] = useState<StagedTaskData | null>(null);

  const goalTitleById = new Map(
    (activeGoals ?? []).map((g) => [g._id, g.title]),
  );

  const openCreate = () => {
    setFormKey((k) => k + 1);
    setEditTarget(null);
    setFormVisible(true);
  };
  const openEdit = (t: StagedTaskForForm) => {
    setFormKey((k) => k + 1);
    setEditTarget({ _id: t._id, title: t.title, description: t.description });
    setFormVisible(true);
  };
  const openSchedule = (t: StagedTaskData) => {
    setSchedKey((k) => k + 1);
    setSchedTarget(t);
    setSchedVisible(true);
  };

  const unscheduled = (stagedTasks ?? []).filter(
    (t) => t.scheduledDate === undefined,
  );
  const scheduled = (stagedTasks ?? []).filter(
    (t) => t.scheduledDate !== undefined,
  );
  const shown = tab === "Unscheduled" ? unscheduled : scheduled;
  const count = (list: typeof shown) =>
    list.length > 0 ? ` · ${list.length}` : "";

  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    tabs: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 6,
      gap: 8,
    },
    tab: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.bd2,
    },
    tabOn: { backgroundColor: c.prim, borderColor: c.prim },
    tabTxt: { fontSize: 13, fontWeight: "500", color: c.t2 },
    tabTxtOn: { color: "#fff", fontWeight: "600" },
    content: { paddingTop: 8, paddingBottom: 100 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    empty: {
      margin: 24,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: c.bd1,
      borderRadius: 14,
      paddingVertical: 40,
      paddingHorizontal: 20,
      alignItems: "center",
    },
    emptyTxt: { fontSize: 13, color: c.t3, textAlign: "center" },
    fab: {
      position: "absolute",
      bottom: 28,
      right: 18,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: c.prim,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: c.prim,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 8,
    },
    fabTxt: {
      color: "#fff",
      fontSize: 26,
      fontWeight: "300",
      lineHeight: 28,
      includeFontPadding: false,
    },
  });

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <AppBar title="Staging" />
      <View style={s.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.tab, tab === t && s.tabOn]}
            onPress={() => setTab(t)}
            activeOpacity={0.8}
          >
            <Text style={[s.tabTxt, tab === t && s.tabTxtOn]}>
              {t}
              {count(t === "Unscheduled" ? unscheduled : scheduled)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {stagedTasks === undefined ? (
        <View style={s.center}>
          <ActivityIndicator color={c.prim} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={c.t3}
            />
          }
        >
          {shown.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTxt}>
                {tab === "Unscheduled"
                  ? "Nothing staged yet. Captured tasks wait here until you schedule them."
                  : "Nothing scheduled. Schedule a staged task and it will wait here until its day arrives."}
              </Text>
            </View>
          ) : (
            shown.map((t) => (
              <StagedTaskItem
                key={t._id}
                stagedTask={t}
                goalTitle={t.goalId ? goalTitleById.get(t.goalId) : undefined}
                onEdit={() =>
                  openEdit({
                    _id: t._id,
                    title: t.title,
                    description: t.description,
                  })
                }
                onSchedule={() => openSchedule(t)}
              />
            ))
          )}
        </ScrollView>
      )}
      {tab === "Unscheduled" && (
        <TouchableOpacity
          style={s.fab}
          onPress={openCreate}
          activeOpacity={0.85}
        >
          <Text style={s.fabTxt}>+</Text>
        </TouchableOpacity>
      )}
      <StagedTaskFormModal
        key={formKey}
        visible={formVisible}
        stagedTask={editTarget}
        onDone={() => setFormVisible(false)}
      />
      <StagedTaskScheduleModal
        key={`s${schedKey}`}
        visible={schedVisible}
        stagedTask={schedTarget}
        onDone={() => setSchedVisible(false)}
      />
    </SafeAreaView>
  );
}
