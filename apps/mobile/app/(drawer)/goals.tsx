import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppBar } from "../../components/AppBar";
import { GoalCard } from "../../components/GoalCard";
import { GoalFormModal } from "../../components/GoalFormModal";
import { GoalDetailModal } from "../../components/GoalDetailModal";
import type { GoalData } from "../../components/GoalDetailModal";
import { useColors } from "../../lib/theme";

const TABS = ["Active", "Completed", "Abandoned"] as const;
type Tab = typeof TABS[number];
const STATUS: Record<Tab, string> = { Active: "active", Completed: "completed", Abandoned: "abandoned" };

export default function GoalsScreen() {
  const c = useColors();
  const allGoals   = useQuery(api.goals.list, { includeInactive: true });
  const withCounts = useQuery(api.goalLinks.getWithLinkedCounts);
  const countMap   = new Map((withCounts ?? []).map((g) => [g.goal._id, { t: g.taskCount, r: g.routineCount }]));

  const [tab, setTab]                       = useState<Tab>("Active");
  const [formKey, setFormKey]               = useState(0);
  const [formVisible, setFormVisible]       = useState(false);
  const [selectedGoal, setSelectedGoal]     = useState<GoalData | null>(null);

  const filtered = (allGoals ?? []).filter((g) => g.status === STATUS[tab]);

  const s = StyleSheet.create({
    screen:   { flex: 1, backgroundColor: c.bg },
    tabs:     { flexDirection: "row", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, gap: 8 },
    tab:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: c.bd2 },
    tabOn:    { backgroundColor: c.prim, borderColor: c.prim },
    tabTxt:   { fontSize: 13, fontWeight: "500", color: c.t2 },
    tabTxtOn: { color: "#fff", fontWeight: "600" },
    content:  { paddingTop: 8, paddingBottom: 100 },
    center:   { flex: 1, alignItems: "center", justifyContent: "center" },
    empty:    { margin: 24, borderWidth: 1, borderStyle: "dashed", borderColor: c.bd1,
                borderRadius: 14, paddingVertical: 40, alignItems: "center" },
    emptyTxt: { fontSize: 13, color: c.t3 },
    fab:      { position: "absolute", bottom: 28, right: 18, width: 50, height: 50,
                borderRadius: 25, backgroundColor: c.prim, justifyContent: "center", alignItems: "center",
                shadowColor: c.prim, shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
    fabTxt:   { color: "#fff", fontSize: 26, fontWeight: "300", lineHeight: 28, includeFontPadding: false },
  });

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <AppBar title="Goals" />
      <View style={s.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabOn]} onPress={() => setTab(t)} activeOpacity={0.8}>
            <Text style={[s.tabTxt, tab === t && s.tabTxtOn]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {allGoals === undefined ? (
        <View style={s.center}><ActivityIndicator color={c.prim} /></View>
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
                <GoalCard key={g._id}
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
        <TouchableOpacity style={s.fab} onPress={() => { setFormKey((k) => k + 1); setFormVisible(true); }} activeOpacity={0.85}>
          <Text style={s.fabTxt}>+</Text>
        </TouchableOpacity>
      )}
      <GoalFormModal key={formKey} visible={formVisible} goal={null} onDone={() => setFormVisible(false)} />
      <GoalDetailModal goal={selectedGoal} onClose={() => setSelectedGoal(null)} />
    </SafeAreaView>
  );
}
