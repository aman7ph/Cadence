import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { useColors } from "../lib/theme";

interface Props {
  goalId: Id<"goals"> | "";
  contribution: string;
  disabled?: boolean;
  onGoalChange: (goalId: Id<"goals"> | "") => void;
  onContributionChange: (value: string) => void;
}

// Horizontal goal-chip scroller + targetValue-gated contribution input, the
// same field group RoutineFormModal renders inline. Renders nothing when the
// user has no goals.
export function GoalChipsField({ goalId, contribution, disabled, onGoalChange, onContributionChange }: Props) {
  const c = useColors();
  const goals = useQuery(api.goals.list, {});
  const selGoal = goals?.find((g) => g._id === goalId);

  const s = StyleSheet.create({
    mt:         { marginTop: 10 },
    goalChip:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                  borderWidth: 1, borderColor: c.bd2, marginRight: 7 },
    goalChipOn: { borderColor: c.prim, backgroundColor: c.accBg },
    goalTxt:    { fontSize: 12, color: c.t3, maxWidth: 140 },
    goalTxtOn:  { color: c.tacc, fontWeight: "600" },
    input:      { backgroundColor: c.card, borderWidth: 1, borderColor: c.bd2,
                  borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
                  fontSize: 14, color: c.t1 },
  });

  if ((goals?.length ?? 0) === 0) return null;

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.mt}>
        <TouchableOpacity onPress={() => onGoalChange("")} style={[s.goalChip, !goalId && s.goalChipOn]}>
          <Text style={[s.goalTxt, !goalId && s.goalTxtOn]}>No goal</Text>
        </TouchableOpacity>
        {goals!.map((g) => (
          <TouchableOpacity key={g._id} onPress={() => onGoalChange(g._id)}
            style={[s.goalChip, goalId === g._id && s.goalChipOn]}>
            <Text style={[s.goalTxt, goalId === g._id && s.goalTxtOn]} numberOfLines={1}>{g.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {!!goalId && selGoal?.targetValue != null && (
        <TextInput style={[s.input, s.mt]} value={contribution} onChangeText={onContributionChange}
          placeholder={selGoal.unit ?? "Contribution amount"}
          placeholderTextColor={c.t3} keyboardType="numeric" editable={!disabled} />
      )}
    </>
  );
}
