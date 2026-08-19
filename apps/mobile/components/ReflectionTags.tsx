import { StyleSheet, View } from "react-native";
import { parseMentionSegments } from "@cadence/shared";
import { Badge } from "./ui/Badge";

interface Props {
  text: string;
  routineIds: string[];
}

/**
 * The chips listing what a saved reflection mentions.
 *
 * Deriving them from the text rather than storing a list keeps the chips honest
 * when a mention is edited out. Routines take the accent tone, tasks the
 * carryover neutral — the same pairing the prose itself uses.
 */
export function ReflectionTags({ text, routineIds }: Props) {
  const rSet = new Set(routineIds);
  const seen = new Set<string>();

  const tagged = parseMentionSegments(text).flatMap((seg) => {
    if (seg.kind !== "mention" || seen.has(seg.id)) return [];
    seen.add(seg.id);
    return [{ id: seg.id, name: seg.name, isRoutine: rSet.has(seg.id) }];
  });

  if (tagged.length === 0) return null;

  const s = StyleSheet.create({
    list: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  });

  return (
    <View style={s.list}>
      {tagged.map((t) => (
        <Badge key={t.id} tone={t.isRoutine ? "accent" : "carryover"}>
          {t.name}
        </Badge>
      ))}
    </View>
  );
}
