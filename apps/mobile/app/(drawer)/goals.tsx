import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppBar } from "../../components/AppBar";
import { Button } from "../../components/ui/Button";
import { GoalCard } from "../../components/GoalCard";
import { GoalFormModal } from "../../components/GoalFormModal";
import { GoalDetailModal } from "../../components/GoalDetailModal";
import type { GoalData } from "../../components/GoalDetailModal";
import { useColors } from "../../lib/theme";
import { radii } from "../../lib/radii";

const TABS = ["Active", "Completed", "Abandoned"] as const;
type Tab = (typeof TABS)[number];
const STATUS: Record<Tab, string> = {
  Active: "active",
  Completed: "completed",
  Abandoned: "abandoned",
};

export default function GoalsScreen() {
  const c = useColors();
  const allGoals = useQuery(api.goals.list, { includeInactive: true });
  const withCounts = useQuery(api.goalLinks.getWithLinkedCounts);
  const countMap = new Map(
    (withCounts ?? []).map((g) => [
      g.goal._id,
      { t: g.taskCount, r: g.routineCount },
    ]),
  );

  const [tab, setTab] = useState<Tab>("Active");
  const [formKey, setFormKey] = useState(0);
  const [formVisible, setFormVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalData | null>(null);

  const filtered = (allGoals ?? []).filter((g) => g.status === STATUS[tab]);

  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    tabs: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 6,
      gap: 8,
    },
    content: { paddingTop: 8, paddingBottom: 100, paddingHorizontal: 16, gap: 10 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    empty: {
      margin: 24,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: c.bd1,
      borderRadius: radii.md,
      paddingVertical: 40,
      alignItems: "center",
    },
    emptyTxt: { fontSize: 13, color: c.t3 },
    fab: { position: "absolute", bottom: 28, right: 18 },
  });

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <AppBar title="Goals" />
      <View style={s.tabs}>
        {TABS.map((t) => (
          <Button key={t} variant="tab" selected={tab === t} title={t} onPress={() => setTab(t)} />
        ))}
      </View>
      {allGoals === undefined ? (
        <View style={s.center}>
          <ActivityIndicator color={c.prim} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTxt}>No {tab.toLowerCase()} goals</Text>
            </View>
          ) : (
            filtered.map((g) => {
              const counts = countMap.get(g._id);
              return (
                <GoalCard
                  key={g._id}
                  title={g.title}
                  status={g.status as "active" | "completed" | "abandoned"}
                  description={g.description}
                  targetValue={g.targetValue}
                  currentValue={g.currentValue}
                  unit={g.unit}
                  dueDate={g.dueDate}
                  taskCount={counts?.t ?? 0}
                  routineCount={counts?.r ?? 0}
                  onPress={() => setSelectedGoal(g as GoalData)}
                />
              );
            })
          )}
        </ScrollView>
      )}
      {tab === "Active" && (
        <Button
          variant="fab"
          title="+"
          style={s.fab}
          accessibilityLabel="New goal"
          onPress={() => {
            setFormKey((k) => k + 1);
            setFormVisible(true);
          }}
        />
      )}
      <GoalFormModal
        key={formKey}
        visible={formVisible}
        goal={null}
        onDone={() => setFormVisible(false)}
      />
      <GoalDetailModal
        goal={selectedGoal}
        onClose={() => setSelectedGoal(null)}
      />
    </SafeAreaView>
  );
}
