import { StyleSheet, Text, View } from "react-native";
import { useColors } from "../../lib/theme";
import { radii } from "../../lib/radii";

interface Props {
  done: boolean;
  /** Routines can be excused for a day; tasks cannot. */
  skipped?: boolean;
  dimmed?: boolean;
}

/**
 * The 22px completion circle on every row.
 *
 * Filled with the accent, not green, and the tick takes `onPrim` — the design
 * has no green in it at all, so "done" and "primary action" share a hue by
 * intent. `RoutineItem` and `TaskItem` declared this identically.
 */
export function CompletionCircle({ done, skipped, dimmed }: Props) {
  const c = useColors();

  const s = StyleSheet.create({
    circle: {
      width: 22,
      height: 22,
      borderRadius: radii.full,
      borderWidth: 1.5,
      borderColor: c.bd3,
      justifyContent: "center",
      alignItems: "center",
    },
    done: { backgroundColor: c.cplt, borderColor: c.cplt },
    skip: { borderColor: c.t3 },
    tick: { color: c.onPrim, fontSize: 11, fontWeight: "700" },
    skipBar: { width: 10, height: 1.5, borderRadius: 1, backgroundColor: c.t3 },
  });

  return (
    <View
      style={[
        s.circle,
        done && s.done,
        skipped && s.skip,
        dimmed && { opacity: 0.4 },
      ]}
    >
      {done && <Text style={s.tick}>✓</Text>}
      {skipped && !done && <View style={s.skipBar} />}
    </View>
  );
}
