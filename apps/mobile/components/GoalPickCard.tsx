import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";

interface Props {
  title: string;
  currentValue: number;
  targetValue: number;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}

/**
 * One goal in the composer's picker: title, progress readout, progress bar.
 *
 * The bar is the point of the card — you are choosing what an item feeds, so
 * how full that goal already is belongs in the choice.
 */
export function GoalPickCard({
  title,
  currentValue,
  targetValue,
  selected,
  disabled,
  onPress,
}: Props) {
  const c = useColors();
  const pct =
    targetValue > 0 ? Math.min(100, (currentValue / targetValue) * 100) : 0;

  const s = StyleSheet.create({
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
    row: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 8,
    },
    title: { fontSize: 12, color: c.t1, flexShrink: 1 },
    titleOn: { color: c.tacc },
    count: { fontSize: 10, color: c.t3 },
    track: {
      height: 3,
      borderRadius: radii.full,
      backgroundColor: c.bgS,
      overflow: "hidden",
    },
    fill: { height: 3, borderRadius: radii.full, backgroundColor: c.prim },
  });

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[s.card, selected && s.cardOn]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View style={s.row}>
        <Text style={[s.title, selected && s.titleOn]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={s.count}>
          {currentValue}/{targetValue}
        </Text>
      </View>
      <View style={s.track}>
        <View style={[s.fill, { width: `${pct}%` }]} />
      </View>
    </TouchableOpacity>
  );
}
