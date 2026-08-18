import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../lib/theme";
import { display } from "../lib/fonts";
import { radii } from "../lib/radii";
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
    dot: { width: 6, height: 6, borderRadius: radii.full, backgroundColor: c.tacc },
    none: { fontSize: 11.5, color: c.t3 },
    list: { maxHeight: 188 },
    card: {
      gap: 6,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: c.bd1,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 6,
    },
    cardOn: { borderColor: c.bdAcc, backgroundColor: c.accBg },
    row: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
    title: { fontSize: 12, color: c.t1, flexShrink: 1 },
    titleOn: { color: c.tacc },
    count: { fontSize: 10, color: c.t3 },
    track: { height: 3, borderRadius: radii.full, backgroundColor: c.bgS, overflow: "hidden" },
    fill: { height: 3, borderRadius: radii.full, backgroundColor: c.prim },
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
        <ScrollView style={s.list} nestedScrollEnabled keyboardShouldPersistTaps="handled">
          {goals.map((g) => {
            const on = g._id === goalId;
            const target = g.targetValue ?? 0;
            const pct = target > 0 ? Math.min(100, ((g.currentValue ?? 0) / target) * 100) : 0;
            return (
              <TouchableOpacity
                key={g._id}
                disabled={disabled}
                // Tapping the selected goal clears it, as on web — otherwise a
                // goal linked by mistake could not be un-linked.
                onPress={() => onSelect(on ? "" : g._id)}
                style={[s.card, on && s.cardOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <View style={s.row}>
                  <Text style={[s.title, on && s.titleOn]} numberOfLines={1}>{g.title}</Text>
                  <Text style={s.count}>{g.currentValue ?? 0}/{target}</Text>
                </View>
                <View style={s.track}>
                  <View style={[s.fill, { width: `${pct}%` }]} />
                </View>
              </TouchableOpacity>
            );
          })}
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
