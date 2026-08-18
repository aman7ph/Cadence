import { StyleSheet, Text, View } from "react-native";
import { useColors } from "../lib/theme";

// The day-streak pill from RoutineItem, extracted so that file stays
// within the project's 150-line limit. Cold (zero) streaks render muted.
export function StreakPill({ count }: { count: number }) {
  const c = useColors();
  const cold = count === 0;

  const s = StyleSheet.create({
    pill:     { flexDirection: "row", alignItems: "baseline", gap: 1,
                backgroundColor: c.successBg, borderRadius: 999,
                paddingHorizontal: 8, paddingVertical: 3 },
    pillCold: { backgroundColor: c.active },
    num:      { fontSize: 12, fontWeight: "700", color: c.cplt },
    unit:     { fontSize: 10, fontWeight: "600", color: c.cplt },
    cold:     { color: c.t3 },
  });

  return (
    <View style={[s.pill, cold && s.pillCold]}>
      <Text style={[s.num, cold && s.cold]}>{count}</Text>
      <Text style={[s.unit, cold && s.cold]}>d</Text>
    </View>
  );
}
