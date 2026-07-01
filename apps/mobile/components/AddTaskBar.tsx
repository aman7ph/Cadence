import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import {
  ActivityIndicator, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import { useColors } from "../lib/theme";

interface Props { today: string }

export function AddTaskBar({ today }: Props) {
  const c = useColors();
  const create      = useMutation(api.dailyTasks.create);
  const activeGoals = useQuery(api.goals.list, {});

  const [title, setTitle]          = useState("");
  const [pending, setPending]      = useState(false);
  const [showGoal, setShowGoal]    = useState(false);
  const [goalId, setGoalId]        = useState<Id<"goals"> | null>(null);
  const [contribution, setContrib] = useState("");

  const hasGoals = (activeGoals?.length ?? 0) > 0;
  const selectedGoal = activeGoals?.find((g) => g._id === goalId);

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed || pending) return;
    setPending(true);
    try {
      await create({
        title: trimmed, today,
        goalId: goalId ?? undefined,
        goalContribution: goalId && contribution ? parseFloat(contribution) : undefined,
      });
      setTitle(""); setGoalId(null); setContrib(""); setShowGoal(false);
    } finally { setPending(false); }
  };

  const s = StyleSheet.create({
    wrap:            { gap: 6, marginTop: 4 },
    row:             { flexDirection: "row", gap: 8 },
    input:           { flex: 1, backgroundColor: c.card, borderWidth: 1, borderColor: c.bd2,
                       borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
                       fontSize: 14, color: c.t1 },
    iconBtn:         { width: 44, backgroundColor: c.card, borderWidth: 1,
                       borderColor: c.bd2, borderRadius: 10,
                       justifyContent: "center", alignItems: "center" },
    iconBtnActive:   { borderColor: c.prim, backgroundColor: c.accBg },
    iconTxt:         { fontSize: 16, color: c.t3 },
    iconTxtActive:   { color: c.tacc },
    btn:             { width: 44, backgroundColor: c.prim, borderRadius: 10,
                       justifyContent: "center", alignItems: "center" },
    btnTxt:          { color: "#fff", fontSize: 24, fontWeight: "300", lineHeight: 26 },
    goalPanel:       { backgroundColor: c.bgE, borderWidth: 1, borderColor: c.bd1,
                       borderRadius: 10, padding: 10, gap: 8 },
    goalLbl:         { fontSize: 10, fontWeight: "700", textTransform: "uppercase",
                       letterSpacing: 0.6, color: c.t2 },
    goalScroll:      { flexGrow: 0 },
    goalChip:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                       borderWidth: 1, borderColor: c.bd2, marginRight: 6 },
    goalChipActive:  { borderColor: c.prim, backgroundColor: c.accBg },
    goalChipTxt:     { fontSize: 12, color: c.t3, maxWidth: 140 },
    goalChipTxtActive: { color: c.tacc, fontWeight: "600" },
    contribInput:    { backgroundColor: c.card, borderWidth: 1, borderColor: c.bd2,
                       borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
                       fontSize: 13, color: c.t1 },
  });

  return (
    <View style={s.wrap}>
      <View style={s.row}>
        <TextInput style={s.input} placeholder="Add a task for today"
          placeholderTextColor={c.t3} value={title} onChangeText={setTitle}
          onSubmitEditing={submit} returnKeyType="done" submitBehavior="submit" editable={!pending} />
        {hasGoals && (
          <TouchableOpacity onPress={() => setShowGoal((v) => !v)}
            style={[s.iconBtn, showGoal && s.iconBtnActive]} hitSlop={8}>
            <Text style={[s.iconTxt, showGoal && s.iconTxtActive]}>◎</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={submit} disabled={pending} style={s.btn} activeOpacity={0.8}>
          {pending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnTxt}>+</Text>}
        </TouchableOpacity>
      </View>
      {showGoal && hasGoals && (
        <View style={s.goalPanel}>
          <Text style={s.goalLbl}>Link to goal</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.goalScroll}>
            <TouchableOpacity style={[s.goalChip, !goalId && s.goalChipActive]} onPress={() => setGoalId(null)}>
              <Text style={[s.goalChipTxt, !goalId && s.goalChipTxtActive]}>None</Text>
            </TouchableOpacity>
            {activeGoals!.map((g) => (
              <TouchableOpacity key={g._id} style={[s.goalChip, goalId === g._id && s.goalChipActive]}
                onPress={() => setGoalId(g._id)}>
                <Text style={[s.goalChipTxt, goalId === g._id && s.goalChipTxtActive]} numberOfLines={1}>
                  {g.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {goalId && selectedGoal?.targetValue != null && (
            <TextInput style={s.contribInput} value={contribution} onChangeText={setContrib}
              placeholder={`Contribution (${selectedGoal.unit ?? "units"})`}
              placeholderTextColor={c.t3} keyboardType="numeric" />
          )}
        </View>
      )}
    </View>
  );
}
