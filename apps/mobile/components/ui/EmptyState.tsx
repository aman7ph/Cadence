import { StyleSheet, Text, View } from "react-native";
import { useColors } from "../../lib/theme";
import { radii } from "../../lib/radii";

/**
 * The dashed "nothing here yet" box.
 *
 * Routines, Staging and Goals each had their own copy with the same dashed
 * border and radius, differing only in padding — which is drift, not intent.
 */
export function EmptyState({ children }: { children: string }) {
  const c = useColors();

  const s = StyleSheet.create({
    box: {
      marginHorizontal: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: c.bd1,
      borderStyle: "dashed",
      borderRadius: radii.md,
      paddingVertical: 32,
      paddingHorizontal: 20,
      alignItems: "center",
    },
    txt: { fontSize: 13, color: c.t3, textAlign: "center" },
  });

  return (
    <View style={s.box}>
      <Text style={s.txt}>{children}</Text>
    </View>
  );
}
