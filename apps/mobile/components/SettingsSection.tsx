import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { SectionLabel } from "./ui/SectionLabel";

/**
 * A labelled card on the Settings screen — the counterpart to web's `Section`
 * in settings-sections.tsx.
 *
 * The label-then-card pair was repeated five times inline, which is why the
 * screen was 210 lines: the wrapper, not the content, was most of it.
 */
export function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const c = useColors();

  const s = StyleSheet.create({
    labelWrap: { marginBottom: 6, marginLeft: 4 },
    card: {
      backgroundColor: c.card,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.bd1,
      overflow: "hidden",
      marginBottom: 20,
    },
  });

  return (
    <>
      <View style={s.labelWrap}>
        <SectionLabel>{title}</SectionLabel>
      </View>
      <View style={s.card}>{children}</View>
    </>
  );
}
