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
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { TabBar } from "../../components/ui/TabBar";
import { StagedTaskItem } from "../../components/StagedTaskItem";
import type { StagedTaskData } from "../../components/StagedTaskItem";
import { StagedTaskFormModal } from "../../components/StagedTaskFormModal";
import { StagedTaskScheduleModal } from "../../components/StagedTaskScheduleModal";
import { useColors } from "../../lib/theme";
import { radii } from "../../lib/radii";

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
  const [schedKey, setSchedKey] = useState(0);
  const [schedVisible, setSchedVisible] = useState(false);
  const [schedTarget, setSchedTarget] = useState<StagedTaskData | null>(null);

  const goalTitleById = new Map(
    (activeGoals ?? []).map((g) => [g._id, g.title]),
  );

  const openCreate = () => {
    setFormKey((k) => k + 1);
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
    content: {
      paddingTop: 8,
      paddingBottom: 100,
      paddingHorizontal: 16,
      gap: 10,
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    fab: { position: "absolute", bottom: 28, right: 18 },
  });

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <AppBar title="Staging" />
      <TabBar
        tabs={TABS}
        active={tab}
        onChange={setTab}
        label={(t) =>
          `${t}${count(t === "Unscheduled" ? unscheduled : scheduled)}`
        }
      />
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
            <EmptyState>
              {tab === "Unscheduled"
                ? "Nothing staged yet. Captured tasks wait here until you schedule them."
                : "Nothing scheduled. Schedule a staged task and it will wait here until its day arrives."}
            </EmptyState>
          ) : (
            shown.map((t) => (
              <StagedTaskItem
                key={t._id}
                stagedTask={t}
                goalTitle={t.goalId ? goalTitleById.get(t.goalId) : undefined}
                onSchedule={() => openSchedule(t)}
              />
            ))
          )}
        </ScrollView>
      )}
      {tab === "Unscheduled" && (
        <Button
          variant="fab"
          title="+"
          onPress={openCreate}
          style={s.fab}
          accessibilityLabel="New staged task"
        />
      )}
      <StagedTaskFormModal
        key={formKey}
        visible={formVisible}
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
