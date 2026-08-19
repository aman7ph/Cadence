import { StyleSheet, Text, View } from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { MentionText } from "./MentionText";
import { SectionLabel } from "./ui/SectionLabel";

export function HistoryDayReflection({
  reflection,
}: {
  reflection?: {
    text: string;
    taggedRoutineIds: string[];
    taggedTaskIds: string[];
  } | null;
}) {
  const c = useColors();

  const s = StyleSheet.create({
    hdr: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
    card: {
      marginHorizontal: 16,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.bd1,
      borderRadius: radii.md,
      padding: 14,
    },
    // Not ui/EmptyState: that is a centred "nothing here" box for a whole list,
    // this is a left-aligned italic note standing in for prose. Web draws the
    // same distinction in history-reflection.tsx.
    empty: {
      marginHorizontal: 16,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: c.bd1,
      borderRadius: radii.md,
      padding: 14,
    },
    emptyTxt: { fontSize: 13, color: c.t3, fontStyle: "italic" },
  });

  return (
    <>
      <View style={s.hdr}>
        <SectionLabel>Reflection</SectionLabel>
      </View>
      {reflection ? (
        <View style={s.card}>
          <MentionText
            text={reflection.text}
            routineIds={reflection.taggedRoutineIds}
            taskIds={reflection.taggedTaskIds}
            fontSize={13}
            lineHeight={20}
          />
        </View>
      ) : (
        <View style={s.empty}>
          <Text style={s.emptyTxt}>No reflection written for this day.</Text>
        </View>
      )}
    </>
  );
}
