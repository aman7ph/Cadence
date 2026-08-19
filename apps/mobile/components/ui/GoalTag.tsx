import { StyleSheet, Text, View } from "react-native";
import { useColors } from "../../lib/theme";
import { radii } from "../../lib/radii";

/**
 * The gold pill naming the goal a row feeds.
 *
 * Four rows declared this. Two of them (Routines, Staging) carry the measured
 * spec — 9px, 0.27 tracking, 8px padding — while Today's two rows still had the
 * pre-measurement 10px version. This is the measured one; see the refactor log,
 * since converging them changes how Today's tags look.
 */
export function GoalTag({
  children,
  spaced = true,
}: {
  children: string;
  /** Row layouts that already gap their children pass `spaced={false}`. */
  spaced?: boolean;
}) {
  const c = useColors();

  const s = StyleSheet.create({
    pill: {
      alignSelf: "flex-start",
      backgroundColor: c.accBg,
      borderRadius: radii.pill,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    txt: { fontSize: 9, fontWeight: "600", color: c.tacc, letterSpacing: 0.27 },
  });

  return (
    <View style={[s.pill, spaced && { marginTop: 2 }]}>
      <Text style={s.txt} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}
