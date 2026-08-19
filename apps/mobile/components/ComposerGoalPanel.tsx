import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "../lib/theme";
import { display } from "../lib/fonts";
import { radii } from "../lib/radii";
import { GoalPickCard } from "./GoalPickCard";
import { Stepper } from "./ui/Stepper";

interface Props {
  goalId: string;
  contribution: number;
  disabled?: boolean;
  onSelect: (goalId: string) => void;
  onContributionChange: (n: number) => void;
}

/**
 * "Goal contribution" — the mobile twin of web's composer-goal-panel.tsx.
 *
 * Replaces a horizontal chip scroller that showed only titles. The cards carry
 * the same progress readout web's do, which is the point of the panel: you are
 * choosing what this item feeds, so how full that goal already is belongs in
 * the choice.
 */
export function ComposerGoalPanel({
  goalId,
  contribution,
  disabled,
  onSelect,
  onContributionChange,
}: Props) {
  const c = useColors();
  const goals = useQuery(api.goals.list, {}) ?? [];
  const selected = goals.find((g) => g._id === goalId);

  const s = StyleSheet.create({
    wrap: { gap: 10 },
    head: { flexDirection: "row", alignItems: "center", gap: 6 },
    headTxt: {
      ...display("regular"),
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: c.t3,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: radii.full,
      backgroundColor: c.tacc,
    },
    none: { fontSize: 11.5, color: c.t3 },
    list: { maxHeight: 188 },
    contrib: { borderTopWidth: 1, borderTopColor: c.bd1, paddingTop: 10 },
  });

  return (
    <View style={s.wrap}>
      <View style={s.head}>
        <View style={s.dot} />
        <Text style={s.headTxt}>Goal contribution</Text>
      </View>

      {goals.length === 0 ? (
        <Text style={s.none}>No active goals to contribute to.</Text>
      ) : (
        <ScrollView
          style={s.list}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {goals.map((g) => (
            <GoalPickCard
              key={g._id}
              title={g.title}
              currentValue={g.currentValue ?? 0}
              targetValue={g.targetValue ?? 0}
              selected={g._id === goalId}
              disabled={disabled}
              // Tapping the selected goal clears it, as on web — otherwise a
              // goal linked by mistake could not be un-linked.
              onPress={() => onSelect(g._id === goalId ? "" : g._id)}
            />
          ))}
        </ScrollView>
      )}

      {selected && (
        <View style={s.contrib}>
          <Stepper
            label="Adds toward target"
            value={contribution}
            onChange={onContributionChange}
            min={1}
            max={100000}
            suffix={selected.unit ?? undefined}
            disabled={disabled}
          />
        </View>
      )}
    </View>
  );
}
